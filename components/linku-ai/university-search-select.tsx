"use client";

import { useState, useCallback, useRef, useEffect } from "react";

type University = { id: string; name: string; slug: string; state?: string | null };

const DEBOUNCE_MS = 300;

export function UniversitySearchSelect({
  value,
  onChange,
  placeholder = "Search universities…",
  disabled = false,
}: {
  value: string;
  onChange: (universityId: string, university: University | null) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<University | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef<string>(value);

  const fetchOptions = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/linku-ai/universities?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setOptions([]);
        return;
      }
      setOptions(Array.isArray(data) ? data : []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOptions(query);
    }, query ? DEBOUNCE_MS : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchOptions]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      if (prevValueRef.current) setQuery("");
      prevValueRef.current = "";
      return;
    }
    prevValueRef.current = value;
    if (selected?.id === value) return;
    if (options.some((o) => o.id === value)) {
      setSelected(options.find((o) => o.id === value) ?? null);
      return;
    }
    fetch(`/api/linku-ai/universities/${encodeURIComponent(value)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((u: University | null) => setSelected(u ?? null))
      .catch(() => setSelected(null));
  }, [value, options, selected?.id]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex rounded-input border border-slate-200 bg-white overflow-hidden"
        role="combobox"
        aria-expanded={open}
        aria-controls="university-listbox"
        aria-haspopup="listbox"
      >
        <input
          type="text"
          value={open ? query : selected ? selected.name : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) {
              setSelected(null);
              onChange("", null);
            }
          }}
          onFocus={() => {
            setOpen(true);
            if (options.length === 0 && !loading && !query) fetchOptions("");
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 px-3 py-2 text-body-sm border-0 focus:ring-2 focus:ring-brand-500 focus:ring-inset outline-none"
          aria-autocomplete="list"
          id="university-search"
        />
        {loading && (
          <span className="flex items-center px-2 text-caption text-slate-400" aria-hidden>
            Searching…
          </span>
        )}
      </div>
      {open && (loading || query || options.length > 0) && (
        <ul
          id="university-listbox"
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-input border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && options.length === 0 ? (
            <li className="px-3 py-2 text-body-sm text-slate-500">Loading…</li>
          ) : options.length === 0 ? (
            <li className="px-3 py-2 text-body-sm text-slate-500">No universities found. Try a different search.</li>
          ) : (
            options.map((u) => (
              <li
                key={u.id}
                role="option"
                aria-selected={value === u.id}
                className={`cursor-pointer px-3 py-2 text-body-sm ${
                  value === u.id ? "bg-brand-50 text-brand-800" : "text-slate-800 hover:bg-slate-50"
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSelected(u);
                  setQuery("");
                  onChange(u.id, u);
                  setOpen(false);
                }}
              >
                {u.name}
                {u.state ? <span className="text-slate-500"> — {u.state}</span> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
