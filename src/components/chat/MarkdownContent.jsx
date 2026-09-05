"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink, CreditCard } from "lucide-react";

export default function MarkdownContent({ content, className = "" }) {
  if (!content) return null;

  let cleanContent = typeof content === "string" ? content.trim() : "";
  const codeBlockMatch = cleanContent.match(/^```(?:markdown)?\s*\n([\s\S]*?)\n?```$/i);
  if (codeBlockMatch) {
    cleanContent = codeBlockMatch[1].trim();
  }

  // Pre-process raw Paystack / checkout URLs into markdown buttons if present as raw text
  cleanContent = cleanContent.replace(
    (/(^|[\s(])(https?:\/\/(?:checkout\.paystack\.com|api\.paystack\.co)[^\s)]+)/gi),
    '$1[Pay Now]($2)'
  );

  return (
    <div className={`prose-chat text-inherit text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-zinc-200 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white tracking-tight">{children}</strong>,
          em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 last:mb-0 space-y-1 text-zinc-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 last:mb-0 space-y-1 text-zinc-300">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          a: ({ href, children }) => {
            const isPayment = href && (href.includes("paystack") || href.includes("/pay/"));
            if (isPayment) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="my-3 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00D18F] hover:bg-[#00b87d] text-black font-bold text-xs shadow-lg shadow-[#00D18F]/25 transition-all no-underline cursor-pointer font-sans"
                >
                  <CreditCard className="size-4" />
                  <span>Pay Now</span>
                  <ExternalLink className="size-3.5" />
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D18F] font-medium underline underline-offset-4 decoration-[#00D18F]/40 hover:decoration-[#00D18F] hover:text-[#00D18F] transition-colors"
              >
                {children}
              </a>
            );
          },
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-white/[0.08] text-emerald-300 px-1.5 py-0.5 rounded text-[13px] font-mono border border-white/[0.06]">{children}</code>
            ) : (
              <code className="block bg-black/60 border border-white/[0.08] p-3 rounded-lg text-xs font-mono my-2.5 overflow-x-auto text-zinc-200">
                {children}
              </code>
            ),
          h1: ({ children }) => <h1 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0 tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold text-white mb-1.5 mt-2.5 first:mt-0 tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1 mt-2 first:mt-0">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#00D18F]/50 pl-3 my-2 text-zinc-400 italic text-xs">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-white/[0.08] rounded-lg">
              <table className="min-w-full divide-y divide-white/[0.08] text-xs text-left text-zinc-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-medium text-white bg-white/[0.04]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-white/[0.04]">
              {children}
            </td>
          ),
        }}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  );
}
