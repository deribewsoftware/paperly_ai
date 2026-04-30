"use client";

import { motion } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import { FiLogIn, FiLogOut, FiUser } from "react-icons/fi";

export function AuthControls() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
        <FiUser className="h-4 w-4" />
        Checking account...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={() => signIn("google")}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
      >
        <FiLogIn className="h-4 w-4" />
        Sign in with Google
      </motion.button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex max-w-[220px] items-center gap-2 truncate rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
        <FiUser className="h-4 w-4 shrink-0" />
        <span className="truncate">
          {session.user.name ?? session.user.email ?? "Signed in"}
        </span>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <FiLogOut className="h-4 w-4" />
        Sign out
      </motion.button>
    </div>
  );
}
