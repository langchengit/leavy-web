import { Check, House, LocateFixed, Minus, Plus } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';

import { MODE_LABEL } from '../lib/format';
import { useSettings } from '../lib/settings';
import type { LeaveTimeStyle, TravelMode } from '../types';
import { MODE_ICON } from './icons';
import { Card, Chip, LinkButton, SwitchRow } from './ui';

const MODES: TravelMode[] = ['drive', 'transit', 'walk', 'bike'];

/** Segmented control for choosing how you're getting there. Arrow keys move between modes. */
export function ModePicker({ value, onChange }: { value: TravelMode; onChange: (m: TravelMode) => void }) {
  const onKeyDown = (e: KeyboardEvent) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = MODES[(MODES.indexOf(value) + step + MODES.length) % MODES.length];
    onChange(next);
    (e.currentTarget.querySelector(`[data-mode="${next}"]`) as HTMLElement | null)?.focus();
  };
  return (
    <div className="segmented" role="radiogroup" aria-label="Travel mode" onKeyDown={onKeyDown}>
      {MODES.map((m) => {
        const Icon = MODE_ICON[m];
        const selected = m === value;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            data-mode={m}
            className="segment"
            onClick={() => !selected && onChange(m)}
          >
            <Icon size={20} aria-hidden />
            {MODE_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}

const PRESETS = [0, 5, 10, 15, 20, 30];
const STEP = 5;
const MAX = 120;

/** "How early do you want to arrive?" */
export function GraceStepper({ value, onChange }: { value: number; onChange: (min: number) => void }) {
  const set = (v: number) => onChange(Math.min(MAX, Math.max(0, v)));
  return (
    <div className="stack g-lg">
      <div className="stepper">
        <button type="button" className="step-btn" aria-label="Five minutes less" disabled={value <= 0} onClick={() => set(value - STEP)}>
          <Minus size={26} aria-hidden />
        </button>
        <div className="stepper-value" role="status" aria-label={`Grace period: ${value} minutes early`}>
          <div className="t-display">{value}</div>
          <div className="t-caption muted">{value === 0 ? 'arrive right on time' : 'min early'}</div>
        </div>
        <button type="button" className="step-btn" aria-label="Five minutes more" disabled={value >= MAX} onClick={() => set(value + STEP)}>
          <Plus size={26} aria-hidden />
        </button>
      </div>
      <div className="chips centered">
        {PRESETS.map((p) => (
          <Chip key={p} label={p === 0 ? 'None' : `${p}m`} ariaLabel={p === 0 ? 'No grace period' : `${p} minutes`} selected={p === value} onClick={() => set(p)} />
        ))}
      </div>
    </div>
  );
}

/**
 * Where a trip starts: where you are now (default) or an address typed for this event.
 * `recent` offers addresses used for other events, so home or work is one click away.
 */
export function OriginPicker({ value, recent, onChange }: { value: string | undefined; recent: string[]; onChange: (address: string | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const save = (address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setEditing(false);
  };

  if (editing) {
    const suggestions = recent.filter((r) => r !== value).slice(0, 3);
    return (
      <Card className="stack g-md">
        <form
          className="stack g-md"
          onSubmit={(e) => {
            e.preventDefault();
            save(draft);
          }}
        >
          <label className="stack g-sm">
            <span className="t-strong">Leave from this address</span>
            <input
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. 200 University Ave W, Waterloo"
              autoComplete="street-address"
              autoFocus
            />
          </label>
          {suggestions.length > 0 ? (
            <div className="stack g-sm">
              <span className="t-caption muted">Used for other events</span>
              <div className="chips">
                {suggestions.map((r) => (
                  <Chip key={r} label={r} selected={false} onClick={() => save(r)} />
                ))}
              </div>
            </div>
          ) : null}
          <button type="submit" className="btn btn-primary">
            <Check size={20} aria-hidden />
            Save address
          </button>
        </form>
        <div className="row" style={{ justifyContent: 'center' }}>
          <LinkButton
            label="Cancel"
            onClick={() => {
              setDraft(value ?? '');
              setEditing(false);
            }}
          />
        </div>
      </Card>
    );
  }

  const Icon = value ? House : LocateFixed;
  return (
    <Card className="stack g-md">
      <div className="row g-md">
        <Icon size={22} color="var(--primary)" aria-hidden style={{ flexShrink: 0 }} />
        <div className="stack g-xs grow">
          <p className="t-strong">{value ?? 'Current location'}</p>
          <p className="t-caption muted">{value ? 'Travel time is worked out from this address.' : 'Travel time is worked out from where you are now.'}</p>
        </div>
      </div>
      <div className="row wrap" style={{ columnGap: 24, rowGap: 8, paddingLeft: 34 }}>
        <LinkButton
          label={value ? 'Change address' : 'Leave from somewhere else'}
          onClick={() => {
            setDraft(value ?? '');
            setEditing(true);
          }}
        />
        {value ? <LinkButton label="Use current location" onClick={() => onChange(undefined)} /> : null}
      </div>
    </Card>
  );
}

// ---------- Preferences ----------

const HEADS_UP = [0, 5, 10, 15, 20];
const LOOK_AHEAD = [6, 12, 24, 48];
const LEAVE_TIME_STYLES: { value: LeaveTimeStyle; label: string; helper: string }[] = [
  { value: 'auto', label: 'Auto', helper: '“Leave in 25 min” when it’s close, “Leave at 6:30 PM” when it’s an hour or more away.' },
  { value: 'countdown', label: 'Time left', helper: 'Always a countdown, like “Leave in 2 h 15 min”.' },
  { value: 'clock', label: 'Clock time', helper: 'Always the time to head out, like “Leave at 6:30 PM”.' },
];

export function GraceDefaultControl() {
  const { settings, update } = useSettings();
  return (
    <>
      <GraceStepper value={settings.graceMin} onChange={(graceMin) => update({ graceMin })} />
      <p className="t-caption muted center">
        Your grace period. It applies to every event, and you can change it for a single event in its trip settings.
      </p>
    </>
  );
}

export function LeaveTimeStyleControl() {
  const { settings, update } = useSettings();
  return (
    <>
      <div className="chips">
        {LEAVE_TIME_STYLES.map((s) => (
          <Chip key={s.value} label={s.label} selected={settings.leaveTimeStyle === s.value} onClick={() => update({ leaveTimeStyle: s.value })} />
        ))}
      </div>
      <p className="t-caption muted">{LEAVE_TIME_STYLES.find((s) => s.value === settings.leaveTimeStyle)?.helper}</p>
    </>
  );
}

/** `onEnable` asks for browser notification permission from the same click. */
export function AlertsControl({ onEnable }: { onEnable?: () => void }) {
  const { settings, update } = useSettings();
  return (
    <>
      <SwitchRow
        label="Leave alerts"
        helper="A notification when it’s time to head out."
        value={settings.notifications}
        onChange={(notifications) => {
          update({ notifications });
          if (notifications) onEnable?.();
        }}
      />
      {settings.notifications ? (
        <div className="stack g-sm">
          <p className="t-strong">Extra heads-up before</p>
          <div className="chips">
            {HEADS_UP.map((m) => (
              <Chip key={m} label={m === 0 ? 'Off' : `${m} min`} selected={settings.headsUpMin === m} onClick={() => update({ headsUpMin: m })} />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function LookAheadControl() {
  const { settings, update } = useSettings();
  return (
    <div className="chips">
      {LOOK_AHEAD.map((h) => (
        <Chip key={h} label={`${h} hours`} selected={settings.lookAheadHours === h} onClick={() => update({ lookAheadHours: h })} />
      ))}
    </div>
  );
}
