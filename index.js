import 'react-native-url-polyfill/auto';

// Polyfill DOMException — missing in Hermes, required by @supabase/supabase-js
if (typeof global.DOMException === 'undefined') {
  global.DOMException = class DOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
      this.code = 0;
    }
  };
}

// Polyfill structuredClone — missing in older Hermes builds
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
