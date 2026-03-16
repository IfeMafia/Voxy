import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard Overview">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Quick overview of your business activity and assistant performance.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 hover:border-[#00D18F]/20 transition-all group shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Total Conversations</h3>
            <p className="text-4xl font-black mt-3 text-zinc-900 dark:text-white group-hover:text-[#00D18F] transition-colors">0</p>
          </div>
          <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 hover:border-[#00D18F]/20 transition-all group shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">AI Responses</h3>
            <p className="text-4xl font-black mt-3 text-zinc-900 dark:text-white group-hover:text-[#00D18F] transition-colors">0</p>
          </div>
          <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 hover:border-[#00D18F]/20 transition-all group shadow-sm dark:shadow-none">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Languages Used</h3>
            <p className="text-4xl font-black mt-3 text-zinc-900 dark:text-white group-hover:text-[#00D18F] transition-colors">0</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
