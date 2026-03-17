import React from 'react';

const categories = [
  "Restaurant",
  "Retail",
  "Electronics",
  "Beauty",
  "Automotive",
  "Health",
  "Education",
  "Real Estate",
  "Other"
];

const BusinessInfoForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-8 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#00D18F]/5 blur-[100px] rounded-full pointer-events-none" />
      
      <h2 className="text-2xl font-display font-black text-white italic tracking-tight relative z-10">Identity <span className="text-[#00D18F]">Profile</span></h2>
      
      <div className="grid grid-cols-1 gap-8 relative z-10">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Business Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="e.g. Voxy Coffee House"
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-[#00D18F]/30 focus:ring-4 focus:ring-[#00D18F]/5 transition-all duration-500"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Narrate your business mission..."
            rows={4}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-[#00D18F]/30 focus:ring-4 focus:ring-[#00D18F]/5 transition-all resize-none duration-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Industry Type</label>
            <div className="relative group/select">
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-[#00D18F]/30 focus:ring-4 focus:ring-[#00D18F]/5 transition-all appearance-none cursor-pointer duration-500"
              >
                <option value="" disabled className="bg-zinc-900">Select industry</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-600 group-hover/select:text-[#00D18F] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {formData.category === 'Other' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-700">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">Custom Designation</label>
              <input
                type="text"
                name="custom_category"
                value={formData.custom_category || ''}
                onChange={handleChange}
                placeholder="e.g. Pet Care"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-[#00D18F]/30 focus:ring-4 focus:ring-[#00D18F]/5 transition-all duration-500"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;
