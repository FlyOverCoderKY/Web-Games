import "@testing-library/jest-dom";

// jsdom polyfill for ThemeContext system appearance detection
// Ensure matchMedia is a callable function with the expected shape
if (
  typeof (window as unknown as { matchMedia?: unknown }).matchMedia !==
  "function"
) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jsdom polyfill for ResizeObserver (used by @headlessui/react)
if (
  typeof (window as unknown as { ResizeObserver?: unknown }).ResizeObserver !==
  "function"
) {
  class ResizeObserverMock {
    constructor() {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (window as unknown as { ResizeObserver?: unknown }).ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
}
