import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout title="Admin Settings">
      <div className="p-8">
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">Configure global platform settings and permissions.</p>
        
        <div className="mt-8 space-y-8 max-w-2xl text-zinc-500">
          Admin configuration options will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  );
}
