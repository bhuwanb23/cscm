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
