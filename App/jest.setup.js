jest.mock('expo-constants', () => {
  const mockConstants = {
    expoConfig: null,
    manifest: null,
    manifest2: null,
  };
  return {
    __esModule: true,
    default: mockConstants,
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    __esModule: true,
    LinearGradient: React.forwardRef((props, ref) => {
      const { children, ...rest } = props;
      return React.createElement('View', { ...rest, ref }, children);
    }),
  };
});

jest.mock('prop-types', () => {
  const noop = () => {};
  return {
    __esModule: true,
    default: { string: noop, number: noop, func: noop, bool: noop, object: noop, array: noop, oneOfType: () => noop, oneOf: () => noop },
    string: noop,
    number: noop,
    func: noop,
    bool: noop,
    object: noop,
    array: noop,
    oneOfType: () => noop,
    oneOf: () => noop,
  };
});

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => { store[key] = value; return Promise.resolve(); }),
      removeItem: jest.fn((key) => { delete store[key]; return Promise.resolve(); }),
      clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); return Promise.resolve(); }),
    },
  };
});
