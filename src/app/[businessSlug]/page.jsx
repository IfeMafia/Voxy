"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import PublicVoxyChat from "@/components/business/PublicVoxyChat";
import { Loader2 } from "lucide-react";
import { getBusinessBySlug } from "@/lib/api/business";

export default function BusinessStorefrontPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { businessSlug } = params;

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getBusinessBySlug(businessSlug);
        if (mounted) {
          setBusiness(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [businessSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060709] flex flex-col items-center justify-center p-6 text-white">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-[#00D18F]" />
        </div>
        <p className="mt-4 text-zinc-400 font-semibold uppercase tracking-widest text-[11px]">Connecting to storefront...</p>
      </div>
    );
  }

  if (error || !business) {
    notFound();
  }

  return <PublicVoxyChat business={business} />;
}
