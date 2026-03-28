"use client";

import {
  IconLock,
  IconLockOpen2,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  TEMPLATE_KEYS,
  TEMPLATE_LABELS,
  TEMPLATE_OPTIONS,
  type TemplateKey,
  type TemplateValues,
} from "../_lib/template-config";
import type { TemplateStoreState } from "../_lib/template-store";

const PRIMARY_COLOR_HEX: Record<TemplateValues["primaryColor"], string> = {
  cyan: "#06b6d4",
  violet: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  blue: "#3b82f6",
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function readableTextOn(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#f8fafc";
}

type SidebarControlsProps = {
  state: TemplateStoreState;
  presetInput: string;
  presetError: string | null;
  onValueChange: <K extends TemplateKey>(key: K, value: TemplateValues[K]) => void;
  onToggleLock: (key: TemplateKey) => void;
  onShuffle: () => void;
  onPresetInputChange: (value: string) => void;
};

export function SidebarControls({
  state,
  presetInput,
  presetError,
  onValueChange,
  onToggleLock,
  onShuffle,
  onPresetInputChange,
}: SidebarControlsProps) {
  const accentHex = PRIMARY_COLOR_HEX[state.primaryColor.value];
  const presetErrorId = "preset-shortcode-error";

  return (
    <aside className="h-full w-[372px] shrink-0 overflow-hidden rounded-2xl border border-border bg-background text-foreground">
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-6 py-6">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Slides Test
          </p>
          <h1 className="mt-2 text-xl font-semibold leading-tight">Visual PPT Template Builder</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Shuffle style dimensions and lock what you want to keep.
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {TEMPLATE_KEYS.map((key) => {
            const row = state[key];
            const options = TEMPLATE_OPTIONS[key];
            const labelId = `template-label-${key}`;

            return (
              <div key={key} className="space-y-2.5 rounded-xl border border-border bg-card/70 p-4">
                <div className="flex items-center justify-between">
                  <p id={labelId} className="text-sm font-medium text-foreground">{TEMPLATE_LABELS[key]}</p>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[11px]"
                    style={
                      key === "primaryColor"
                        ? {
                            backgroundColor: hexToRgba(accentHex, 0.18),
                            borderColor: hexToRgba(accentHex, 0.45),
                            color: accentHex,
                          }
                        : {
                            backgroundColor: "var(--muted)",
                            borderColor: "var(--border)",
                            color: "var(--muted-foreground)",
                          }
                    }
                  >
                    {String(row.value)}
                  </span>
                </div>

                <div className="grid grid-cols-[1fr_auto] items-center gap-2.5">
                  <Select
                    onValueChange={(next) =>
                      onValueChange(key, next as TemplateValues[typeof key])
                    }
                    value={String(row.value)}
                  >
                    <SelectTrigger
                      aria-labelledby={labelId}
                      className="w-full border-border bg-card text-card-foreground focus-visible:ring-ring/40"
                    >
                      <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    aria-label={row.isLocked ? `Unlock ${TEMPLATE_LABELS[key]}` : `Lock ${TEMPLATE_LABELS[key]}`}
                    className="border transition-all hover:opacity-95"
                    onClick={() => onToggleLock(key)}
                    size="icon-sm"
                    style={
                      row.isLocked
                        ? {
                            backgroundColor: accentHex,
                            borderColor: hexToRgba(accentHex, 0.95),
                            color: readableTextOn(accentHex),
                          }
                        : {
                            backgroundColor: hexToRgba(accentHex, 0.12),
                            borderColor: hexToRgba(accentHex, 0.5),
                            color: accentHex,
                          }
                    }
                    type="button"
                    variant="outline"
                  >
                    {row.isLocked ? <IconLock size={16} /> : <IconLockOpen2 size={16} />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4 border-t border-border px-5 py-5">
          <Button className="h-11 w-full text-base" onClick={onShuffle} type="button">
            <IconRefresh size={18} />
            Shuffle
          </Button>

          <div className="space-y-2">
            <div
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground"
              id="preset-shortcode-label"
            >
              <IconSparkles size={14} />
              Preset Shortcode
            </div>
            <Input
              aria-labelledby="preset-shortcode-label"
              aria-describedby={presetError ? presetErrorId : undefined}
              className="h-10 border-border bg-card font-mono text-card-foreground"
              onChange={(event) => onPresetInputChange(event.target.value)}
              value={presetInput}
            />
            {presetError ? (
              <p id={presetErrorId} className="text-xs text-destructive" role="alert">
                {presetError}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
