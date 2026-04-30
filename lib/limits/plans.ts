export type UserPlan = "free" | "pro" | "team" | "enterprise";
export type UsageAction = "generate" | "export" | "upload";

type PlanLimit = {
  generate: number;
  export: number;
  upload: number;
};

export const planLimits: Record<UserPlan, PlanLimit> = {
  free: {
    generate: 50,
    export: 30,
    upload: 20,
  },
  pro: {
    generate: 1000,
    export: 1000,
    upload: 600,
  },
  team: {
    generate: 5000,
    export: 5000,
    upload: 3000,
  },
  enterprise: {
    generate: 50000,
    export: 50000,
    upload: 30000,
  },
};

export function getPlanLimit(plan: UserPlan, action: UsageAction) {
  return planLimits[plan][action];
}
