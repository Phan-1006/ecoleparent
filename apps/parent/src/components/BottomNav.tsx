import { cx } from '@pe/shared/ui';
import { BookOpen, CalendarCheck, House, School, Wallet, type LucideIcon } from 'lucide-react';

export type Tab = 'home' | 'fees' | 'attendance' | 'homework' | 'school';

const ITEMS: { tab: Tab; label: string; icon: LucideIcon }[] = [
  { tab: 'home', label: 'Accueil', icon: House },
  { tab: 'fees', label: 'Frais', icon: Wallet },
  { tab: 'attendance', label: 'Présences', icon: CalendarCheck },
  { tab: 'homework', label: 'Devoirs', icon: BookOpen },
  { tab: 'school', label: 'École', icon: School },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav aria-label="Navigation principale" className="safe-bottom grid grid-cols-5 border-t border-line bg-surface px-1.5 pt-1.5 pb-2">
      {ITEMS.map(({ tab: t, label, icon: Icon }) => {
        const current = t === tab;
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            aria-current={current ? 'page' : undefined}
            className={cx('flex flex-col items-center gap-0.5 py-1.5 text-xs', current ? 'font-bold text-brand' : 'font-semibold text-ink-3')}
          >
            <span className={cx('flex h-[30px] w-14 items-center justify-center rounded-full transition-colors', current && 'bg-brand-soft')}>
              <Icon size={22} strokeWidth={current ? 2.1 : 1.9} aria-hidden="true" />
            </span>
            {label}
          </button>
        );
      })}
    </nav>
  );
}
