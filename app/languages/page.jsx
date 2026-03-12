import DashboardLayout from '@/components/layout/DashboardLayout';

export default function LanguagesPage() {
  const languages = ['English', 'Pidgin', 'Yoruba', 'Hausa', 'Igbo'];
  
  return (
    <DashboardLayout title="Languages">
      <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-900">Languages</h1>
        <p className="mt-2 text-slate-600">Choose languages supported by the assistant.</p>
        
        <div className="mt-8 space-y-4 max-w-md">
          {languages.map((lang) => (
            <div key={lang} className="flex items-center gap-3 p-3 border rounded-lg bg-white shadow-sm">
              <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="font-medium text-slate-700">{lang}</span>
            </div>
          ))}
          <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium mt-4 hover:bg-blue-700 transition-colors">Save Languages</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
