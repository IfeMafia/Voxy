"use client";

import React, { useState } from 'react';
import { Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

const CopyBusinessLink = ({ business }) => {
  const [copied, setCopied] = useState(false);
  
  if (!business?.slug) return null;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const shareUrl = `${baseUrl}/business/${business.slug}`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        
        // Ensure textarea is not visible
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
        } catch (err) {
          console.error('Fallback: Unable to copy', err);
        }
        
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      toast.success("Copied ✅");
      
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button 
      onClick={copyToClipboard}
      variant="outline"
      className="h-10 px-4 gap-2 rounded-xl border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all font-semibold text-xs uppercase tracking-wider"
    >
      {copied ? (
        <Check className="w-4 h-4 text-voxy-primary" />
      ) : (
        <Link2 className="w-4 h-4 text-[#00D18F]" />
      )}
      <span className={copied ? 'text-voxy-primary' : ''}>
        {copied ? 'Copied' : 'Copy Business Link'}
      </span>
    </Button>
  );
};

export default CopyBusinessLink;
