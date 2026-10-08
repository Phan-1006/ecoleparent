// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomString(length: number): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** Préfixe de matricule tiré du nom de l'école : « Complexe Scolaire Horizon » → « CSH », « Horizon » → « HORI ». */
export function schoolCodePrefix(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (words.length === 0) return 'ECOL';
  if (words.length === 1) return words[0].slice(0, 4);
  return words
    .map((w) => w[0])
    .join('')
    .slice(0, 4);
}

/** Matricule élève : PE-<PRÉFIXE>-<ANNÉE>-<6 caractères aléatoires>, ex. PE-CSH-2026-K7P2QM. */
export function generateMatricule(prefix: string, year: number = new Date().getFullYear()): string {
  return `PE-${prefix}-${year}-${randomString(6)}`;
}

/** Remet en forme un matricule saisi à la main (majuscules, tirets). */
export function normalizeMatricule(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isMatriculeFormat(code: string): boolean {
  return /^PE-[A-Z]{1,4}-\d{4}-[A-Z0-9]{4,8}$/.test(code);
}

/**
 * Clé de téléphone : les 9 derniers chiffres. « +243 812 345 678 », « 0812345678 »
 * et « 812345678 » donnent tous « 812345678 ».
 */
export function phoneKey(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-9);
}

export function isValidPhone(phone: string): boolean {
  return phoneKey(phone).length === 9;
}

/** Référence de reçu : REC-2026-AB12CD. */
export function paymentReference(year: number = new Date().getFullYear()): string {
  return `REC-${year}-${randomString(6)}`;
}

/** Identifiant aléatoire court pour les tranches et autres sous-objets. */
export function shortId(prefix = ''): string {
  return `${prefix}${randomString(10).toLowerCase()}`;
}
