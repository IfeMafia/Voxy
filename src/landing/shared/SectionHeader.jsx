/**
 * SectionHeader.jsx
 *
 * Shared header component for landing page sections.
 * Clean, modern typography with high contrast between bold titles and subtle descriptions.
 */

import React from "react";

export default function SectionHeader({
  eyebrow,
  headline,
  headlineAccent,
  body,
  align = "center",
}) {
  const alignClass = align === "left" ? "text-left items-start" : "text-center items-center";

  return (
    <div className={`flex flex-col gap-3.5 max-w-3xl ${alignClass} ${align === "center" ? "mx-auto" : ""}`}>
      {eyebrow && (
        <span className="eyebrow-pill">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D18F] animate-pulse" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15]">
        {headline}
        {headlineAccent && (
          <span className="text-[#94a3b8] font-normal block sm:inline sm:ml-2">
            {headlineAccent}
          </span>
        )}
      </h2>
      {body && (
        <p className="text-[#94a3b8] text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
          {body}
        </p>
      )}
    </div>
  );
}
