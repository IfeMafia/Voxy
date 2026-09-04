"use client";

import { use, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ChatContent } from "@/app/business/conversation/page";

export default function PublicBusinessChatPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { businessSlug } = params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-6 animate-spin text-[#00D18F]" />
          <p className="text-xs text-zinc-500 font-medium">Connecting to Storefront...</p>
        </div>
      }
    >
      <ChatContent slugOverride={businessSlug} />
    </Suspense>
  );
}
