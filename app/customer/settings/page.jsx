import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CustomerSettingsPage() {
  return (
    <DashboardLayout title="Customer Settings">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Customer Settings</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Manage your profile and communication preferences.</p>
        
        <div className="mt-8 space-y-8 max-w-2xl text-zinc-500">
          Personalized settings options will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  );
}
