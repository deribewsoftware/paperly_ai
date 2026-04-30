import { v2 as cloudinary } from "cloudinary";

type UploadInput = {
  buffer: Buffer;
  folder?: string;
  publicId?: string;
  resourceType?: "auto" | "image" | "video" | "raw";
  mimeType: string;
};

function hasCloudinaryEnv() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function assertCloudinaryEnv() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are not fully configured.");
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  return hasCloudinaryEnv();
}

export async function uploadBufferToCloudinary({
  buffer,
  folder = "paperly_ai",
  publicId,
  resourceType = "auto",
  mimeType,
}: UploadInput) {
  assertCloudinaryEnv();

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  return cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: resourceType,
  });
}
