import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const BusinessPublicLink = ({ slug }) => {
  const [copied, setCopied] = useState(false);

  if (!slug) return null;

  // In production, this would be your real domain
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://voxyai.com';
  const publicUrl = `${baseUrl}/chat/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-600 flex items-center gap-2">
            <Globe size={14} />
            Your chat link
          </h3>
          <p className="text-zinc-500 dark:text-zinc-500 text-[14px] font-medium leading-relaxed">
            Send this link to customers so they can chat with you easily.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5 px-4 h-12 rounded-xl flex items-center justify-between gap-4 flex-1 min-w-0 md:min-w-[300px]">
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 truncate select-all">
              {publicUrl}
            </span>
            <button 
              onClick={handleCopy}
              className="text-zinc-400 hover:text-[#00D18F] transition-colors p-1"
              title="Copy link"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <Button 
            onClick={handleOpen}
            className="bg-[#00D18F]/5 text-[#00D18F] border-[#00D18F]/10 hover:bg-[#00D18F]/10 font-bold h-12 px-6 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <ExternalLink size={16} />
            Test link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessPublicLink;
