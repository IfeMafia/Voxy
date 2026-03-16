import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminUsersPage() {
  return (
    <DashboardLayout title="User Management">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">User Management</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Manage and monitor all platform users.</p>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 p-8 text-center text-zinc-500">
          User list component will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  );
}
