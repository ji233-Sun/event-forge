import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  EditPanel,
  EDIT_PANEL_SUBMIT_HINT,
  EXPAND_DECK_INSTRUCTION,
  RELAYOUT_DECK_INSTRUCTION,
  handleEditInstructionKeyDown,
} from "./edit-panel";

describe("EditPanel helpers", () => {
  it("prevents the default newline and triggers submit on Ctrl+Enter", async () => {
    const preventDefault = vi.fn();
    const submit = vi.fn().mockResolvedValue(undefined);

    await handleEditInstructionKeyDown(
      {
        key: "Enter",
        ctrlKey: true,
        metaKey: false,
        preventDefault,
      },
      submit
    );

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("prevents the default newline and triggers submit on Cmd+Enter", async () => {
    const preventDefault = vi.fn();
    const submit = vi.fn().mockResolvedValue(undefined);

    await handleEditInstructionKeyDown(
      {
        key: "Enter",
        ctrlKey: false,
        metaKey: true,
        preventDefault,
      },
      submit
    );

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("ignores plain Enter", async () => {
    const preventDefault = vi.fn();
    const submit = vi.fn().mockResolvedValue(undefined);

    await handleEditInstructionKeyDown(
      {
        key: "Enter",
        ctrlKey: false,
        metaKey: false,
        preventDefault,
      },
      submit
    );

    expect(preventDefault).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();
  });
});

describe("EditPanel", () => {
  it("renders a cross-platform submit hint", () => {
    const markup = renderToStaticMarkup(
      <EditPanel
        currentSlideNumber={2}
        onEdit={async () => undefined}
        isLoading={false}
        error={null}
      />
    );

    expect(markup).toContain(EDIT_PANEL_SUBMIT_HINT);
  });

  it("renders quick-action controls for whole-deck expansion and relayout", () => {
    const markup = renderToStaticMarkup(
      <EditPanel
        currentSlideNumber={2}
        onEdit={async () => undefined}
        isLoading={false}
        error={null}
      />,
    );

    expect(markup).toContain("Quick Actions");
    expect(markup).toContain("Expand Details (All Slides)");
    expect(markup).toContain("Expand &amp; Re-layout Deck");
    expect(EXPAND_DECK_INSTRUCTION.length).toBeGreaterThan(0);
    expect(RELAYOUT_DECK_INSTRUCTION.length).toBeGreaterThan(0);
  });
});
