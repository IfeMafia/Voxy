import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIES = [
  'Restaurant',
  'Retail',
  'Electronics',
  'Beauty',
  'Automotive',
  'Health',
  'Education',
  'Real Estate',
  'Finance',
  'Logistics',
  'Tech',
  'Hospitality',
  'Consulting',
  'Construction',
  'Entertainment',
  'Fashion',
  'Other'
];

import ImageUpload from './ImageUpload';

const BusinessInfoForm = ({ data, onChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const handleLogoUpload = (url) => {
    onChange({ ...data, logo_url: url });
  };

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-10">Business Profile</h3>
      
      <div className="space-y-12">
        <div className="pb-10 border-b border-zinc-100 dark:border-white/[0.03]">
          <Label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mb-6 block uppercase tracking-wide">Logo & identity</Label>
          <ImageUpload 
            currentImage={data.logo_url} 
            onUpload={handleLogoUpload} 
          />
        </div>

        <div className="space-y-8">
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide ml-1">Company name</Label>
            <Input
              id="name"
              name="name"
              value={data.name || ''}
              onChange={handleInputChange}
              placeholder="e.g. Voxy Cafe"
              className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wide ml-1">About</Label>
            <textarea
              id="description"
              name="description"
              value={data.description || ''}
              onChange={handleInputChange}
              placeholder="Tell customers about your business..."
              rows={4}
              className="w-full rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-4 py-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800 focus:outline-none focus:border-[#00D18F]/40 min-h-[120px] resize-none transition-all font-medium leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <Label htmlFor="category" className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide ml-1">Category</Label>
              <select
                id="category"
                name="category"
                value={data.category || ''}
                onChange={handleInputChange}
                className="flex h-12 w-full rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/40 transition-all font-medium"
              >
                <option value="" disabled className="bg-white dark:bg-[#0A0A0A]">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-[#0A0A0A]">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {data.category === 'Other' && (
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="custom_category" className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide ml-1">Custom category</Label>
                <Input
                  id="custom_category"
                  name="custom_category"
                  value={data.custom_category || ''}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  className="bg-white/5 border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all placeholder:text-zinc-800"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;
