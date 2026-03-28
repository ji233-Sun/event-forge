"use client";

import { useMemo } from "react";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SlideDeckPreview } from "./slide-deck-preview";
import { getTemplateValues } from "@/lib/slides/template/store";
import type { TemplateStoreState } from "@/lib/slides/template/store";
import type { TemplateKey, TemplateValues } from "@/lib/slides/template/config";
import { StylePanel } from "./style-panel";

type StylePickerScreenProps = {
  prompt: string;
  templateState: TemplateStoreState;
  onValueChange: <K extends TemplateKey>(key: K, value: TemplateValues[K]) => void;
  onToggleLock: (key: TemplateKey) => void;
  onShuffle: () => void;
  onPresetApply: (values: TemplateValues) => void;
  onBack: () => void;
  onGenerate: () => void;
};

export function StylePickerScreen({
  prompt,
  templateState,
  onValueChange,
  onToggleLock,
  onShuffle,
  onPresetApply,
  onBack,
  onGenerate,
}: StylePickerScreenProps) {
  const values = useMemo(() => getTemplateValues(templateState), [templateState]);

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <p className="max-w-xs truncate text-sm font-medium text-muted-foreground">
          &ldquo;{prompt}&rdquo;
        </p>
        <Button onClick={onGenerate} size="sm">
          <IconSparkles size={14} className="mr-1.5" />
          Generate with this style
        </Button>
      </div>

      {/* Body: left controls + right preview */}
      <div className="flex min-h-0 flex-1">
        {/* Style controls */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r">
          <StylePanel
            state={templateState}
            onValueChange={onValueChange}
            onToggleLock={onToggleLock}
            onShuffle={onShuffle}
            onPresetApply={onPresetApply}
          />
        </aside>

        {/* Slide preview */}
        <main className="min-h-0 flex-1">
          <SlideDeckPreview values={values} />
        </main>
      </div>
    </div>
  );
}
