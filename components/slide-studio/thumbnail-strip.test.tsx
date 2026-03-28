import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThumbnailStrip } from "./thumbnail-strip";

describe("ThumbnailStrip", () => {
  it("uses theme token classes for the active slide", () => {
    const markup = renderToStaticMarkup(
      <ThumbnailStrip
        slides={["# Intro", "## Agenda"]}
        activeIndex={0}
        onSelect={() => undefined}
        titles={["Intro", "Agenda"]}
      />
    );

    expect(markup).toContain("border-primary/60");
    expect(markup).toContain("bg-primary/10");
    expect(markup).toContain("text-primary");
  });

  it("falls back to a slide label when a title is missing", () => {
    const markup = renderToStaticMarkup(
      <ThumbnailStrip
        slides={["# Intro", "## Agenda"]}
        activeIndex={1}
        onSelect={() => undefined}
        titles={["Intro"]}
      />
    );

    expect(markup).toContain("Slide 2");
  });
});
