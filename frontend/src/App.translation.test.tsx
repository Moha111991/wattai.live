import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeAll(() => {
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
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as typeof HTMLCanvasElement.prototype.getContext;
});

beforeEach(() => {
  localStorage.clear();
});

describe('App language toggle', () => {
  it('switches the landing page marketing copy to English', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(await screen.findByText('The smart energy platform for home & fleet')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Intelligent AI Control for Your Home/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'View pricing & plans' })).toBeTruthy();
    expect(screen.getByText('Everything in one system')).toBeTruthy();
    expect(screen.getByText('Necessary only')).toBeTruthy();
  });
});
