// Mock module for Node.js only packages when bundling in browser/Vite
export class EventEmitter {
  on() { return this; }
  once() { return this; }
  emit() { return true; }
  removeListener() { return this; }
  removeAllListeners() { return this; }
}

export default {
  EventEmitter,
};
