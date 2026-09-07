import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { installCanvas2DStub } from './canvas2d';

installCanvas2DStub();

const fsMock = {
  writeTextFile: vi.fn(async () => undefined),
  readTextFile: vi.fn(async () => '{"version":1,"elements":[]}'),
  writeFile: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
};

const dialogMock = {
  save: vi.fn(async () => 'C:\\fake\\file.json'),
  open: vi.fn(async () => null),
  ask: vi.fn(async () => true),
  message: vi.fn(async () => undefined),
};

const openerMock = {
  openUrl: vi.fn(async () => undefined),
};

const pathMock = {
  appDataDir: vi.fn(async () => 'C:\\fake\\appdata\\'),
};

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}));

vi.mock('@tauri-apps/plugin-fs', () => fsMock);

vi.mock('@tauri-apps/plugin-dialog', () => dialogMock);

vi.mock('@tauri-apps/plugin-opener', () => openerMock);

vi.mock('@tauri-apps/api/path', () => pathMock);

vi.stubGlobal('__TAURI_INTERNALS__', {
  invoke: vi.fn(),
  metadata: { currentWindow: { label: 'main' } },
});

export { fsMock, dialogMock, openerMock, pathMock };