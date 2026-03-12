import DashboardLayout from '@/components/layout/DashboardLayout';

export default function BusinessPage() {
  return (
    <DashboardLayout title="Business Profile">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">Business Profile</h1>
        <p className="mt-2 text-slate-600">Configure business information that AI will use for responses.</p>
        
        <form className="mt-8 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Business Name</label>
            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Samkiel's Barbershop" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea className="w-full p-2 border rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe your business..."></textarea>
          </div>
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Save Profile</button>
        </form>
      </div>
    </DashboardLayout>
  );
}
