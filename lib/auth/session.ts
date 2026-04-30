import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const id = user?.id;
  const email = user?.email;

  if (!id || !email) {
    return null;
  }

  return {
    id,
    email,
    name: user?.name ?? "Paperly User",
    image: user?.image ?? undefined,
  };
}
