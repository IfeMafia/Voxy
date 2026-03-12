import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Quick overview of your business activity and assistant performance.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-slate-500 uppercase">Total Conversations</h3>
            <p className="text-2xl font-bold mt-2 text-slate-900">0</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-slate-500 uppercase">AI Responses</h3>
            <p className="text-2xl font-bold mt-2 text-slate-900">0</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border">
            <h3 className="text-sm font-medium text-slate-500 uppercase">Languages Used</h3>
            <p className="text-2xl font-bold mt-2 text-slate-900">0</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
