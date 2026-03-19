import { getAllBusinesses } from '@/lib/supabase/admin';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { Building2, Search, Filter } from 'lucide-react';

export default async function BusinessesListPage() {
  const businesses = await getAllBusinesses();

  return (
    <DashboardLayout title="Businesses">
      <div className="space-y-10 pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Businesses</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-wider text-sm">
            Manage platform tenants and their usage
          </p>
        </div>

        <div className="bg-[#050505] border border-white/5 rounded-[40px] p-10 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Search businesses..." 
                  className="bg-zinc-900 border border-white/10 text-white text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-[#00D18F] transition-colors w-64"
                />
              </div>
              <button className="px-4 py-2 bg-zinc-900 text-zinc-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:text-white hover:bg-zinc-800 transition-all border border-white/5 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
            <div className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#00D18F]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Name</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Owner</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Usage Count</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Total Cost</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center">Status</th>
                  <th className="pb-6 text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">Created At</th>
                </tr>
              </thead>
              <tbody>
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                      No businesses found
                    </td>
                  </tr>
                ) : (
                  businesses.map((business) => (
                    <tr key={business.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                      <td className="py-6 px-4">
                        <Link href={`/lighthouse/businesses/${business.id}`} className="font-black text-white hover:text-[#00D18F] transition-colors truncate">
                          {business.name}
                        </Link>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-bold text-zinc-400">{business.owner_email}</span>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-bold text-white">{business.totalUsageCount}</span>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-black text-white">${business.totalCost.toFixed(2)}</span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                          business.status === 'active' ? 'bg-[#00D18F]/10 text-[#00D18F] border-[#00D18F]/20' :
                          business.status === 'suspended' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {business.status}
                        </span>
                      </td>
                      <td className="py-6 px-4">
                        <span className="text-sm font-bold text-zinc-500">
                          {new Date(business.created_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
