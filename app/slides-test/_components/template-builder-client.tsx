"use client";

import { useEffect, useMemo, useState } from "react";

import { MarpPreview } from "./marp-preview";
import { SidebarControls } from "./sidebar-controls";
import {
  type TemplateKey,
  type TemplateValues,
} from "../_lib/template-config";
import {
  applyTemplateValues,
  createInitialTemplateStoreState,
  setTemplateValue,
  shuffleTemplateState,
  toggleTemplateLock,
  type TemplateStoreState,
} from "../_lib/template-store";
import {
  decodePreset,
  encodePreset,
  formatPresetCode,
} from "../_lib/preset-codec";

export function TemplateBuilderClient() {
  const [state, setState] = useState<TemplateStoreState>(() => createInitialTemplateStoreState());
  const values = useMemo(
    () => ({
      themeMode: state.themeMode.value,
      baseColor: state.baseColor.value,
      primaryColor: state.primaryColor.value,
      bgStyle: state.bgStyle.value,
      headingFont: state.headingFont.value,
      bodyFont: state.bodyFont.value,
      cardStyle: state.cardStyle.value,
      borderRadius: state.borderRadius.value,
    }),
    [
      state.themeMode.value,
      state.baseColor.value,
      state.primaryColor.value,
      state.bgStyle.value,
      state.headingFont.value,
      state.bodyFont.value,
      state.cardStyle.value,
      state.borderRadius.value,
    ]
  );

  const presetCode = useMemo(() => encodePreset(values), [values]);
  const [presetInput, setPresetInput] = useState<string>(() => formatPresetCode(presetCode));
  const [presetError, setPresetError] = useState<string | null>(null);

  useEffect(() => {
    setPresetInput(formatPresetCode(presetCode));
  }, [presetCode]);

  const handleShuffle = () => {
    setState((prev) => shuffleTemplateState(prev));
  };

  const handleToggleLock = (key: TemplateKey) => {
    setState((prev) => toggleTemplateLock(prev, key));
  };

  const handleValueChange = <K extends TemplateKey>(key: K, value: TemplateValues[K]) => {
    setState((prev) => setTemplateValue(prev, key, value));
  };

  const handlePresetInputChange = (nextValue: string) => {
    setPresetInput(nextValue);

    const parsed = decodePreset(nextValue);
    if (!parsed) {
      if (nextValue.trim().length === 0 || /^--preset\s*$/i.test(nextValue.trim())) {
        setPresetError(null);
      } else {
        setPresetError("Invalid preset shortcode");
      }
      return;
    }

    setPresetError(null);
    setState((prev) => applyTemplateValues(prev, parsed));
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="flex h-[calc(100vh-2rem)] items-stretch gap-4">
        <SidebarControls
          onPresetInputChange={handlePresetInputChange}
          onShuffle={handleShuffle}
          onToggleLock={handleToggleLock}
          onValueChange={handleValueChange}
          presetError={presetError}
          presetInput={presetInput}
          state={state}
        />

        <main className="min-w-0 flex-1">
          <MarpPreview values={values} />
        </main>
      </div>
    </div>
  );
}
