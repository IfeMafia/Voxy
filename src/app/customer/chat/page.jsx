import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatInterface from '@/components/chat/ChatInterface';

export default function CustomerChatPage() {
  return (
    <DashboardLayout title="Support Concierge">
      <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
        <div className="mb-6 px-2">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight font-display italic">Customer Concierge</h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400 text-sm">Instant AI-powered business assistance in your preferred language.</p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </DashboardLayout>
  );
}
