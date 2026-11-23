import React, { useState } from 'react';
import {
  Globe,
  MessageSquare,
  Share2,
  ThumbsUp,
  Repeat2,
  Send,
  Image as ImageIcon,
} from 'lucide-react';
import { BrandProfile, SocialPlatform } from '../types';

interface SocialPreviewCardProps {
  brand: BrandProfile;
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  scheduledLabel?: string;
  imageUrl?: string;
}

export const SocialPreviewCard: React.FC<SocialPreviewCardProps> = ({
  brand,
  platform,
  caption,
  hashtags,
  scheduledLabel,
  imageUrl,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const isLinkedIn = platform === 'linkedin';
  const accountName = isLinkedIn
    ? brand.connectedAccounts.linkedin
    : brand.connectedAccounts.facebook;

  const initials = brand.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold text-white shrink-0 ${
              isLinkedIn ? 'bg-[#0A66C2]' : 'bg-[#1877F2]'
            }`}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {accountName}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>{isLinkedIn ? 'LinkedIn Page' : 'Facebook Page'}</span>
              <span aria-hidden="true">·</span>
              <span>{scheduledLabel || 'Preview'}</span>
              <span aria-hidden="true">·</span>
              <Globe className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Body copy */}
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
          {caption}
        </p>
        {hashtags.length > 0 && (
          <p className="text-xs font-medium text-blue-700 leading-relaxed">
            {hashtags.join(' ')}
          </p>
        )}
      </div>

      {/* Media slot with mandatory zero-broken-image fallback */}
      {imageUrl && (
        <div className="border-t border-b border-slate-100 bg-slate-100">
          {!imgFailed ? (
            <img
              src={imageUrl}
              alt={`${brand.name} social visual`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-2 text-slate-500">
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs font-medium">{brand.name} Visual</span>
            </div>
          )}
        </div>
      )}

      {/* Platform action bar */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Like</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comment</span>
          </span>
          {isLinkedIn ? (
            <span className="inline-flex items-center gap-1.5">
              <Repeat2 className="w-3.5 h-3.5" />
              <span>Repost</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </span>
          )}
        </div>
        {isLinkedIn && (
          <span className="inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </span>
        )}
      </div>
    </div>
  );
};
