import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  openPath: vi.fn(),
  showItemInFolder: vi.fn(),
  quit: vi.fn(),
  relaunch: vi.fn(),
  getPath: vi.fn(),
}));

const cpMocks = vi.hoisted(() => ({
  exec: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('electron', () => ({
  app: {
    getPath: mocks.getPath,
    quit: mocks.quit,
    relaunch: mocks.relaunch,
  },
  session: {
    defaultSession: {
      fetch: vi.fn(),
    },
  },
  shell: {
    openPath: mocks.openPath,
    showItemInFolder: mocks.showItemInFolder,
  },
}));

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    exec: cpMocks.exec,
    spawn: cpMocks.spawn,
  };
});

import {
  findAttachedDevEntries,
  installUpdate,
  parseHdiutilAttachOutput,
} from './appUpdateInstaller';

const INSTALLER_PATH = 'C:\\Users\\test\\AppData\\Roaming\\LobsterAI\\updates\\lobsterai-update-manual-1.exe';

describe('Windows update install', () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    mocks.openPath.mockReset();
    mocks.showItemInFolder.mockReset();
    mocks.quit.mockReset();
    Object.defineProperty(process, 'platform', { value: 'win32' });
    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 1024 } as fs.Stats);
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    vi.restoreAllMocks();
  });

  test('launches the installer in the foreground and quits on success', async () => {
    mocks.openPath.mockResolvedValue('');

    await installUpdate(INSTALLER_PATH);

    expect(mocks.openPath).toHaveBeenCalledWith(INSTALLER_PATH);
    expect(mocks.quit).toHaveBeenCalledOnce();
    expect(mocks.showItemInFolder).not.toHaveBeenCalled();
  });

  test('reveals the installer in Explorer and throws when launch fails', async () => {
    mocks.openPath.mockResolvedValue('The operation was canceled by the user.');

    await expect(installUpdate(INSTALLER_PATH)).rejects.toThrow(
      'The operation was canceled by the user.',
    );

    expect(mocks.showItemInFolder).toHaveBeenCalledWith(INSTALLER_PATH);
    expect(mocks.quit).not.toHaveBeenCalled();
  });

  test('rejects when the installer file is missing', async () => {
    const enoent = Object.assign(new Error('not found'), { code: 'ENOENT' });
    vi.spyOn(fs.promises, 'stat').mockRejectedValue(enoent);

    await expect(installUpdate(INSTALLER_PATH)).rejects.toThrow('Update file not found');

    expect(mocks.openPath).not.toHaveBeenCalled();
    expect(mocks.quit).not.toHaveBeenCalled();
  });
});

describe('hdiutil plist parsing', () => {
  test('extracts the mount point and dev entries from an APFS attach result', () => {
    // Real-world shape: entity order is not device order.
    const json = JSON.stringify({
      'system-entities': [
        { 'content-hint': 'GUID_partition_scheme', 'dev-entry': '/dev/disk4' },
        { 'dev-entry': '/dev/disk5s1', 'mount-point': '/Volumes/LobsterAI', 'volume-kind': 'apfs' },
        { 'content-hint': 'EF57347C-0000-11AA-AA11-00306543ECAC', 'dev-entry': '/dev/disk5' },
        { 'content-hint': 'Apple_APFS', 'dev-entry': '/dev/disk4s1' },
      ],
    });

    const result = parseHdiutilAttachOutput(json);

    expect(result.mountPoint).toBe('/Volumes/LobsterAI');
    expect(result.devEntries).toEqual(['/dev/disk4', '/dev/disk5s1', '/dev/disk5', '/dev/disk4s1']);
  });

  test('extracts the mount point from an HFS attach result', () => {
    const json = JSON.stringify({
      'system-entities': [
        { 'content-hint': 'GUID_partition_scheme', 'dev-entry': '/dev/disk4' },
        { 'content-hint': 'Apple_HFS', 'dev-entry': '/dev/disk4s1', 'mount-point': '/Volumes/LobsterAI 1' },
      ],
    });

    const result = parseHdiutilAttachOutput(json);

    expect(result.mountPoint).toBe('/Volumes/LobsterAI 1');
  });

  test('reports no mount point when the volume failed to mount', () => {
    const json = JSON.stringify({
      'system-entities': [
        { 'content-hint': 'GUID_partition_scheme', 'dev-entry': '/dev/disk4' },
        { 'content-hint': 'Apple_HFS', 'dev-entry': '/dev/disk4s1' },
      ],
    });

    const result = parseHdiutilAttachOutput(json);

    expect(result.mountPoint).toBeUndefined();
    expect(result.devEntries).toEqual(['/dev/disk4', '/dev/disk4s1']);
  });

  test('preserves special characters in mount points', () => {
    const mountPoint = '/Volumes/龙虾 Test & Vol';
    const json = JSON.stringify({
      'system-entities': [{ 'dev-entry': '/dev/disk4s1', 'mount-point': mountPoint }],
    });

    expect(parseHdiutilAttachOutput(json).mountPoint).toBe(mountPoint);
  });

  test('treats malformed output as no mount point', () => {
    expect(parseHdiutilAttachOutput('not json')).toEqual({ mountPoint: undefined, devEntries: [] });
    expect(parseHdiutilAttachOutput('')).toEqual({ mountPoint: undefined, devEntries: [] });
    expect(parseHdiutilAttachOutput('{}')).toEqual({ mountPoint: undefined, devEntries: [] });
  });

  test('finds dev entries of an attached image by image path', () => {
    const json = JSON.stringify({
      images: [
        {
          'image-path': '/tmp/other.dmg',
          'system-entities': [{ 'dev-entry': '/dev/disk9' }],
        },
        {
          'image-path': '/tmp/update.dmg',
          'system-entities': [{ 'dev-entry': '/dev/disk4' }, { 'dev-entry': '/dev/disk4s1' }],
        },
      ],
    });

    expect(findAttachedDevEntries(json, '/tmp/update.dmg')).toEqual(['/dev/disk4', '/dev/disk4s1']);
    expect(findAttachedDevEntries(json, '/tmp/missing.dmg')).toEqual([]);
    expect(findAttachedDevEntries('not json', '/tmp/update.dmg')).toEqual([]);
  });
});

describe('macOS DMG install', () => {
  const originalPlatform = process.platform;
  const originalResourcesPath = (process as { resourcesPath?: string }).resourcesPath;
  const USER_DATA = '/Users/test/Library/Application Support/LobsterAI';
  const DMG_PATH = `${USER_DATA}/updates/lobsterai-update-auto-1.dmg`;

  const attachNoMountJson = JSON.stringify({
    'system-entities': [
      { 'content-hint': 'GUID_partition_scheme', 'dev-entry': '/dev/disk4' },
      { 'content-hint': 'Apple_HFS', 'dev-entry': '/dev/disk4s1' },
    ],
  });

  const attachMountedJson = (mountPoint: string) =>
    JSON.stringify({
      'system-entities': [
        { 'content-hint': 'GUID_partition_scheme', 'dev-entry': '/dev/disk4' },
        { 'content-hint': 'Apple_HFS', 'dev-entry': '/dev/disk4s1', 'mount-point': mountPoint },
      ],
    });

  /** Responds to consecutive `hdiutil attach` calls; other commands succeed with empty output. */
  let attachResponders: Array<(cmd: string) => string>;
  let attachCommands: string[];
  let detachCommands: string[];

  const respondNoMount = () => attachNoMountJson;
  const respondMountedAtVolumes = () => attachMountedJson('/Volumes/LobsterAI');
  const respondMountedAtRequestedPoint = (cmd: string) => {
    const match = cmd.match(/-mountpoint '([^']+)'/);
    return attachMountedJson(match ? match[1] : '/Volumes/unexpected');
  };

  /** plutil stand-in that echoes stdin, so exec fixtures can be JSON directly. */
  const fakePlutilProcess = () => {
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter & { setEncoding: (encoding: string) => void };
      stderr: EventEmitter & { setEncoding: (encoding: string) => void };
      stdin: { on: (event: string, listener: () => void) => void; end: (data?: string) => void };
    };
    child.stdout = Object.assign(new EventEmitter(), { setEncoding: () => {} });
    child.stderr = Object.assign(new EventEmitter(), { setEncoding: () => {} });
    child.stdin = {
      on: () => {},
      end: (data?: string) => {
        setImmediate(() => {
          child.stdout.emit('data', data ?? '');
          child.emit('close', 0);
        });
      },
    };
    return child;
  };

  beforeEach(() => {
    mocks.openPath.mockReset();
    mocks.showItemInFolder.mockReset();
    mocks.quit.mockReset();
    mocks.relaunch.mockReset();
    mocks.getPath.mockReset();
    mocks.getPath.mockReturnValue(USER_DATA);
    cpMocks.exec.mockReset();
    cpMocks.spawn.mockReset();

    Object.defineProperty(process, 'platform', { value: 'darwin' });
    Object.defineProperty(process, 'resourcesPath', {
      value: '/Applications/LobsterAI.app/Contents/Resources',
      configurable: true,
    });

    attachResponders = [];
    attachCommands = [];
    detachCommands = [];

    cpMocks.exec.mockImplementation(
      (
        cmd: string,
        _opts: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        const respond = (stdout: string) => setImmediate(() => callback(null, stdout, ''));
        if (cmd.startsWith('hdiutil attach')) {
          attachCommands.push(cmd);
          const responder = attachResponders.shift() ?? respondNoMount;
          respond(responder(cmd));
        } else if (cmd.startsWith('hdiutil detach')) {
          detachCommands.push(cmd);
          respond('');
        } else {
          respond('');
        }
        return {} as never;
      },
    );
    cpMocks.spawn.mockImplementation(() => fakePlutilProcess() as never);

    vi.spyOn(fs.promises, 'stat').mockResolvedValue({ size: 1024 } as fs.Stats);
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    vi.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);
    vi.spyOn(fs.promises, 'rmdir').mockResolvedValue(undefined);
    vi.spyOn(fs.promises, 'readdir').mockImplementation(((dir: fs.PathLike) => {
      if (String(dir).endsWith(path.join('Contents', 'MacOS'))) {
        return Promise.resolve(['LobsterAI']);
      }
      return Promise.resolve(['LobsterAI.app']);
    }) as never);
  });

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
    Object.defineProperty(process, 'resourcesPath', {
      value: originalResourcesPath,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  test('mounts, copies and relaunches on the happy path', async () => {
    attachResponders = [respondMountedAtVolumes];

    await installUpdate(DMG_PATH);

    expect(attachCommands).toHaveLength(1);
    expect(attachCommands[0]).toContain('-plist');
    expect(attachCommands[0]).not.toContain('-mountpoint');
    expect(detachCommands).toHaveLength(1);
    expect(detachCommands[0]).toContain('/Volumes/LobsterAI');
    expect(fs.promises.unlink).toHaveBeenCalledWith(DMG_PATH);
    expect(mocks.relaunch).toHaveBeenCalledOnce();
    expect(mocks.quit).toHaveBeenCalledOnce();
    expect(mocks.openPath).not.toHaveBeenCalled();
    expect(fs.promises.mkdir).not.toHaveBeenCalled();
  });

  test('detaches the stale attachment and retries with an explicit mount point', async () => {
    attachResponders = [respondNoMount, respondMountedAtRequestedPoint];

    await installUpdate(DMG_PATH);

    expect(attachCommands).toHaveLength(2);
    expect(attachCommands[1]).toContain('-mountpoint');
    expect(attachCommands[1]).toContain(`${USER_DATA}/updates/mnt-`);
    // Stale attachment from the failed first attach is torn down before the retry.
    expect(detachCommands.some((cmd) => cmd.includes('/dev/disk4'))).toBe(true);
    expect(mocks.relaunch).toHaveBeenCalledOnce();
    expect(mocks.quit).toHaveBeenCalledOnce();
    // The explicit mount point directory is removed after detach.
    expect(fs.promises.rmdir).toHaveBeenCalled();
    expect(mocks.openPath).not.toHaveBeenCalled();
  });

  test('opens the DMG in Finder and rejects when the volume never mounts', async () => {
    attachResponders = [respondNoMount, respondNoMount];
    mocks.openPath.mockResolvedValue('');

    await expect(installUpdate(DMG_PATH)).rejects.toThrow(
      'Failed to determine mount point from hdiutil output',
    );

    expect(attachCommands).toHaveLength(2);
    expect(mocks.openPath).toHaveBeenCalledWith(DMG_PATH);
    expect(detachCommands.length).toBeGreaterThan(0);
    expect(fs.promises.rmdir).toHaveBeenCalled();
    expect(mocks.quit).not.toHaveBeenCalled();
    expect(mocks.relaunch).not.toHaveBeenCalled();
  });

  test('falls back to revealing the DMG when Finder cannot open it', async () => {
    attachResponders = [respondNoMount, respondNoMount];
    mocks.openPath.mockResolvedValue('No application knows how to open this file.');

    await expect(installUpdate(DMG_PATH)).rejects.toThrow(
      'Failed to determine mount point from hdiutil output',
    );

    expect(mocks.showItemInFolder).toHaveBeenCalledWith(DMG_PATH);
  });

  test('detaches the image when the copy step fails', async () => {
    attachResponders = [respondMountedAtVolumes];
    cpMocks.exec.mockImplementation(
      (
        cmd: string,
        _opts: unknown,
        callback: (error: Error | null, stdout: string, stderr: string) => void,
      ) => {
        const respond = (err: Error | null, stdout: string) =>
          setImmediate(() => callback(err, stdout, ''));
        if (cmd.startsWith('hdiutil attach')) {
          attachCommands.push(cmd);
          respond(null, respondMountedAtVolumes());
        } else if (cmd.startsWith('hdiutil detach')) {
          detachCommands.push(cmd);
          respond(null, '');
        } else {
          // Both the plain copy and the osascript admin fallback fail.
          respond(new Error('copy failed'), '');
        }
        return {} as never;
      },
    );

    await expect(installUpdate(DMG_PATH)).rejects.toThrow('insufficient permissions');

    expect(detachCommands.length).toBeGreaterThan(0);
    expect(mocks.quit).not.toHaveBeenCalled();
  });
});
