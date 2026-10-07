import type { ISODate } from './types';

const pad = (n: number) => String(n).padStart(2, '0');

/** Date locale du jour au format AAAA-MM-JJ. */
export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Interprète AAAA-MM-JJ comme une date locale (midi, pour éviter les décalages d'heure). */
export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}

/** Nombre de jours de `from` à `to` (positif si `to` est après). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000);
}

export function addDays(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('fr-FR', opts);
const longFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const dayMonthFmt = fmt({ day: 'numeric', month: 'long' });
const shortFmt = fmt({ day: 'numeric', month: 'short' });
const fullFmt = fmt({ day: 'numeric', month: 'long', year: 'numeric' });
const monthFmt = fmt({ month: 'long', year: 'numeric' });
const weekdayShortFmt = fmt({ weekday: 'short' });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « jeudi 17 septembre » */
export const formatLong = (iso: ISODate) => longFmt.format(parseISODate(iso));
/** « Jeudi 17 septembre » */
export const formatLongCap = (iso: ISODate) => capitalize(formatLong(iso));
/** « 17 septembre » */
export const formatDayMonth = (iso: ISODate) => dayMonthFmt.format(parseISODate(iso));
/** « 17 sept. » */
export const formatShort = (iso: ISODate) => shortFmt.format(parseISODate(iso));
/** « 17 septembre 2026 » */
export const formatFull = (iso: ISODate) => fullFmt.format(parseISODate(iso));
/** « Septembre 2026 » */
export const formatMonth = (d: Date) => capitalize(monthFmt.format(d));
/** « jeu. » */
export const formatWeekdayShort = (iso: ISODate) => weekdayShortFmt.format(parseISODate(iso));

/** « 7 h 45 » à partir d'un horodatage ISO complet. */
export function formatTime(isoDateTime: string): string {
  const d = new Date(isoDateTime);
  return `${d.getHours()} h ${pad(d.getMinutes())}`;
}

/** « aujourd'hui », « demain », « dans 3 jours », « il y a 2 jours ». */
export function relativeDays(iso: ISODate, today: ISODate = todayISO()): string {
  const n = daysBetween(today, iso);
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  if (n === -1) return 'hier';
  if (n > 1) return `dans ${n} jours`;
  return `il y a ${-n} jours`;
}

/** « 150 $ », « 15 000 FC ». */
export function formatMoney(amount: number, currency = '$'): string {
  const value = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount);
  return `${value} ${currency}`;
}

/** Année scolaire courante, ex. « 2026-2027 » (rentrée en septembre). */
export function schoolYear(today: ISODate = todayISO()): string {
  const d = parseISODate(today);
  const start = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${start}-${start + 1}`;
}
