import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout title="Analytics">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="mt-2 text-slate-600">Show usage statistics and performance metrics.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border h-64 flex items-center justify-center text-slate-400">
            Chart: Conversation Count Over Time
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border h-64 flex items-center justify-center text-slate-400">
            Chart: Language Distribution
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
