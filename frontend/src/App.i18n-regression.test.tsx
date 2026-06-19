import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

let storageStore: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string): string | null => storageStore[key] ?? null,
  setItem: (key: string, value: string): void => {
    storageStore[key] = String(value);
  },
  removeItem: (key: string): void => {
    delete storageStore[key];
  },
  clear: (): void => {
    storageStore = {};
  },
  key: (index: number): string | null => Object.keys(storageStore)[index] ?? null,
  get length() {
    return Object.keys(storageStore).length;
  },
};

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((contextId: string) => {
    if (contextId === 'webgl' || contextId === 'experimental-webgl') {
      return {
        VERTEX_SHADER: 0x8b31,
        FRAGMENT_SHADER: 0x8b30,
        ARRAY_BUFFER: 0x8892,
        STATIC_DRAW: 0x88e4,
        FLOAT: 0x1406,
        TRIANGLE_STRIP: 0x0005,
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        createProgram: () => ({}),
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        getAttribLocation: () => 0,
        enableVertexAttribArray: () => {},
        vertexAttribPointer: () => {},
        getUniformLocation: () => ({}),
        viewport: () => {},
        uniform1f: () => {},
        uniform2f: () => {},
        drawArrays: () => {},
        deleteProgram: () => {},
      } as unknown as WebGLRenderingContext;
    }

    return {
      clearRect: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      fillRect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      closePath: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      setTransform: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      fillText: () => {},
      strokeText: () => {},
      measureText: () => ({ width: 0 }),
      drawImage: () => {},
    } as unknown as CanvasRenderingContext2D;
  });
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));

  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal(
    'IntersectionObserver',
    MockIntersectionObserver as unknown as typeof IntersectionObserver,
  );
});

beforeEach(() => {
  localStorageMock.clear();
  localStorage.setItem('wattai-language', 'de');
  localStorage.setItem('wattai-theme', 'dark');
});

describe('i18n regression for top tabs and landing', () => {
  it('supports reliable DE → EN → DE roundtrip across landing and top-tabs', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Startseite' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Produkte & Leistungen' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Über uns' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Kontakt' })).toBeTruthy();
      expect(screen.getByText('Die smarte Energieplattform für Heim & Flotte')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Products & Services' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'About Us' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Contact' })).toBeTruthy();
      expect(screen.getByText('The smart energy platform for home & fleet')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Products & Services' }));
    await waitFor(() => {
      expect(screen.getByText('Frequently Asked Questions')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'About Us' }));
    await waitFor(() => {
      expect(screen.getByText('Our Mission')).toBeTruthy();
      expect(screen.getByText('Our Values')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Contact' }));
    await waitFor(() => {
      expect(screen.getByText(/Questions, suggestions, or customized B2B inquiries/i)).toBeTruthy();
      expect(screen.getByText('< 24 hours')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'DE' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Startseite' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Produkte & Leistungen' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Über uns' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Kontakt' })).toBeTruthy();
      expect(screen.getByText('< 24 Stunden')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Startseite' }));
    await waitFor(() => {
      expect(screen.getByText('Die smarte Energieplattform für Heim & Flotte')).toBeTruthy();
    });

    expect(screen.queryByText('The smart energy platform for home & fleet')).toBeNull();
  });
});
