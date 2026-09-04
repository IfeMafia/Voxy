"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`prose-chat text-inherit ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00D18F] underline underline-offset-2 hover:text-[#00D18F]/80 transition-colors"
            >
              {children}
            </a>
          ),
          code: ({ inline, children }) =>
            inline ? (
              <code className="bg-white/10 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <code className="block bg-black/40 p-2.5 rounded-lg text-xs font-mono my-2 overflow-x-auto">
                {children}
              </code>
            ),
          h1: ({ children }) => <h1 className="text-base font-bold text-white mb-1.5">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-white mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-bold text-white mb-1">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
