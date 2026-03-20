"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { 
  Wallet, 
  CreditCard, 
  History, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * WalletPage - Manages business credits and transaction history
 */
export default function WalletPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [purchasing, setPurchasing] = useState(false);

  // Fetch Wallet state from backend
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/business/wallet');
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Fetch wallet error:', err);
      toast.error('Could not load wallet data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  // Handle Paystack purchase initialization
  const handlePurchase = async () => {
    if (purchaseAmount < 10) {
      toast.error('Minimum purchase is 10 credits');
      return;
    }
    
    try {
      setPurchasing(true);
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: purchaseAmount })
      });
      const data = await res.json();
      
      if (data.success && data.authorization_url) {
        toast.loading('Redirecting to secure payment...');
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.error || 'Payment initialization failed.');
      }
    } catch (err) {
      toast.error('Network error during checkout.');
    } finally {
      setPurchasing(false);
    }
  };

  // UI States
  if (loading && !balance && !transactions.length) {
    return (
      <DashboardLayout title="Wallet">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Wallet">
      <div className="max-w-[1200px] mx-auto space-y-8 py-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
           <h1 className="text-2xl font-bold tracking-tight">Money & credits</h1>
           <p className="text-zinc-500 text-sm">Check your credits and see how you used them.</p>
        </div>

        {/* Actionable Warning: Low Balance */}
        {balance < 10 && !loading && (
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-4 items-center animate-in zoom-in-95 duration-300">
             <div className="bg-orange-500/10 p-2 rounded-full">
               <AlertCircle className="text-orange-500 w-5 h-5" />
             </div>
             <div className="flex-1">
               <p className="text-zinc-900 dark:text-zinc-100 text-sm font-semibold">Low credit balance</p>
               <p className="text-zinc-500 text-xs">Your AI responses will stop functioning when balance reaches 0. Re-up now to avoid service interruption.</p>
             </div>
             <button 
                onClick={() => document.getElementById('buy-input').focus()}
                className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-white/5 px-4 py-2 rounded-lg hover:bg-voxy-primary/10 transition-colors"
             >
               Add now
             </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Balance & Buy (Col: 4) */}
          <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
            
            {/* Current Balance Card */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-3xl p-8 shadow-sm relative overflow-hidden transition-colors duration-500">
               <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 opacity-[0.02] dark:opacity-[0.05] rotate-12">
                  <Wallet size={160} />
               </div>
               <p className="text-zinc-500 text-[11px] font-semibold mb-2">Available credits</p>
               <div className="flex items-baseline gap-3">
                 <span className="text-6xl font-black text-zinc-900 dark:text-white">{balance}</span>
                 <span className="text-zinc-400 font-medium">units</span>
               </div>
                <div className="mt-8 flex items-center gap-2 text-zinc-500 text-[11px] bg-zinc-50 dark:bg-white/[0.03] rounded-lg p-3">
                   <AlertCircle size={14} className="text-voxy-primary" />
                   <span>1 Credit = 1 native AI response</span>
                </div>
            </div>

            {/* Simulated Buy Section */}
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-3xl p-8 shadow-sm group transition-all duration-500">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-voxy-primary" />
                Purchase top-up
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[11px] font-semibold text-zinc-500 ml-1">Credits to add</label>
                   <div className="relative">
                      <input 
                        id="buy-input"
                        type="number" 
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-zinc-50 dark:bg-white/[0.03] border-2 border-transparent focus:border-voxy-primary focus:ring-0 rounded-2xl px-5 py-4 text-xl font-black transition-all"
                        placeholder="0"
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold pointer-events-none">
                        CR
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                   {[100, 500, 2000].map(amt => (
                     <button 
                       key={amt}
                       onClick={() => setPurchaseAmount(amt)}
                       className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all ${purchaseAmount === amt ? 'bg-voxy-primary border-voxy-primary text-black' : 'bg-transparent border-zinc-200 dark:border-[#222222] text-zinc-500 hover:border-voxy-primary/50'}`}
                     >
                       {amt}
                     </button>
                   ))}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handlePurchase}
                    disabled={purchasing || purchaseAmount <= 0}
                    className="w-full bg-[#00D18F] hover:bg-[#00D18F]/90 active:scale-[0.98] disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 border border-white/5"
                  >
                    {purchasing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Buy credits</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-zinc-400 mt-4 leading-relaxed px-4">
                    Credits never expire. Payments are for testing only.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Transactions (Col: 8) */}
          <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-3xl p-8 shadow-sm min-h-[500px] transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <History className="w-6 h-6 text-voxy-primary" />
                    Activity
                  </h3>
                  <p className="text-[11px] font-medium text-zinc-500 mt-1">Details of your credit use and payments.</p>
                </div>
              </div>

              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-4 opacity-50">
                   <div className="p-6 bg-zinc-50 dark:bg-[#0A0A0A] rounded-3xl">
                     <History size={48} />
                   </div>
                   <div className="text-center">
                     <p className="font-bold text-zinc-900 dark:text-zinc-100">No activity yet</p>
                     <p className="text-xs">Your purchase and usage history will appear here.</p>
                   </div>
                </div>
              ) : (
                <div className="space-y-3">
                   {transactions.map((tx) => (
                     <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-4 rounded-2xl border border-zinc-50 dark:border-[#222222] hover:bg-zinc-50 dark:hover:bg-[#0A0A0A]/50 transition-all group"
                     >
                       <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-2xl ${tx.type === 'credit_purchase' ? 'bg-voxy-primary/10 text-voxy-primary' : 'bg-red-500/10 text-red-400'}`}>
                             {tx.type === 'credit_purchase' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                           </div>
                          <div>
                             <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                               {tx.type.replace('_', ' ').charAt(0).toUpperCase() + tx.type.replace('_', ' ').slice(1)}
                             </p>
                            <p className="text-[10px] font-medium text-zinc-400">
                              {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                       </div>
                       
                       <div className="text-right">
                           <p className={`text-lg font-black ${tx.type === 'credit_purchase' ? 'text-voxy-primary' : 'text-zinc-500'}`}>
                            {tx.type === 'credit_purchase' ? '+' : '-'}{Math.abs(tx.amount)}
                          </p>
                          <p className="text-[10px] font-bold text-zinc-400">
                            {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                     </div>
                   ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
