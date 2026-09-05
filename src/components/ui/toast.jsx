"use client";

import { toast as hotToast } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const toast = {
  add: ({ title, description, actionProps, type = "success" }) => {
    return hotToast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-in slide-in-from-top-4 fade-in duration-300" : "animate-out slide-out-to-top-4 fade-out duration-200"
          } max-w-sm w-full bg-black border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.9)] rounded-xl pointer-events-auto flex items-start p-4 gap-3`}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {type === "success" && <CheckCircle2 className="w-5 h-5 text-[#00D18F]" />}
            {type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
            {type === "info" && <Info className="w-5 h-5 text-blue-400" />}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-white">{title}</p>
            {description && (
              <p className="text-xs text-[#71717a] leading-relaxed">{description}</p>
            )}
          </div>

          {/* Actions & Close */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={() => hotToast.dismiss(t.id)}
              className="text-[#71717a] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {actionProps && (
              <button
                onClick={() => {
                  if (actionProps.onClick) actionProps.onClick();
                  hotToast.dismiss(t.id);
                }}
                className="text-xs font-medium text-white hover:text-[#00D18F] transition-colors mt-1"
              >
                {actionProps.children}
              </button>
            )}
          </div>
        </div>
      ),
      { duration: 4000 }
    );
  },
  
  close: (id) => hotToast.dismiss(id),
  
  // Expose these for backwards compatibility with places already using toast.success / error
  success: (msg) => toast.add({ title: msg, type: "success" }),
  error: (msg) => toast.add({ title: msg, type: "error" }),
};
