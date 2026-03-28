"use client";

import { IconLock, IconLockOpen2, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
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
} from "@/lib/slides/template/config";
import type { TemplateStoreState } from "@/lib/slides/template/store";

type StylePanelProps = {
  state: TemplateStoreState;
  isLoading?: boolean;
  error?: string | null;
  onValueChange: <K extends TemplateKey>(key: K, value: TemplateValues[K]) => void;
  onToggleLock: (key: TemplateKey) => void;
  onShuffle: () => void;
};

export function StylePanel({
  state,
  isLoading,
  error,
  onValueChange,
  onToggleLock,
  onShuffle,
}: StylePanelProps) {
  return (
    <div className="space-y-3 p-4">
      {error ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      {TEMPLATE_KEYS.map((key) => {
        const row = state[key];
        const options = TEMPLATE_OPTIONS[key];
        return (
          <div key={key} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {TEMPLATE_LABELS[key]}
            </p>
            <div className="flex gap-1.5">
              <Select
                value={String(row.value)}
                onValueChange={(next) =>
                  onValueChange(key, next as TemplateValues[typeof key])
                }
                disabled={isLoading}
              >
                <SelectTrigger className="h-8 flex-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(options as readonly string[]).map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={row.isLocked ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onToggleLock(key)}
                disabled={isLoading}
                aria-label={
                  row.isLocked
                    ? `Unlock ${TEMPLATE_LABELS[key]}`
                    : `Lock ${TEMPLATE_LABELS[key]}`
                }
              >
                {row.isLocked ? (
                  <IconLock size={14} />
                ) : (
                  <IconLockOpen2 size={14} />
                )}
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        className="mt-2 w-full"
        onClick={onShuffle}
        disabled={isLoading}
        size="sm"
      >
        <IconRefresh size={14} className={isLoading ? "animate-spin mr-1.5" : "mr-1.5"} />
        {isLoading ? "Restyling..." : "Shuffle"}
      </Button>
    </div>
  );
}
