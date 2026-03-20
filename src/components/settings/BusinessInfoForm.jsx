import React from 'react';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin,
  Clock,
  Camera,
  MapPin,
  ChevronRight,
  Bot
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import ImageUpload from './ImageUpload';

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

import { NIGERIA_STATES } from '@/lib/nigeria-states';

const BusinessInfoForm = ({ data, onChange }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // When state changes, reset LGA
    if (name === 'state') {
      onChange({ ...data, state: value, lga: '' });
    } else {
      onChange({ ...data, [name]: value });
    }
  };

  const handleLogoUpload = (url) => {
    onChange({ ...data, logo_url: url });
  };

  const selectedState = NIGERIA_STATES.find(s => s.name === data.state);
  const lgaOptions = selectedState ? selectedState.lgas : [];

  return (
    <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-[#222222] rounded-2xl p-6 shadow-sm transition-colors duration-500">
      <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-600 mb-10">Business profile</h3>
      
      <div className="space-y-12">
        <div className="pb-10 border-b border-zinc-100 dark:border-white/[0.03]">
          <Label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-6 block">Logo & identity</Label>
          <ImageUpload 
            currentImage={data.logo_url} 
            onUpload={handleLogoUpload} 
          />
        </div>

        <div className="space-y-8">
          <div className="space-y-2.5">
            <Label htmlFor="name" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Company name</Label>
            <Input
              id="name"
              name="name"
              value={data.name || ''}
              onChange={handleInputChange}
              placeholder="e.g. Voxy Cafe"
              className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <Label htmlFor="phone" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                value={data.phone || ''}
                onChange={handleInputChange}
                placeholder="e.g. +234 800 VOXY"
                className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-800"
              />
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="state" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">State</Label>
              <select
                id="state"
                name="state"
                value={data.state || ''}
                onChange={handleInputChange}
                className="flex h-12 w-full rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/40 transition-all font-medium"
              >
                <option value="">Select state</option>
                {NIGERIA_STATES.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <Label htmlFor="lga" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">LGA</Label>
              <select
                id="lga"
                name="lga"
                value={data.lga || ''}
                onChange={handleInputChange}
                disabled={!data.state}
                className="flex h-12 w-full rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#00D18F]/40 transition-all font-medium disabled:opacity-50"
              >
                <option value="">Select LGA</option>
                {lgaOptions.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="street_address" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Street address</Label>
              <Input
                id="street_address"
                name="street_address"
                value={data.street_address || ''}
                onChange={handleInputChange}
                placeholder="e.g. 123 Tech Hub"
                className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-[11px] font-bold text-zinc-500 ml-1">About</Label>
            <textarea
              id="description"
              name="description"
              value={data.description || ''}
              onChange={handleInputChange}
              placeholder="Tell customers about your business..."
              rows={4}
              className="w-full rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 px-4 py-4 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700 focus:outline-none focus:border-[#00D18F]/40 min-h-[120px] resize-none transition-all font-medium leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2.5">
              <Label htmlFor="category" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Category</Label>
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
                <Label htmlFor="custom_category" className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Custom category</Label>
                <Input
                  id="custom_category"
                  name="custom_category"
                  value={data.custom_category || ''}
                  onChange={handleInputChange}
                  placeholder="Enter category"
                  className="bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                />
              </div>
            )}
          </div>

          {/* Social Presence */}
          <div className="space-y-6 pt-10 border-t border-zinc-100 dark:border-white/[0.03]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00D18F]/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#00D18F]" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Social presence</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Instagram</Label>
                <div className="relative group">
                  <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#00D18F] transition-colors" />
                  <Input 
                    placeholder="instagram.com/username"
                    value={data.social_links?.instagram || ''}
                    onChange={(e) => onChange({ ...data, social_links: { ...data.social_links, instagram: e.target.value } })}
                    className="pl-12 bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Twitter (X)</Label>
                <div className="relative group">
                  <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#00D18F] transition-colors" />
                  <Input 
                    placeholder="twitter.com/username"
                    value={data.social_links?.twitter || ''}
                    onChange={(e) => onChange({ ...data, social_links: { ...data.social_links, twitter: e.target.value } })}
                    className="pl-12 bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">Facebook</Label>
                <div className="relative group">
                  <Facebook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#00D18F] transition-colors" />
                  <Input 
                    placeholder="facebook.com/page"
                    value={data.social_links?.facebook || ''}
                    onChange={(e) => onChange({ ...data, social_links: { ...data.social_links, facebook: e.target.value } })}
                    className="pl-12 bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 ml-1">LinkedIn</Label>
                <div className="relative group">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#00D18F] transition-colors" />
                  <Input 
                    placeholder="linkedin.com/company/name"
                    value={data.social_links?.linkedin || ''}
                    onChange={(e) => onChange({ ...data, social_links: { ...data.social_links, linkedin: e.target.value } })}
                    className="pl-12 bg-zinc-50 dark:bg-white/5 border-zinc-100 dark:border-white/5 h-12 rounded-xl focus:border-[#00D18F]/40 text-sm font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;
