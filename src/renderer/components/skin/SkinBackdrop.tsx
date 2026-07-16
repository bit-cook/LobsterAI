import React, { useState } from 'react';

import { SkinAssetSlot } from '../../../shared/skin/constants';
import { useSkinAsset } from '../../providers/SkinProvider';

export const SkinBackdropVariant = {
  Home: 'home',
  Conversation: 'conversation',
} as const;

export type SkinBackdropVariant = typeof SkinBackdropVariant[keyof typeof SkinBackdropVariant];

interface SkinBackdropProps {
  variant: SkinBackdropVariant;
}

const HOME_OVERLAY = [
  'radial-gradient(ellipse at 50% 47%,',
  'color-mix(in srgb, var(--lobster-background) 62%, transparent) 0%,',
  'color-mix(in srgb, var(--lobster-background) 44%, transparent) 47%,',
  'color-mix(in srgb, var(--lobster-background) 22%, transparent) 100%)',
  ', linear-gradient(to bottom,',
  'color-mix(in srgb, var(--lobster-background) 12%, transparent),',
  'color-mix(in srgb, var(--lobster-background) 54%, transparent))',
].join(' ');

const CONVERSATION_OVERLAY = [
  'linear-gradient(to bottom,',
  'color-mix(in srgb, var(--lobster-background) 20%, transparent),',
  'color-mix(in srgb, var(--lobster-background) 36%, transparent))',
].join(' ');

const SkinBackdrop: React.FC<SkinBackdropProps> = ({ variant }) => {
  const assetUrl = useSkinAsset(SkinAssetSlot.WorkspaceBackdrop);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!assetUrl || failedUrl === assetUrl) return null;

  const isHome = variant === SkinBackdropVariant.Home;
  return (
    <div
      aria-hidden="true"
      data-skin-backdrop={variant}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <img
        src={assetUrl}
        alt=""
        draggable={false}
        onError={() => setFailedUrl(assetUrl)}
        className={`h-full w-full scale-[1.01] object-cover object-center ${
          isHome
            ? 'opacity-[0.82] dark:opacity-[0.72]'
            : 'opacity-[0.32] saturate-[0.90] dark:opacity-[0.28]'
        }`}
      />
      <div
        className="absolute inset-0"
        style={{ background: isHome ? HOME_OVERLAY : CONVERSATION_OVERLAY }}
      />
    </div>
  );
};

export default SkinBackdrop;
