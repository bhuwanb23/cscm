/**
 * Test setup for the dashboard page smoke tests.
 *
 * jsdom implements neither matchMedia nor ResizeObserver, both of which the
 * console uses for layout and animation. Without these stubs every render
 * throws, which would make the suite fail for reasons unrelated to what it is
 * meant to catch.
 */

// Responsive layout reads matchMedia; jsdom returns undefined for it.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  });
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!global.IntersectionObserver) {
  global.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}

// react-router and the charts both call scrollTo; jsdom lacks it.
window.scrollTo = window.scrollTo || (() => {});

// jsdom does not implement CSS.escape, which the sidebar rail-marker uses to
// find the active nav item by its data-path selector. Real browsers all ship
// it; without a polyfill every route fails to mount in the test environment
// for a reason that has nothing to do with the code under test.
if (typeof CSS === 'undefined') {
  global.CSS = {};
}
if (typeof CSS.escape !== 'function') {
  CSS.escape = (value) =>
    String(value).replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
}

// Pages fetch on mount. Tests stub fetch per case; this is the safety net so
// an unstubbed request fails loudly rather than hanging the run.
if (!global.fetch) {
  global.fetch = () =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} }),
      text: () => Promise.resolve(''),
    });
}
