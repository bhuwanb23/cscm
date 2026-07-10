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
