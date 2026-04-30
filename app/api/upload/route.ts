import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { enforceUsageLimit, incrementUsage } from "@/lib/limits/usage";
import { ensureUserProfile, getUserPlan } from "@/lib/users/profile";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    await ensureUserProfile(authenticatedUser);
    const plan = await getUserPlan(authenticatedUser.id);
    const usageCheck = await enforceUsageLimit(authenticatedUser.id, plan, "upload");
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Monthly upload limit reached for your current plan.",
          usage: usageCheck,
          plan,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please provide a file field in multipart/form-data." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary({
      buffer,
      folder: "paperly_ai/uploads",
      mimeType: file.type || "application/octet-stream",
    });

    await incrementUsage(authenticatedUser.id, plan, "upload");

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      originalFileName: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      usage: usageCheck,
      plan,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
