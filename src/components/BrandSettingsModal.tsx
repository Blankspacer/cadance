import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BrandProfile, CustomerCategory } from '../types';

interface BrandSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBrand: (brand: BrandProfile) => void;
}

const CATEGORIES: CustomerCategory[] = [
  'Marketing Agency',
  'Restaurant',
  'Retailer',
  'SME',
];

const DEFAULT_IMAGES: Record<CustomerCategory, string> = {
  'Marketing Agency': '/src/assets/images/post_agency_strategy_1795421136743.jpg',
  Restaurant: '/src/assets/images/post_restaurant_bistro_1795421136965.jpg',
  Retailer: '/src/assets/images/post_retail_goods_1795421136252.jpg',
  SME: '/src/assets/images/post_sme_advisory_1795421136990.jpg',
};

export const BrandSettingsModal: React.FC<BrandSettingsModalProps> = ({
  isOpen,
  onClose,
  onAddBrand,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CustomerCategory>('Retailer');
  const [industry, setIndustry] = useState('');
  const [audience, setAudience] = useState('');
  const [voice, setVoice] = useState('Warm, clear, trustworthy, conversion-focused');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 18);

    const newBrand: BrandProfile = {
      id: `brand-${Date.now()}`,
      name: name.trim(),
      handle: `@${cleanSlug || 'brand'}`,
      category,
      industry: industry.trim() || `${category} business`,
      audience: audience.trim() || 'Local customers and B2B buyers',
      voice: voice.trim(),
      coverImage: DEFAULT_IMAGES[category],
      connectedAccounts: {
        linkedin: `${name.trim()} Official`,
        facebook: name.trim(),
      },
      metrics: {
        totalReach: 12400,
        reachDelta: '+0.0%',
        engagementRate: 4.2,
        engagementDelta: '+0.0%',
        ctr: 2.5,
        ctrDelta: '+0.0%',
        followerGrowth: 120,
      },
      weeklySeries: [
        { label: 'W1', linkedinReach: 1800, facebookReach: 1400, engagements: 140 },
        { label: 'W2', linkedinReach: 2100, facebookReach: 1700, engagements: 175 },
        { label: 'W3', linkedinReach: 2400, facebookReach: 2000, engagements: 210 },
        { label: 'W4', linkedinReach: 2900, facebookReach: 2300, engagements: 255 },
      ],
    };

    onAddBrand(newBrand);
    setName('');
    setIndustry('');
    setAudience('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-brand-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 id="add-brand-title" className="text-lg font-semibold text-slate-900">
            Add Client or Brand Workspace
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Business or Client Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harbor Street Bakery"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Customer Segment
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                    category === cat
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Industry & Core Offering
            </label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Sourdough bakery & specialty coffee bar"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Neighborhood commuters and weekend brunch guests"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Brand Voice
            </label>
            <input
              type="text"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-lg bg-blue-700 text-sm font-medium text-white hover:bg-blue-800"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
