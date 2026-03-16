import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-2 text-slate-600">Manage your account preferences and security.</p>
        
        <div className="mt-8 space-y-8 max-w-2xl">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" defaultValue="Samkiel" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input type="email" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="samkiel@example.com" />
              </div>
            </div>
          </section>
          
          <section className="space-y-4 pt-4 border-t">
            <h2 className="text-xl font-semibold text-slate-800">Security</h2>
            <button className="px-4 py-2 border rounded-lg font-medium text-red-600 border-red-200 bg-red-50 hover:bg-red-100 transition-colors">Change Password</button>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
