import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CustomerChatPage() {
  return (
    <DashboardLayout title="Customer Chat">
      <div className="h-full flex flex-col">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Chat with Assistant</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">Interact with the voice-enabled AI assistant.</p>
        </div>
        
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 m-8 p-8 flex items-center justify-center text-zinc-500">
          Chat interface will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  );
}
