import DashboardLayout from '@/components/layout/DashboardLayout';
import { Bookmark } from 'lucide-react';

export default function BookmarksPage() {
  return (
    <DashboardLayout title="Bookmarks">
      <div className="space-y-10">
        <div>
          <p className="mt-2 text-zinc-500 text-xs font-medium">Manage your saved destinations</p>
        </div>
        
        <div className="bg-[#111111] border border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden group">
          <div className="size-20 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-zinc-800 group-hover:text-[#00D18F] group-hover:scale-110 transition-all duration-700 relative z-10">
            <Bookmark size={40} />
          </div>
          
          <div className="relative z-10 max-w-sm space-y-2">
            <h2 className="text-white font-bold tracking-tight">No bookmarks yet</h2>
            <p className="text-zinc-500 text-sm">Save businesses you interact with frequently to access them quickly here.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
