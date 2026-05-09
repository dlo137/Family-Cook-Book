// Mock for react-native-iap v14 — used in Expo Go / dev only.
// All methods are no-ops. Production builds use the real module.
module.exports = {
  // Connection
  initConnection: async () => {},
  endConnection: async () => {},

  // v14 (Nitro) product / purchase API
  fetchProducts: async () => [],
  requestPurchase: async () => {},
  finishTransaction: async () => {},
  getAvailablePurchases: async () => [],

  // Listeners
  purchaseUpdatedListener: () => ({ remove: () => {} }),
  purchaseErrorListener: () => ({ remove: () => {} }),

  // Legacy v12 names (kept in case any imported code references them)
  getSubscriptions: async () => [],
  requestSubscription: async () => {},
};
