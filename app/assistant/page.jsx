import DashboardLayout from '@/components/layout/DashboardLayout';
import { Mic } from 'lucide-react';

export default function AssistantPage() {
  return (
    <DashboardLayout title="AI Assistant">
      <div className="p-8 h-full flex flex-col">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight transition-colors">AI Assistant</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400 transition-colors">Interface where businesses interact with the AI assistant using text or voice.</p>
        
        <div className="flex-1 mt-8 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/5 p-6 flex flex-col justify-end transition-colors shadow-sm dark:shadow-none">
          <div className="text-center text-zinc-500 mb-6 italic text-sm">No messages yet. Start a conversation above.</div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/50 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600" 
              disabled 
            />
            <button className="px-6 py-3 bg-[#00D18F] text-black font-bold rounded-xl opacity-50 cursor-not-allowed transition-all">Send</button>
            <button className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl opacity-50 cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
