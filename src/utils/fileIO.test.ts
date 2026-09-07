import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveFile, loadFile, saveAutosave, loadAutosave, clearAutosave } from './fileIO';
import { fsMock, dialogMock, pathMock } from '../test/setup';
import type { CanvasElement } from '../types/canvas';

const rect: CanvasElement = {
  type: 'rect', id: 'a', x: 0, y: 0, width: 10, height: 10,
  strokeColor: '#000', fillColor: 'transparent',
  strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  fsMock.writeTextFile.mockResolvedValue(undefined);
  fsMock.readTextFile.mockResolvedValue('{"version":1,"elements":[]}');
  dialogMock.save.mockResolvedValue('C:\\fake\\file.json');
  dialogMock.open.mockResolvedValue(null);
  pathMock.appDataDir.mockResolvedValue('C:\\fake\\appdata\\');
});

describe('fileIO — guardar/cargar', () => {
  it('saveFile escribe el JSON con los elementos', async () => {
    const ok = await saveFile([rect]);
    expect(ok).toBe(true);
    expect(dialogMock.save).toHaveBeenCalled();
    expect(fsMock.writeTextFile).toHaveBeenCalledWith(
      'C:\\fake\\file.json',
      expect.stringContaining('"type": "rect"'),
    );
  });

  it('saveFile normaliza el color default de dark a negro', async () => {
    const darkRect = { ...rect, strokeColor: '#e2e8f0' };
    await saveFile([darkRect]);
    const lastCall = fsMock.writeTextFile.mock.calls.at(-1)![1] as string;
    const data = JSON.parse(lastCall);
    expect(data.elements[0].strokeColor).toBe('#000000');
  });

  it('saveFile devuelve false si se cancela el diálogo', async () => {
    dialogMock.save.mockResolvedValue(null);
    const ok = await saveFile([rect]);
    expect(ok).toBe(false);
    expect(fsMock.writeTextFile).not.toHaveBeenCalled();
  });

  it('loadFile devuelve null si se cancela', async () => {
    dialogMock.open.mockResolvedValue(null);
    const result = await loadFile();
    expect(result).toBeNull();
  });

  it('loadFile valida que el archivo tenga elementos', async () => {
    dialogMock.open.mockResolvedValue('C:\\fake\\file.json');
    fsMock.readTextFile.mockResolvedValue('{"version":1,"elements":[{"type":"rect"}]}');
    const result = await loadFile();
    expect(result).toHaveLength(1);
  });

  it('loadFile devuelve null si el archivo es inválido', async () => {
    dialogMock.open.mockResolvedValue('C:\\fake\\file.json');
    fsMock.readTextFile.mockResolvedValue('{"not":"elements"}');
    const result = await loadFile();
    expect(result).toBeNull();
  });
});

describe('fileIO — autosave', () => {
  it('saveAutosave escribe en appDataDir', async () => {
    await saveAutosave([rect]);
    expect(pathMock.appDataDir).toHaveBeenCalled();
    expect(fsMock.writeTextFile).toHaveBeenCalledWith(
      'C:\\fake\\appdata\\autosave.json',
      expect.stringContaining('"elements"'),
    );
  });

  it('loadAutosave lee y parsea elementos', async () => {
    fsMock.readTextFile.mockResolvedValue(JSON.stringify({ version: 1, elements: [rect] }));
    const result = await loadAutosave();
    expect(result).toHaveLength(1);
    expect(result![0].id).toBe('a');
  });

  it('loadAutosave devuelve null si no existe', async () => {
    fsMock.readTextFile.mockRejectedValue(new Error('not found'));
    const result = await loadAutosave();
    expect(result).toBeNull();
  });

  it('clearAutosave elimina el archivo', async () => {
    await clearAutosave();
    expect(fsMock.remove).toHaveBeenCalledWith('C:\\fake\\appdata\\autosave.json');
  });
});