import { connectToDatabase } from "@/lib/db";
import { getPlanLimit, type UsageAction, type UserPlan } from "@/lib/limits/plans";
import UsageRecordModel from "@/models/UsageRecord";

function getMonthKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getActionCounterField(action: UsageAction) {
  if (action === "generate") {
    return "generateCount";
  }
  if (action === "export") {
    return "exportCount";
  }
  return "uploadCount";
}

export async function getUsageSnapshot(userId: string, plan: UserPlan) {
  await connectToDatabase();
  const monthKey = getMonthKey();
  const usage = await UsageRecordModel.findOneAndUpdate(
    { userId, monthKey },
    {
      $setOnInsert: {
        generateCount: 0,
        exportCount: 0,
        uploadCount: 0,
      },
      $set: {
        plan,
      },
    },
    { upsert: true, returnDocument: "after" }
  ).lean();

  return usage;
}

export async function enforceUsageLimit(
  userId: string,
  plan: UserPlan,
  action: UsageAction
) {
  const usage = await getUsageSnapshot(userId, plan);
  const field = getActionCounterField(action);
  const used = usage?.[field] ?? 0;
  const limit = getPlanLimit(plan, action);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(limit - used, 0),
  };
}

export async function incrementUsage(
  userId: string,
  plan: UserPlan,
  action: UsageAction
) {
  await connectToDatabase();
  const monthKey = getMonthKey();
  const field = getActionCounterField(action);

  await UsageRecordModel.findOneAndUpdate(
    { userId, monthKey },
    {
      $setOnInsert: {
        generateCount: 0,
        exportCount: 0,
        uploadCount: 0,
      },
      $set: {
        plan,
      },
      $inc: {
        [field]: 1,
      },
    },
    { upsert: true }
  );
}
