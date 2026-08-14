"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm", même format que l'input datetime-local remplacé
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalValue(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalValue(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart) return null;
  const [y, m, d] = datePart.split("-").map(Number);
  const [h, min] = (timePart ?? "00:00").split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, h || 0, min || 0);
}

function formatDisplay(d: Date | null) {
  if (!d) return "";
  return `${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Calendrier + heure maison — le natif datetime-local est difficile à
// manipuler (mini-calendrier variable selon le navigateur/OS). Même schéma
// de popover que Select : clic extérieur ou Échap pour fermer.
export function DateTimePicker({ value, onChange, id, className }: DateTimePickerProps) {
  const selected = parseLocalValue(value);
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected) setViewMonth(selected);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function pickDay(day: number) {
    const base = selected ?? new Date();
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day, base.getHours(), base.getMinutes());
    onChange(toLocalValue(next));
  }

  function setTime(hours: number, minutes: number) {
    const base = selected ?? viewMonth;
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hours, minutes);
    onChange(toLocalValue(next));
  }

  const firstOfMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? formatDisplay(selected) : "Choisir une date et une heure"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-lg border border-border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium capitalize text-foreground">{MONTH_FORMATTER.format(viewMonth)}</p>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
            {WEEKDAY_LABELS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <span key={i} />;
              const isSelected =
                !!selected &&
                selected.getFullYear() === viewMonth.getFullYear() &&
                selected.getMonth() === viewMonth.getMonth() &&
                selected.getDate() === day;
              const isToday =
                today.getFullYear() === viewMonth.getFullYear() &&
                today.getMonth() === viewMonth.getMonth() &&
                today.getDate() === day;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-sm hover:bg-muted",
                    isSelected ? "bg-primary text-primary-foreground hover:opacity-90" : "text-foreground",
                    !isSelected && isToday && "font-semibold text-primary"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Heure</span>
            <input
              type="number"
              min={0}
              max={23}
              value={selected ? selected.getHours() : ""}
              onChange={(e) => setTime(Math.min(23, Math.max(0, Number(e.target.value) || 0)), selected?.getMinutes() ?? 0)}
              className="h-8 w-14 rounded-md border border-input bg-card px-2 text-center text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="00"
            />
            <span className="text-muted-foreground">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={selected ? selected.getMinutes() : ""}
              onChange={(e) => setTime(selected?.getHours() ?? 0, Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              className="h-8 w-14 rounded-md border border-input bg-card px-2 text-center text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="00"
            />
          </div>
        </div>
      )}
    </div>
  );
}
