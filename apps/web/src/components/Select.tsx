'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from './Icons';

export type SelectOption<T extends string | number> = { value: T; label: string };

/**
 * A custom dropdown that replaces the native <select>: the panel fades and slides open, the chevron turns,
 * and the list is keyboard friendly (arrows, Home/End, Enter, Escape, type to jump).
 */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Select',
  ariaLabel,
  id,
  className = '',
  disabled,
}: {
  value: T | '';
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  /** sizing for the trigger, e.g. "h-9 w-auto text-small" */
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(selected, 0));
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // keep the highlighted row in view while arrowing through a long list
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function show() {
    setActive(Math.max(selected, 0));
    setOpen(true);
  }

  function pick(i: number) {
    onChange(options[i].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    const last = options.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Tab') setOpen(false);
    else if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, last));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(last);
    else if (e.key === 'Enter' || e.key === ' ') pick(active);
    else if (e.key.length === 1) {
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setActive(i);
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`input flex items-center justify-between gap-2 text-left ${open ? 'border-purple-500 ring-2 ring-purple-200' : ''} ${className}`}
      >
        <span className={`truncate ${selected < 0 ? 'text-muted' : ''}`}>{selected >= 0 ? options[selected].label : placeholder}</span>
        <ChevronDownIcon size={18} className={`shrink-0 text-purple-700 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`} />
      </button>

      <ul
        ref={list}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`absolute left-0 top-full z-30 mt-1.5 max-h-64 w-max min-w-full max-w-[min(90vw,28rem)] origin-top overflow-auto rounded-lg border border-purple-100 bg-card p-1.5 shadow-card-hover transition duration-200 ease-out ${
          open ? 'visible translate-y-0 scale-100 opacity-100' : 'invisible -translate-y-2 scale-95 opacity-0'
        } motion-reduce:transition-none`}
      >
        {options.map((o, i) => (
          <li
            key={String(o.value)}
            role="option"
            aria-selected={i === selected}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(i)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-body transition-colors ${
              i === active ? 'bg-purple-50 text-purple-800' : 'text-ink'
            } ${i === selected ? 'font-semibold' : ''}`}
          >
            <span>{o.label}</span>
            {i === selected && <span aria-hidden className="text-purple-700">✓</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
