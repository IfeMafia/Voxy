import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function IconMark({ className, size = 28 }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-lg overflow-hidden flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/logo.jpg"
        alt="Voxy Icon"
        width={size}
        height={size}
        className="object-cover rounded-lg"
      />
    </div>
  )
}

export function StatusIndicator({ status = "online", label, className }) {
  const isOnline = status === "online" || status === "active"
  return (
    <div className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D18F] opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            isOnline ? "bg-[#00D18F]" : "bg-zinc-500"
          )}
        />
      </span>
      {label && <span className="text-[#71717a] font-medium">{label}</span>}
    </div>
  )
}

export function Logo({
  href = "/",
  size = 28,
  showText = true,
  className,
  textClassName,
}) {
  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group", className)}>
      <IconMark size={size} />
      {showText && (
        <span
          className={cn(
            "font-sans font-semibold text-[17px] tracking-tight text-white transition-colors",
            textClassName
          )}
        >
          Voxy
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex focus:outline-none">
        {content}
      </Link>
    )
  }

  return content
}

export default Logo
