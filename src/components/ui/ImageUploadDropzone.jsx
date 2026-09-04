"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Loader2, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { uploadImage } from "@/lib/api/upload";
import { toast } from "react-hot-toast";

export default function ImageUploadDropzone({
  value,
  onChange,
  folder = "products",
  className = "",
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, GIF).");
      return;
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast.error("Image file size must be less than 10MB.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading image to Cloudinary...");

    try {
      const data = await uploadImage(file, folder);
      onChange?.(data.url);
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error(err.message || "Failed to upload image. Please check credentials.", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {value ? (
        <div className="relative group rounded-2xl border border-white/[0.08] bg-[#0d0d0d] overflow-hidden p-3 flex flex-col sm:flex-row items-center gap-4 transition-all">
          <div className="relative size-24 sm:size-28 shrink-0 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] flex items-center justify-center">
            <img
              src={value}
              alt="Uploaded product preview"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="size-6 text-[#00D18F] animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-medium text-[#00D18F]">
              <CheckCircle2 className="size-3.5" />
              <span>Image uploaded successfully</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1 text-xs font-medium text-zinc-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg transition-colors"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="px-2.5 py-1 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-[#00D18F] bg-[#00D18F]/[0.04] scale-[0.99]"
              : "border-white/[0.1] hover:border-white/[0.2] bg-[#0d0d0d] hover:bg-white/[0.02]"
          } ${uploading ? "pointer-events-none opacity-80" : ""}`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className={`size-12 rounded-xl flex items-center justify-center border transition-all ${
                isDragOver
                  ? "bg-[#00D18F]/20 border-[#00D18F]/40 text-[#00D18F]"
                  : "bg-white/[0.04] border-white/[0.07] text-zinc-400 group-hover:text-white"
              }`}
            >
              {uploading ? (
                <Loader2 className="size-6 text-[#00D18F] animate-spin" />
              ) : (
                <UploadCloud className="size-6" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-white">
                {uploading ? (
                  "Uploading to Cloudinary..."
                ) : (
                  <>
                    <span className="text-[#00D18F] hover:underline">Click to upload</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-xs text-zinc-500">
                PNG, JPG, WebP, GIF up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
