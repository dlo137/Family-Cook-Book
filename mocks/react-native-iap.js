// Mock for react-native-iap v14 — used in Expo Go / dev only.
// All methods are no-ops. Production builds use the real module.
module.exports = {
  initConnection: async () => {},
  endConnection: async () => {},
  getSubscriptions: async () => [],
  requestSubscription: async () => {},
  finishTransaction: async () => {},
  purchaseUpdatedListener: () => ({ remove: () => {} }),
  purchaseErrorListener: () => ({ remove: () => {} }),
};
