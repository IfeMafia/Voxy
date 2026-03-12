import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AssistantPage() {
  return (
    <DashboardLayout title="AI Assistant">
      <div className="p-8 h-full flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
        <p className="mt-2 text-slate-600">Interface where businesses interact with the AI assistant using text or voice.</p>
        
        <div className="flex-1 mt-8 bg-gray-50 rounded-lg border p-4 flex flex-col justify-end">
          <div className="text-center text-gray-400 mb-4 italic">No messages yet. Start a conversation above.</div>
          <div className="flex gap-2">
            <input type="text" placeholder="Type a message..." className="flex-1 p-2 border rounded-lg" disabled />
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed">Send</button>
            <button className="px-4 py-2 bg-gray-200 rounded-lg opacity-50 cursor-not-allowed">🎤</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
