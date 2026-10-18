import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import logoDark from '../assets/logo-dark.svg';
import logoLight from '../assets/logo-light.svg';
import { STATUS_LABEL } from '../lib/plan';
import type { TripStatus } from '../types';
import { STATUS_ICON } from './icons';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionHeader({ title, aside }: { title: string; aside?: string }) {
  return (
    <div className="section-header">
      <h2 className="t-overline">{title}</h2>
      {aside ? <span className="t-caption">{aside}</span> : null}
    </div>
  );
}

/** A card with its own heading. */
export function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card panel">
      <div className="stack g-xs">
        <h2 className="t-heading">{title}</h2>
        {description ? <p className="t-caption muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A heading above content that draws its own card. */
export function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="stack g-md">
      <div className="stack g-xs" style={{ padding: '0 4px' }}>
        <h2 className="t-heading">{title}</h2>
        {description ? <p className="t-caption muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Button({
  label,
  icon: Icon,
  onClick,
  variant = 'primary',
  disabled,
  title,
}: {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button type="button" className={`btn btn-${variant}`} onClick={onClick} disabled={disabled} title={title}>
      {Icon ? <Icon size={20} aria-hidden /> : null}
      {label}
    </button>
  );
}

export function LinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="link-btn" onClick={onClick}>
      {label}
    </button>
  );
}

export function Chip({ label, selected, onClick, ariaLabel }: { label: string; selected: boolean; onClick: () => void; ariaLabel?: string }) {
  return (
    <button type="button" className="chip" aria-pressed={selected} aria-label={ariaLabel} title={label} onClick={onClick}>
      {label}
    </button>
  );
}

export function Banner({
  icon: Icon,
  title,
  body,
  action,
  tone = 'info',
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  tone?: 'info' | 'warn';
}) {
  return (
    <div className={`banner ${tone === 'warn' ? 'warn' : ''}`} role="status">
      <Icon size={22} aria-hidden />
      <div className="stack g-xs grow">
        <p className="t-strong">{title}</p>
        {body ? <p className="t-caption muted">{body}</p> : null}
        {action ? <LinkButton label={action.label} onClick={action.onClick} /> : null}
      </div>
    </div>
  );
}

export function SwitchRow({
  label,
  helper,
  value,
  onChange,
  color,
}: {
  label: string;
  helper?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <label className="switch-row">
      <span className="stack g-xs grow">
        <span className="row g-sm">
          {color ? <span style={{ width: 10, height: 10, borderRadius: 5, background: color }} /> : null}
          <span className="t-strong">{label}</span>
        </span>
        {helper ? <span className="t-caption muted">{helper}</span> : null}
      </span>
      <button type="button" role="switch" className="switch" aria-checked={value} aria-label={label} onClick={() => onChange(!value)} />
    </label>
  );
}

/** Status is always shown as icon + text, never colour alone. */
export function StatusPill({ status }: { status: TripStatus }) {
  const Icon = STATUS_ICON[status];
  return (
    <span className={`pill status-${status}`}>
      <Icon size={14} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** The Leavy mark: black tile in light mode, white tile in dark mode. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <picture>
      <source srcSet={logoDark} media="(prefers-color-scheme: dark)" />
      <img src={logoLight} width={size} height={size} alt="Leavy logo" className="logo" />
    </picture>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="progressbar" aria-label={label} />;
}
