import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const BusinessPublicLink = ({ slug }) => {
  const [copied, setCopied] = useState(false);

  if (!slug) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://voxy.app';
  const publicUrl = `${baseUrl}/${slug}`;
  const chatUrl = `${baseUrl}/${slug}/chat`;

  const handleCopy = (url, type) => {
    navigator.clipboard.writeText(url);
    setCopied(type);
    toast.success(`${type === 'chat' ? 'Chat' : 'Storefront'} link copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-600 flex items-center gap-2">
            <Globe size={14} />
            Your store link
          </h3>
          <p className="text-zinc-500 dark:text-zinc-500 text-[14px] font-medium leading-relaxed">
            Your storefront page where customers view your catalogue, hours, and start chats.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 px-4 h-12 rounded-xl flex items-center justify-between gap-4 flex-1 min-w-0 md:min-w-[300px]">
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 truncate select-all">
              {publicUrl}
            </span>
            <button 
              onClick={() => handleCopy(publicUrl, 'store')}
              className="text-zinc-400 hover:text-[#00D18F] transition-colors p-1"
              title="Copy store link"
            >
              {copied === 'store' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <Button 
            onClick={() => handleOpen(publicUrl)}
            className="bg-[#00D18F]/5 text-[#00D18F] border-[#00D18F]/10 hover:bg-[#00D18F]/10 font-bold h-12 px-6 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <ExternalLink size={16} />
            Open store
          </Button>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-zinc-400">Direct Chat Link:</span>
          <span className="ml-2 text-xs font-mono text-zinc-500">{chatUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(chatUrl, 'chat')}
            className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg transition-colors flex items-center gap-1.5"
          >
            {copied === 'chat' ? <Check size={14} className="text-[#00D18F]" /> : <Copy size={14} />}
            <span>{copied === 'chat' ? 'Copied' : 'Copy chat link'}</span>
          </button>
          <button
            onClick={() => handleOpen(chatUrl)}
            className="px-3 py-1.5 text-xs font-medium text-[#00D18F] hover:bg-[#00D18F]/10 border border-[#00D18F]/20 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ExternalLink size={14} />
            <span>Open chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessPublicLink;
