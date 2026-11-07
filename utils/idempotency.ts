/**
 * Idempotency keys for command endpoints (§11 of the payments guide).
 *
 * ⚠️ NOT cryptographically random. React Native has no `crypto.getRandomValues`
 * without a native module, and pulling one in would mean a new build every time
 * — breaking OTA delivery — for a value that only needs to be *unique per
 * attempt*, never unguessable. The key is scoped server-side by
 * `UserId + Operation + Key`, so a collision would have to happen within one
 * user's own attempts on one endpoint.
 *
 * Shaped as a v4 UUID because the guide asks for a UUID/GUID.
 */

/** Distinguishes two keys minted inside the same millisecond. */
let counter = 0;

const hex = (n: number, len: number) =>
  Math.floor(n).toString(16).padStart(len, "0").slice(-len);

const rand32 = () => hex(Math.random() * 0x100000000, 8);

export function createIdempotencyKey(): string {
  counter = (counter + 1) % 0x10000;

  // 48 bits of clock + 16 bits of counter + 64 bits of randomness = 32 hex.
  const raw = hex(Date.now(), 12) + hex(counter, 4) + rand32() + rand32();

  // Stamp the version (4) and variant (8/9/a/b) nibbles so the value is a
  // well-formed v4 UUID rather than merely UUID-shaped.
  const variant = ((parseInt(raw[16], 16) & 0x3) | 0x8).toString(16);

  return [
    raw.slice(0, 8),
    raw.slice(8, 12),
    `4${raw.slice(13, 16)}`,
    `${variant}${raw.slice(17, 20)}`,
    raw.slice(20, 32),
  ].join("-");
}
