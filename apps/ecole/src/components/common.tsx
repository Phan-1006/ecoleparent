import { errorMessage } from '@pe/shared/api';
import { Button, Modal, cx, useToast } from '@pe/shared/ui';
import { Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-1">
        <h1 className="font-display text-[28px] leading-tight font-bold">{title}</h1>
        {description && <p className="text-[15px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={cx('relative flex items-center', className)}>
      <span className="sr-only">{placeholder}</span>
      <Search size={18} className="pointer-events-none absolute left-3.5 text-ink-3" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-[#c4ccc6] bg-surface pr-3 pl-10 text-[16px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}

/** Tableau qui défile horizontalement sur petit écran. */
export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="border-b border-line bg-ground/60">
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-xs font-bold tracking-wide whitespace-nowrap text-ink-3 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line-soft [&>tr:last-child]:border-0 [&_td]:px-4 [&_td]:py-3 [&_td]:align-middle">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

/** Bouton qui demande confirmation avant une action destructive. */
export function ConfirmAction({
  label,
  title,
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
  variant = 'ghost',
  icon,
  size = 'sm',
}: {
  label: ReactNode;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
  variant?: 'ghost' | 'secondary' | 'danger';
  icon?: ReactNode;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <>
      <Button variant={variant} size={size} icon={icon} onClick={() => setOpen(true)} className={variant === 'ghost' ? 'text-danger-ink hover:bg-danger-soft' : undefined}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                  setOpen(false);
                } catch (err) {
                  toast(errorMessage(err), 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmLabel}
            </Button>
          </>
        }
      >
        <div className="text-[15px] leading-relaxed text-ink-2">{message}</div>
      </Modal>
    </>
  );
}

/** Exécute une action asynchrone avec indicateur et message d'erreur. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined> {
    setBusy(true);
    try {
      const r = await fn();
      if (success) toast(success);
      return r;
    } catch (err) {
      toast(errorMessage(err), 'error');
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

export function StatTile({ label, value, sub, tone = 'brand' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'brand' | 'danger' | 'warn' | 'info' }) {
  const color = { brand: 'text-brand', danger: 'text-danger', warn: 'text-warn', info: 'text-info' }[tone];
  return (
    <div className="flex flex-col gap-1 rounded-[20px] border border-line bg-surface p-4">
      <span className="text-[13px] font-semibold text-ink-3">{label}</span>
      <span className={cx('font-display text-[30px] leading-none font-extrabold', color)}>{value}</span>
      {sub && <span className="text-[13px] text-ink-2">{sub}</span>}
    </div>
  );
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  // BOM : Excel ouvre correctement les accents.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
