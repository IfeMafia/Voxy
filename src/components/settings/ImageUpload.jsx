"use client";

import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ImageUpload({ currentImage, onUpload, folder = 'business-logs' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploading(true);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars') // Assuming a bucket named 'voxy-assets' exists or will be created
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUpload('');
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="relative group">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-zinc-800/50 border-2 border-dashed border-zinc-700 overflow-hidden flex items-center justify-center transition-all hover:border-[#00D18F]/50">
          {preview ? (
            <>
              <img 
                src={preview} 
                alt="Profile preview" 
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-[#00D18F] transition-colors">
              <Camera className="w-8 h-8" />
              <span className="text-xs font-medium">Upload Logo</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#00D18F]" />
            </div>
          )}
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 w-full h-full cursor-pointer z-10"
          aria-label="Select logo"
        />
      </div>
      
      <div className="flex flex-col gap-1">
        <p className="text-sm text-zinc-400">
          Upload your business logo or profile picture
        </p>
        <p className="text-xs text-zinc-500">
          Recommended: square image, max 2MB
        </p>
      </div>
    </div>
  );
}
