"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconLoader2 } from "@tabler/icons-react";

interface EditPanelProps {
  /** 1-based slide number shown in the badge (display only) */
  currentSlideNumber: number;
  /** Called when user submits an edit instruction */
  onEdit: (instruction: string, scope: "current" | "all") => Promise<void>;
  /** Whether an edit request is in-flight */
  isLoading: boolean;
  /** Error message from the last failed edit, or null */
  error: string | null;
}

export function EditPanel({
  currentSlideNumber,
  onEdit,
  isLoading,
  error,
}: EditPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [applyToAll, setApplyToAll] = useState(false);

  async function handleSubmit() {
    if (!instruction.trim() || isLoading) return;
    await onEdit(instruction.trim(), applyToAll ? "all" : "current");
    setInstruction("");
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div>
        <h2 className="text-sm font-semibold">AI Edit</h2>
        {!applyToAll && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Editing: Slide {currentSlideNumber}
          </p>
        )}
      </div>

      {/* Scope toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="scope-toggle"
          checked={applyToAll}
          onCheckedChange={setApplyToAll}
          disabled={isLoading}
        />
        <Label htmlFor="scope-toggle" className="text-xs cursor-pointer">
          Apply to entire presentation
        </Label>
      </div>

      {/* Instruction input */}
      <Label htmlFor="edit-instruction" className="sr-only">
        Edit instruction
      </Label>
      <textarea
        id="edit-instruction"
        className="w-full flex-1 min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        placeholder={
          applyToAll
            ? "Describe changes to the whole deck..."
            : "Describe changes to this slide..."
        }
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        disabled={isLoading}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
      />

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading || !instruction.trim()}
        className="w-full"
      >
        {isLoading ? (
          <>
            <IconLoader2 className="size-4 mr-1 animate-spin" />
            Applying edit...
          </>
        ) : (
          <>
            <IconSparkles className="size-4 mr-1" />
            Apply Edit
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        ⌘ + Enter to submit
      </p>
    </div>
  );
}
