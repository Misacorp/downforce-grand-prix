export {};

/**
 * This file's existence makes `npm run build` pass. It apparently fills in unknown types that exist in the dom, but not in console applications.
 */
declare global {
  type Blob = unknown;
  type URL = unknown;

  // This declaration may override the actual implementation and should be kept an eye on.
  function queueMicrotask(callback: () => void): void;
}
