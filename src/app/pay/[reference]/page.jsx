"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ShieldCheck, CheckCircle2, CreditCard, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const reference = params?.reference || "PAY_TEST_DEMO";
  const amountParam = searchParams.get("amount");
  const amountNumber = amountParam ? parseFloat(amountParam) : 15000;
  const formattedAmount = amountNumber > 1000 ? amountNumber.toLocaleString() : (amountNumber * 100).toLocaleString();

  const [status, setStatus] = useState("pending"); // "pending" | "processing" | "success"
  const [email, setEmail] = useState("customer@voxy.app");

  const handlePayNow = async (e) => {
    e.preventDefault();
    setStatus("processing");

    setTimeout(() => {
      setStatus("success");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-[#12141A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[#00D18F]/20 flex items-center justify-center">
              <Building2 className="size-4 text-[#00D18F]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Voxy Store Checkout</h1>
              <p className="text-[11px] text-zinc-400">Order Ref: <span className="font-mono text-zinc-300">{reference}</span></p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00D18F]/10 text-[10px] font-bold text-[#00D18F] border border-[#00D18F]/20">
            <ShieldCheck className="size-3" />
            <span>Secure</span>
          </div>
        </div>

        {status === "success" ? (
          <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="size-16 rounded-full bg-[#00D18F]/20 border border-[#00D18F]/40 flex items-center justify-center text-[#00D18F]">
              <CheckCircle2 className="size-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Payment Successful!</h2>
            <p className="text-xs text-zinc-400 max-w-xs">
              Thank you! Your payment of <strong className="text-white">₦{formattedAmount}</strong> has been received and verified.
            </p>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 w-full text-left text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Reference:</span>
                <span className="font-mono text-zinc-200">{reference}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Status:</span>
                <span className="font-semibold text-[#00D18F]">VERIFIED & PAID</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 pt-2">You can close this window and return to your chat or call.</p>
          </div>
        ) : (
          <form onSubmit={handlePayNow} className="space-y-5">
            <div className="text-center py-4 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold mb-1">Total Amount Due</p>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">₦{formattedAmount}</h2>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-xs font-medium text-zinc-300">Customer Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00D18F]"
                placeholder="enter email for payment receipt"
              />
            </div>

            <button
              type="submit"
              disabled={status === "processing"}
              className="w-full py-3.5 px-4 rounded-xl bg-[#00D18F] hover:bg-[#00b87d] active:scale-[0.98] text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#00D18F]/20 disabled:opacity-50"
            >
              {status === "processing" ? (
                <>
                  <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="size-4" />
                  <span>Pay ₦{formattedAmount} Now</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-[11px] text-zinc-500 flex items-center justify-center gap-1">
                <ShieldCheck className="size-3.5 text-zinc-400" />
                256-bit Encrypted Checkout • Voxy Gateway
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
