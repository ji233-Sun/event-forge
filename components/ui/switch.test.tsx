import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("styles checked and unchecked states via data-state selectors", () => {
    const markup = renderToStaticMarkup(
      <Switch checked={false} onCheckedChange={() => undefined} />
    );

    expect(markup).toContain("data-[state=checked]:bg-primary");
    expect(markup).toContain("data-[state=unchecked]:bg-input");
    expect(markup).toContain("data-[state=checked]:translate-x-[calc(100%-2px)]");
    expect(markup).toContain("data-[state=unchecked]:translate-x-0");
    expect(markup).not.toContain("data-checked");
    expect(markup).not.toContain("data-unchecked");
  });
});
