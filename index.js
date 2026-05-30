// ─── POLYFILLS MUST BE FIRST ─────────────────────────────────
// Use require() NOT import — ES imports are hoisted and run
// before any code here, making polyfills too late to apply.

require('react-native-url-polyfill/auto');

// DOMException — used by @supabase/auth-js fetch/abort internals
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name  = name || 'DOMException';
      this.code  = 0;
    }
  };
}

// structuredClone — missing in older Hermes builds
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// TextEncoder/TextDecoder — required by some supabase internals
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// ─── APP ENTRY — load AFTER polyfills are set ─────────────────
const { registerRootComponent } = require('expo');
const AppModule = require('./App');
const App = AppModule.default || AppModule;
registerRootComponent(App);
