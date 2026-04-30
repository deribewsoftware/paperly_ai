"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";

import { store } from "@/lib/redux/store";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <Provider store={store}>{children}</Provider>
    </SessionProvider>
  );
}
