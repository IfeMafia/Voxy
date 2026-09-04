"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWallet, useLedger, useInvalidators } from "@/hooks/useBusinessData";
import { requestWithdrawal } from "@/lib/api/business";
import { SkeletonCard, RefreshIndicator } from "@/components/ui/Skeleton";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Send,
  X,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-hot-toast";

function formatNGN(koboAmount) {
  if (koboAmount == null) return "?0";
  const naira = Number(koboAmount) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}

const NIGERIAN_BANKS = [
  { code: "058", name: "GTBank (Guaranty Trust)" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "090110", name: "Kuda Bank" },
];

function LedgerTypePill({ type, isCredit }) {
  if (isCredit) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20">
        {type || "payment"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-white/5 text-zinc-400 border-white/10">
      {type || "withdrawal"}
    </span>
  );
}

function PayoutDrawer({ wallet, onClose, onSuccess }) {
  const { user } = useAuth();
  const { invalidateWallet, invalidateLedger } = useInvalidators();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    bankCode: "058",
    accountName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const inputCls =
    "w-full h-10 bg-white/[0.03] border border-white/[0.08] focus:border-[#00D18F]/50 focus:outline-none rounded-lg px-3 text-xs text-white placeholder:text-zinc-600 transition-colors";
  const labelCls =
    "text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5";

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountKobo = Math.round(Number(withdrawAmount) * 100);
    if (!amountKobo || amountKobo <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amountKobo > (wallet.availableBalanceKobo || 0)) {
      toast.error("Insufficient available balance");
      return;
    }
    if (!bankDetails.accountNumber || bankDetails.accountNumber.length < 10) {
      toast.error("Enter a valid 10-digit account number");
      return;
    }
    setSubmitting(true);
    try {
      await requestWithdrawal({
        amountKobo,
        bankCode: bankDetails.bankCode,
        accountNumber: bankDetails.accountNumber,
        accountName:
          bankDetails.accountName || user?.name || "Business Account",
        idempotencyKey: `wd_${Date.now()}`,
      });
      toast.success("Withdrawal request submitted");
      if (user?.id) {
        invalidateWallet(user.id);
        invalidateLedger(user.id);
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Failed to request withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="w-full max-w-md bg-[#0a0a0a] border-l border-white/[0.07] h-full overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 bg-[#0a0a0a] z-10">
          <div>
            <h2 className="font-semibold text-white text-sm">Request Payout</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Disbursed to your registered Nigerian bank account.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between">
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-xs text-zinc-400">Available to withdraw</span>
              <span className="text-sm font-bold text-[#00D18F] tabular-nums">
                {formatNGN(wallet.availableBalanceKobo)}
              </span>
            </div>

            <div>
              <label className={labelCls}>Amount (?)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 50,000"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Account Number</label>
              <input
                type="text"
                maxLength={10}
                placeholder="10-digit account number"
                value={bankDetails.accountNumber}
                onChange={(e) =>
                  setBankDetails((p) => ({
                    ...p,
                    accountNumber: e.target.value,
                  }))
                }
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Bank</label>
              <select
                value={bankDetails.bankCode}
                onChange={(e) =>
                  setBankDetails((p) => ({ ...p, bankCode: e.target.value }))
                }
                className={inputCls + " bg-black"}
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Account Name</label>
              <input
                type="text"
                placeholder="As on your bank card"
                value={bankDetails.accountName}
                onChange={(e) =>
                  setBankDetails((p) => ({
                    ...p,
                    accountName: e.target.value,
                  }))
                }
                className={inputCls}
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-col gap-2">
              <button
                type="submit"
                disabled={
                  submitting || (wallet.availableBalanceKobo || 0) <= 0
                }
                className="w-full h-11 bg-[#00D18F] text-black font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-[#00D18F]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Send className="size-3.5" /> Confirm payout
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 border border-white/[0.09] text-zinc-400 font-semibold text-xs uppercase tracking-wider rounded-xl hover:text-white hover:bg-white/[0.03] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { user } = useAuth();
  const {
    data: walletData,
    isLoading: loadingWallet,
    isFetching: fetchingWallet,
    refetch: refetchWallet,
  } = useWallet(user?.id);
  const {
    data: transactions = [],
    isLoading: loadingLedger,
    isFetching: fetchingLedger,
    refetch: refetchLedger,
  } = useLedger(user?.id);

  const wallet = walletData || {
    balanceKobo: 0,
    availableBalanceKobo: 0,
    pendingBalanceKobo: 0,
  };
  const isFetching = fetchingWallet || fetchingLedger;

  const [showPayout, setShowPayout] = useState(false);

  const creditTotal = transactions
    .filter((t) => t.type === "credit" || t.amountKobo > 0)
    .reduce((s, t) => s + Math.abs(t.amountKobo || 0), 0);
  const debitTotal = transactions
    .filter((t) => t.type !== "credit" && t.amountKobo <= 0)
    .reduce((s, t) => s + Math.abs(t.amountKobo || 0), 0);

  return (
    <DashboardLayout title="Wallet">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Wallet</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {loadingWallet
                ? "Loading�"
                : `Settlement balance and ${transactions.length} transactions`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshIndicator isFetching={isFetching} />
            <button
              onClick={() => setShowPayout(true)}
              disabled={(wallet.availableBalanceKobo || 0) <= 0 || loadingWallet}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-[#00D18F] text-black text-xs font-bold hover:bg-[#00D18F]/90 transition-colors disabled:opacity-40"
            >
              <Send className="size-3.5" /> Request payout
            </button>
          </div>
        </div>

        {/* Metric cards */}
        {loadingWallet ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Total Balance
              </span>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {formatNGN(wallet.balanceKobo ?? wallet.availableBalanceKobo)}
              </div>
              <span className="text-[10px] text-zinc-600 mt-0.5 block">
                Combined settled revenue
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Available
              </span>
              <div className="text-xl font-bold text-[#00D18F] mt-1 tabular-nums">
                {formatNGN(wallet.availableBalanceKobo)}
              </div>
              <span className="text-[10px] text-zinc-600 mt-0.5 block">
                Ready to withdraw
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Pending
              </span>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {formatNGN(wallet.pendingBalanceKobo)}
              </div>
              <span className="text-[10px] text-zinc-600 mt-0.5 block">
                Clearing &amp; in escrow
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Total In
              </span>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {formatNGN(creditTotal)}
              </div>
              <span className="text-[10px] text-zinc-600 mt-0.5 block">
                Across {transactions.filter((t) => t.amountKobo > 0).length} credits
              </span>
            </div>
          </div>
        )}

        {/* Ledger */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div>
              <span className="text-sm font-semibold text-white">
                Transaction history
              </span>
              {!loadingLedger && (
                <span className="ml-2 text-xs text-zinc-600">
                  {transactions.length} transactions
                </span>
              )}
            </div>
            {!loadingLedger && transactions.length > 0 && (
              <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5 text-[#00D18F]">
                  <ArrowDownLeft className="size-3" /> {formatNGN(creditTotal)} in
                </span>
                <span className="flex items-center gap-1.5">
                  <ArrowUpRight className="size-3" /> {formatNGN(debitTotal)} out
                </span>
              </div>
            )}
          </div>

          {loadingLedger ? (
            <div className="space-y-2 pt-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/[0.02] border border-white/[0.04] animate-pulse"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl mt-4">
              <TrendingUp className="size-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-400 font-medium mb-1">
                No transactions yet
              </p>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                Customer payments and settlement events will appear here
                automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block rounded-2xl border border-white/[0.07] overflow-hidden mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Description", "Type", "Date", "Amount", "Balance after"].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600 px-4 py-3"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => {
                      const isCredit =
                        tx.type === "credit" ||
                        (tx.amountKobo && tx.amountKobo > 0);
                      const date = new Date(tx.createdAt);
                      return (
                        <tr
                          key={tx.id}
                          className={`hover:bg-white/[0.015] transition-colors ${
                            i > 0 ? "border-t border-white/[0.04]" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-white text-sm">
                              {tx.description ||
                                (isCredit
                                  ? "Customer payment received"
                                  : "Settlement withdrawal")}
                            </div>
                            {tx.reference && (
                              <div className="text-[11px] text-zinc-600 font-mono">
                                {tx.reference}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <LedgerTypePill
                              type={
                                tx.source ||
                                (isCredit ? "payment" : "withdrawal")
                              }
                              isCredit={isCredit}
                            />
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {date.toLocaleDateString("en-NG", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            <div className="text-zinc-700">
                              {date.toLocaleTimeString("en-NG", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-bold font-mono tabular-nums text-sm ${
                                isCredit ? "text-[#00D18F]" : "text-zinc-300"
                              }`}
                            >
                              {isCredit ? "+" : "-"}
                              {formatNGN(Math.abs(tx.amountKobo || 0))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 font-mono tabular-nums">
                            {tx.balanceAfterKobo != null
                              ? formatNGN(tx.balanceAfterKobo)
                              : "�"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="sm:hidden rounded-2xl border border-white/[0.07] overflow-hidden mt-4">
                {transactions.map((tx, i) => {
                  const isCredit =
                    tx.type === "credit" ||
                    (tx.amountKobo && tx.amountKobo > 0);
                  const date = new Date(tx.createdAt);
                  return (
                    <div
                      key={tx.id}
                      className={`flex flex-col px-4 py-3.5 gap-1 ${
                        i > 0 ? "border-t border-white/[0.04]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate max-w-[60%]">
                          {tx.description ||
                            (isCredit ? "Payment received" : "Withdrawal")}
                        </span>
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            isCredit ? "text-[#00D18F]" : "text-zinc-300"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatNGN(Math.abs(tx.amountKobo || 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LedgerTypePill
                          type={
                            tx.source || (isCredit ? "payment" : "withdrawal")
                          }
                          isCredit={isCredit}
                        />
                        <span className="text-[11px] text-zinc-600">
                          {date.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {showPayout && (
        <PayoutDrawer
          wallet={wallet}
          onClose={() => setShowPayout(false)}
          onSuccess={() => setShowPayout(false)}
        />
      )}
    </DashboardLayout>
  );
}
