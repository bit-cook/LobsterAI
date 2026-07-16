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
  'color-mix(in srgb, var(--lobster-background) 86%, transparent) 0%,',
  'color-mix(in srgb, var(--lobster-background) 62%, transparent) 47%,',
  'color-mix(in srgb, var(--lobster-background) 34%, transparent) 100%)',
  ', linear-gradient(to bottom,',
  'color-mix(in srgb, var(--lobster-background) 18%, transparent),',
  'color-mix(in srgb, var(--lobster-background) 72%, transparent))',
].join(' ');

const CONVERSATION_OVERLAY = [
  'linear-gradient(to bottom,',
  'color-mix(in srgb, var(--lobster-background) 38%, transparent),',
  'color-mix(in srgb, var(--lobster-background) 58%, transparent))',
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
            ? 'opacity-70 dark:opacity-60'
            : 'opacity-[0.16] saturate-[0.72] blur-[0.5px] dark:opacity-[0.14]'
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
