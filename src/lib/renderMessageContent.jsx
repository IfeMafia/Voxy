"use client";

/**
 * renderMessageContent — Shared utility for rendering AI/chat message text
 * with clickable URLs, payment links, and basic markdown formatting.
 *
 * Payment links (Paystack, Flutterwave, pay.voxyvoice.com, etc.) get a special
 * styled CTA button so users can tap to pay instantly without copy-pasting.
 */

import React from "react";
import { ExternalLink, CreditCard } from "lucide-react";

/** Domains we recognise as payment URLs — gets a special "Pay Now" button. */
const PAYMENT_DOMAINS = [
  "paystack.com",
  "flutterwave.com",
  "pay.flutterwave.com",
  "checkout.paystack.com",
  "paystack.io",
  "pay.voxyvoice.com",
  "paystack.co",
  "monnify.com",
  "squad.gt",
  "squadco.com",
];

function isPaymentUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return PAYMENT_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

/**
 * Split text into segments: plain strings and URL/link objects.
 * Supports both Markdown links [Label](url) and standalone URLs.
 * @param {string} text
 * @returns {Array<string | { url: string, label?: string|null, isPayment: boolean, isMarkdown?: boolean }>}
 */
function parseSegments(text) {
  if (!text) return [];
  // Clean double-wrapped brackets e.g. [Pay Now]([Pay Now](https://...))
  let cleaned = text.replace(
    /\[(?:Pay Now|[\w\s]+)\]\(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\)/gi,
    '[$1]($2)'
  );

  // Match either Markdown link [label](url) OR standalone http(s) URL
  const COMBINED_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"')\]]+)/g;
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = COMBINED_REGEX.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      segments.push(cleaned.slice(lastIndex, match.index));
    }
    const isMarkdown = Boolean(match[1] && match[2]);
    const rawUrl = isMarkdown ? match[2] : match[3];
    const label = isMarkdown ? match[1].trim() : null;
    const url = rawUrl.replace(/[.,;:!?)]+$/, ""); // strip trailing punctuation
    segments.push({ url, label, isPayment: isPaymentUrl(url), isMarkdown });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    segments.push(cleaned.slice(lastIndex));
  }

  return segments;
}

/**
 * Render a URL as either a "Pay Now" CTA or a regular link.
 */
function LinkChip({ url, label, isPayment, isMe }) {
  if (isPayment) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 mt-2 mb-0.5 px-4 py-2 rounded-xl font-semibold text-[13px] bg-[#00D18F] text-black hover:bg-[#00b87d] active:scale-95 transition-all shadow-md shadow-[#00D18F]/20 no-underline cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <CreditCard className="size-3.5" />
        {label || "Pay Now"}
        <ExternalLink className="size-3" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 underline underline-offset-2 break-all hover:opacity-80 transition-opacity ${
        isMe ? "text-black/80" : "text-[#00D18F]"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {label || (url.length > 50 ? url.slice(0, 47) + "…" : url)}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

/**
 * Render message text with clickable links & pay buttons.
 *
 * @param {string} text - Raw message content from AI or human
 * @param {{ isMe?: boolean, className?: string }} [opts]
 * @returns {React.ReactNode}
 */
export function renderMessageContent(text, { isMe = false, className = "" } = {}) {
  if (!text) return null;
  const segments = parseSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (typeof seg === "string") {
          // Render plain text — preserve newlines
          return seg.split("\n").map((line, j, arr) => (
            <React.Fragment key={`${i}-${j}`}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ));
        }
        return (
          <React.Fragment key={i}>
            {"\n"}
            <LinkChip url={seg.url} label={seg.label} isPayment={seg.isPayment} isMe={isMe} />
            {"\n"}
          </React.Fragment>
        );
      })}
    </span>
  );
}

/**
 * Extract the first payment URL from a message string (used by voice modal
 * to surface a "Pay Now" card even when the audio is playing).
 *
 * @param {string} text
 * @returns {string | null}
 */
export function extractPaymentUrl(text) {
  if (!text) return null;
  const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;
  let match;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0].replace(/[.,;:!?)]+$/, "");
    if (isPaymentUrl(url)) return url;
  }
  return null;
}
