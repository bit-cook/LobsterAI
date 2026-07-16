import React, { useState } from 'react';

import { useSkin } from '../../providers/SkinProvider';
import { i18nService } from '../../services/i18n';

const SkinSettingsSection: React.FC = () => {
  const { activeSkin, deactivate, isLoading } = useSkin();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleDeactivate = async () => {
    setHasError(false);
    setIsDeactivating(true);
    try {
      await deactivate();
    } catch (error) {
      console.error('[Skin] Failed to restore the default skin', error);
      setHasError(true);
    } finally {
      setIsDeactivating(false);
    }
  };

  const activeSkinLabel = activeSkin?.name ?? activeSkin?.id;
  return (
    <section className="mt-5 rounded-xl border border-border bg-surface px-4 py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-sm font-medium text-foreground">
            {i18nService.t('aiSkin')}
          </h4>
          <p className="mt-1 text-xs leading-5 text-secondary">
            {activeSkinLabel
              ? `${i18nService.t('aiSkinActive')}: ${activeSkinLabel}`
              : i18nService.t('aiSkinNone')}
          </p>
          {hasError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {i18nService.t('aiSkinRestoreFailed')}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleDeactivate()}
          disabled={!activeSkin || isLoading || isDeactivating}
          className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDeactivating
            ? i18nService.t('aiSkinRestoring')
            : i18nService.t('aiSkinRestoreDefault')}
        </button>
      </div>
    </section>
  );
};

export default SkinSettingsSection;
