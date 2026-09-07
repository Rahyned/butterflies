import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import { fsMock, dialogMock, openerMock } from './test/setup';

function rectEl(over = {}) {
  return { type: 'rect', id: 'x', x: 0, y: 0, width: 10, height: 10, strokeColor: '#000', fillColor: 'transparent', strokeWidth: 2, roughness: 0, opacity: 1, seed: 1, zIndex: 1, ...over };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  document.documentElement.setAttribute('data-theme', 'dark');
  fsMock.readTextFile.mockResolvedValue('{"version":1,"elements":[]}');
  fsMock.writeTextFile.mockResolvedValue(undefined);
  dialogMock.ask.mockResolvedValue(true);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>,
  );
}

function drawRectOnCanvas() {
  const canvas = document.querySelector('canvas')!;
  fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100, button: 0 });
  fireEvent.mouseMove(canvas, { clientX: 300, clientY: 300 });
  fireEvent.mouseUp(canvas);
}

describe('App E2E — dibujo y autosave', () => {
  it('dibuja un rectángulo y el autosave lo persiste a los 30s', async () => {
    vi.useFakeTimers();
    renderApp();

    act(() => {
      fireEvent.click(screen.getByText('▦ Formas y Texto'));
    });
    act(() => {
      fireEvent.click(screen.getByText('▭ Rectángulo'));
    });

    act(() => {
      drawRectOnCanvas();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(31000);
    });

    expect(fsMock.writeTextFile).toHaveBeenCalled();
    const lastCall = fsMock.writeTextFile.mock.calls.at(-1)![1] as string;
    const data = JSON.parse(lastCall);
    expect(data.elements).toHaveLength(1);
    expect(data.elements[0].type).toBe('rect');
    expect(data.elements[0].x).toBe(100);
  });
});

describe('App E2E — atajos de teclado', () => {
  it('Ctrl+S llama al diálogo de guardado', async () => {
    renderApp();
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    await act(async () => {});
    expect(dialogMock.save).toHaveBeenCalled();
  });

  it('tecla 2 activa la herramienta rect (dropdown sigue visible)', () => {
    renderApp();
    fireEvent.keyDown(window, { key: '2' });
    expect(screen.getByTitle('Formas y Texto')).toBeInTheDocument();
  });

  it('Ctrl+0 mantiene el indicador de zoom en 100%', () => {
    renderApp();
    fireEvent.keyDown(window, { key: '0', ctrlKey: true });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('App E2E — feedback y menú', () => {
  it('Enviar feedback abre el cliente de mail', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTitle('Menú'));
    await user.click(screen.getByText('📮 Enviar feedback'));

    expect(openerMock.openUrl).toHaveBeenCalledWith(expect.stringContaining('mailto:'));
  });

  it('Nuevo no escribe autosave (canvas vacío)', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByTitle('Menú'));
    await user.click(screen.getByText('📄 Nuevo'));
    expect(fsMock.writeTextFile).not.toHaveBeenCalled();
  });
});

describe('App E2E — recovery de autosave', () => {
  it('no pide recuperar si no hay autosave', async () => {
    renderApp();
    await act(async () => {});
    expect(dialogMock.ask).not.toHaveBeenCalled();
  });

  it('pide recuperar si existe autosave con contenido', async () => {
    fsMock.readTextFile.mockResolvedValue(JSON.stringify({ version: 1, elements: [rectEl()] }));
    renderApp();
    await act(async () => {});
    expect(dialogMock.ask).toHaveBeenCalled();
  });
});