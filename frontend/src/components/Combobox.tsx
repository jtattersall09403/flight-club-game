import { useEffect, useMemo, useRef, useState } from "react";

export interface ComboOption {
  /** value submitted on selection (e.g. IATA code). */
  value: string;
  /** primary label shown bold (e.g. "LHR"). */
  label: string;
  /** secondary label shown dimmed (e.g. "London Heathrow, UK"). */
  meta?: string;
  /** lowercase text used for matching. */
  searchKey: string;
}

interface Props {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Width hint via container styling. */
  width?: string;
  maxResults?: number;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
  maxResults = 50,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [text, setText] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep typed text in sync if parent flips value externally.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return options.slice(0, maxResults);

    // Ranking priority:
    // 1) exact code/label match (e.g. "sin" -> "SIN"),
    // 2) label prefix matches,
    // 3) substring matches in the broader search key.
    const exact: ComboOption[] = [];
    const prefix: ComboOption[] = [];
    const contains: ComboOption[] = [];

    for (const o of options) {
      const label = o.label.toLowerCase();
      if (label === q) exact.push(o);
      else if (label.startsWith(q)) prefix.push(o);
      else if (o.searchKey.includes(q)) contains.push(o);

      if (exact.length + prefix.length + contains.length >= maxResults * 2) {
        break;
      }
    }

    return [...exact, ...prefix, ...contains].slice(0, maxResults);
  }, [text, options, maxResults]);

  function commit(opt: ComboOption) {
    onChange(opt.value);
    setText(opt.value);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="combobox" style={{ width: "100%" }}>
      <input
        className="combobox-input"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
          setHighlight(0);
          // also push raw text upstream so user sees the same value
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((h) => Math.min(filtered.length - 1, h + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(0, h - 1));
          } else if (e.key === "Enter") {
            if (open && filtered[highlight]) {
              e.preventDefault();
              commit(filtered[highlight]);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="combobox__list" role="listbox">
          {filtered.map((opt, i) => (
            <li
              key={opt.value}
              className="combobox__option"
              role="option"
              aria-selected={i === highlight}
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                commit(opt);
              }}
            >
              <span className="combobox__opt-iata">{opt.label}</span>
              {opt.meta && (
                <span className="combobox__opt-meta">{opt.meta}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
