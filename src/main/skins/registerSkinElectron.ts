import { BrowserWindow, ipcMain, protocol } from 'electron';

import { SkinIpc, SkinProtocol } from '../../shared/skin/constants';
import type {
  SkinDeactivateResponse,
  SkinGetActiveResponse,
} from '../../shared/skin/types';
import { presentSkin } from './skinPresentation';
import { createSkinProtocolHandler } from './skinProtocol';
import type { SkinStore } from './skinStore';

export const SKIN_PRIVILEGED_SCHEME = {
  scheme: SkinProtocol.Scheme,
  privileges: {
    standard: true,
    secure: true,
    supportFetchAPI: true,
    stream: true,
  },
} as const;

export const notifySkinChanged = (): void => {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) window.webContents.send(SkinIpc.Changed);
  });
};

export function registerSkinElectronIntegration(store: SkinStore): void {
  protocol.handle(SkinProtocol.Scheme, createSkinProtocolHandler({
    rootDir: store.rootDir,
    resolveAsset: (skinId, slot) => store.resolveProtocolAsset(skinId, slot),
  }));

  ipcMain.handle(SkinIpc.GetActive, async (): Promise<SkinGetActiveResponse> => {
    try {
      const activeSkin = await store.getActive();
      return {
        success: true,
        activeSkin: activeSkin ? presentSkin(activeSkin) : null,
      };
    } catch (error) {
      console.error('[Skin] failed to load active skin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load active skin',
      };
    }
  });

  ipcMain.handle(SkinIpc.Deactivate, async (): Promise<SkinDeactivateResponse> => {
    try {
      await store.deactivate();
      notifySkinChanged();
      return { success: true };
    } catch (error) {
      console.error('[Skin] failed to deactivate skin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate skin',
      };
    }
  });
}
