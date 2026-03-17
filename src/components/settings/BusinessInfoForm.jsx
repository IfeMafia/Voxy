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
  'Other'
];

const BusinessInfoForm = ({ data, onChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 sm:p-6 backdrop-blur-sm">
      <h3 className="text-lg font-medium text-white mb-6">Business Information</h3>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-zinc-300">Business Name</Label>
          <Input
            id="name"
            name="name"
            value={data.name || ''}
            onChange={handleInputChange}
            placeholder="e.g. Voxy Cafe"
            className="bg-zinc-800/50 border-zinc-700 focus:border-[#00D18F] focus:ring-[#00D18F]/20 text-white transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-zinc-300">Description</Label>
          <textarea
            id="description"
            name="description"
            value={data.description || ''}
            onChange={handleInputChange}
            placeholder="Tell customers about your business..."
            rows={4}
            className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00D18F]/20 focus:border-[#00D18F] transition-all text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-zinc-300">Category</Label>
            <select
              id="category"
              name="category"
              value={data.category || ''}
              onChange={handleInputChange}
              className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-[#00D18F]/20 focus:border-[#00D18F] transition-all text-white"
            >
              <option value="" disabled className="bg-zinc-900">Select Category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {data.category === 'Other' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label htmlFor="custom_category" className="text-zinc-300">Custom Category</Label>
              <Input
                id="custom_category"
                name="custom_category"
                value={data.custom_category || ''}
                onChange={handleInputChange}
                placeholder="Enter category"
                className="bg-zinc-800/50 border-zinc-700 focus:border-[#00D18F] focus:ring-[#00D18F]/20 text-white transition-all"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;
