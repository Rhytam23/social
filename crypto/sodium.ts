import sodiumImport from 'libsodium-wrappers';

// `libsodium-wrappers` is a WASM build of libsodium that runs identically in
// the browser and in Node (vitest). It replaces `@signalapp/libsignal-client`
// as the E2EE engine here: libsignal ships only native `.node` binaries
// (see docs/20_E2EE_SPEC.md), which cannot be loaded by a web page at all.
let readyPromise: Promise<typeof sodiumImport> | null = null;

export async function getSodium(): Promise<typeof sodiumImport> {
  if (!readyPromise) {
    readyPromise = sodiumImport.ready.then(() => sodiumImport);
  }
  return readyPromise;
}
