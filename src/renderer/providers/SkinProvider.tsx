import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { SkinAssetSlot } from '../../shared/skin/constants';
import {
  type ActiveSkin,
  buildSkinAssetUrl,
  resolveSupportedSkinBaseThemeId,
  skinService,
} from '../services/skin';
import { themeService } from '../services/theme';

interface SkinContextValue {
  activeSkin: ActiveSkin | null;
  isLoading: boolean;
  refreshVersion: number;
  refresh: () => Promise<void>;
  deactivate: () => Promise<void>;
}

const SkinContext = createContext<SkinContextValue | null>(null);

export const SkinProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [activeSkin, setActiveSkin] = useState<ActiveSkin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const loadSequenceRef = useRef(0);

  const refresh = useCallback(async () => {
    const loadSequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = loadSequence;
    setIsLoading(true);

    try {
      const nextSkin = await skinService.getActive();
      if (loadSequence !== loadSequenceRef.current) return;

      const supportedThemeId = resolveSupportedSkinBaseThemeId(
        nextSkin?.baseThemeId,
        themeService.getAllThemes().map(theme => theme.meta.id),
      );
      if (supportedThemeId && themeService.getThemeId() !== supportedThemeId) {
        themeService.setThemeById(supportedThemeId);
      }

      setActiveSkin(nextSkin);
      setRefreshVersion(version => version + 1);
    } catch (error) {
      if (loadSequence !== loadSequenceRef.current) return;
      console.error('[Skin] Failed to load the active skin', error);
    } finally {
      if (loadSequence === loadSequenceRef.current) setIsLoading(false);
    }
  }, []);

  const deactivate = useCallback(async () => {
    await skinService.deactivate();
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
    return skinService.subscribe(() => {
      void refresh();
    });
  }, [refresh]);

  const value = useMemo<SkinContextValue>(() => ({
    activeSkin,
    isLoading,
    refreshVersion,
    refresh,
    deactivate,
  }), [activeSkin, deactivate, isLoading, refresh, refreshVersion]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const useSkin = (): SkinContextValue => {
  const context = useContext(SkinContext);
  if (!context) throw new Error('useSkin must be used within SkinProvider');
  return context;
};

export const useSkinAsset = (slot: SkinAssetSlot): string | null => {
  const { activeSkin, refreshVersion } = useSkin();
  return useMemo(
    () => buildSkinAssetUrl(activeSkin?.assets[slot], refreshVersion),
    [activeSkin, refreshVersion, slot],
  );
};
