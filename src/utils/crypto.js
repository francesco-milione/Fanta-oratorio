/**
 * Hasha una password con SHA-256 (Web Crypto API, disponibile su tutti i browser moderni).
 * Input: stringa già normalizzata (uppercase, trimmed).
 * Output: stringa hex a 64 caratteri.
 */
export async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Ritorna true se la stringa sembra un hash SHA-256 (64 hex chars).
 * Usato per distinguere password hashate da quelle in chiaro (migrazione).
 */
export function isHash(s) {
  return typeof s === 'string' && s.length === 64 && /^[0-9a-f]{64}$/.test(s);
}
