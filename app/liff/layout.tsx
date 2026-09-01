import type { ReactNode } from "react";
import { LiffProvider } from "@/lib/line/LiffProvider";

export default function LiffLayout({ children }: { children: ReactNode }) {
  return (
    <LiffProvider>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gray-50 px-4 py-6">
        {children}
      </div>
    </LiffProvider>
  );
}
