"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SlidePreview, type SlidePreviewHandle } from "@/components/slide-preview";
import { ThumbnailStrip } from "@/components/slide-studio/thumbnail-strip";
import { EditPanel } from "@/components/slide-studio/edit-panel";
import { parseSlides, getSlideTitle } from "@/lib/slides";
import {
  IconSparkles,
  IconLoader2,
  IconDice,
  IconArrowLeft,
  IconPresentation,
} from "@tabler/icons-react";

type Phase = "input" | "generating" | "studio";

interface SlideSession {
  markdown: string;
  html: string;
  css: string;
}

const samplePrompts = [
  "A campus country music festival for 200 attendees with sponsor booths, handmade market stalls, and food pop-ups.",
  "A university esports league across five campuses with 500 expected spectators and a need for hardware sponsorships.",
  "A student startup demo day with 100 teams, investor judges, and a pitch deck tailored for corporate partners.",
  "A campus charity marathon with 1,000 runners looking for wellness brands, hydration partners, and volunteer support.",
  "An international culture festival showcasing 20 countries with 800 attendees and diverse brand collaboration opportunities.",
  "A university technology expo focused on AI and robotics, targeting 300 attendees and outreach to tech sponsors.",
  "A graduation photography exhibition featuring four years of student memories and sponsorship outreach to camera brands.",
  "A zero-waste campus market for 400 participants featuring secondhand exchange, eco workshops, and green brand partnerships.",
];

export default function SlideStudioPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [prompt, setPrompt] = useState("");
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [session, setSession] = useState<SlideSession | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const currentSlideIndexRef = useRef(currentSlideIndex);
  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const previewRef = useRef<SlidePreviewHandle>(null);

  // ── Phase: input → generating ──────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerateError(null);
    setPhase("generating");

    try {
      const res = await fetch("/api/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        let message = "Generation failed";
        try {
          const err = await res.json();
          message = err.error || message;
        } catch {
          /* non-JSON body */
        }
        throw new Error(message);
      }

      const data = (await res.json()) as {
        html?: string;
        css?: string;
        markdown?: string;
      };
      if (!data.html || !data.css || !data.markdown) {
        throw new Error("Invalid response from generation API");
      }

      setSession({ html: data.html, css: data.css, markdown: data.markdown });
      setCurrentSlideIndex(0);
      setPhase("studio");
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("input");
    }
  }

  // ── Studio: edit handler ───────────────────────────────────────────────
  const handleEdit = useCallback(
    async (instruction: string, scope: "current" | "all") => {
      if (!session) return;
      setEditLoading(true);
      setEditError(null);

      try {
        const res = await fetch("/api/edit-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            markdown: session.markdown,
            instruction,
            scope,
            currentSlideIndex: currentSlideIndexRef.current,
          }),
        });

        if (!res.ok) {
          let message = "Edit failed";
          try {
            const err = await res.json();
            message = err.error || message;
          } catch {
            /* non-JSON body */
          }
          throw new Error(message);
        }

        const data = (await res.json()) as {
          html?: string;
          css?: string;
          markdown?: string;
        };
        if (!data.html || !data.css || !data.markdown) {
          throw new Error("Invalid response from edit API");
        }

        const newSlideCount = parseSlides(data.markdown).length;
        const nextIndex =
          currentSlideIndexRef.current < newSlideCount
            ? currentSlideIndexRef.current
            : newSlideCount - 1;

        setSession({ html: data.html, css: data.css, markdown: data.markdown });
        setCurrentSlideIndex(nextIndex);
      } catch (e) {
        setEditError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setEditLoading(false);
      }
    },
    [session]
  );

  // ── Derived state for studio ───────────────────────────────────────────
  const slides = session ? parseSlides(session.markdown) : [];
  const titles = slides.map((seg, i) => getSlideTitle(seg, `Slide ${i + 1}`));

  // ── Render ─────────────────────────────────────────────────────────────
  if (phase === "input") {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Slide Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Describe your event and get an AI-generated sponsorship pitch deck
          </p>
        </header>

        <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
          <div className="flex flex-col gap-4">
            {generateError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {generateError}
              </div>
            )}

            <textarea
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your event... e.g., 'A cyberpunk-themed campus music festival for 200 people, need sponsorship, ticket sales, and band voting'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                <IconSparkles className="size-4 mr-1" />
                Generate Pitch Deck
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPrompt(
                    samplePrompts[
                      Math.floor(Math.random() * samplePrompts.length)
                    ]
                  )
                }
              >
                <IconDice className="size-4 mr-1" />
                Random Prompt
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <IconLoader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-lg font-medium">Crafting your slides...</p>
        <p className="text-sm text-muted-foreground">
          This usually takes 15–30 seconds
        </p>
      </div>
    );
  }

  // phase === "studio"
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Studio top bar */}
      <header className="border-b px-4 py-2 flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setPhase("input");
            setSession(null);
            setCurrentSlideIndex(0);
            setEditError(null);
          }}
        >
          <IconArrowLeft className="size-4 mr-1" />
          Start Over
        </Button>
        <h1 className="text-sm font-semibold">Slide Studio</h1>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{slides.length} slides</span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => previewRef.current?.present()}
          >
            <IconPresentation className="size-4 mr-1" />
            Present
          </Button>
        </div>
      </header>

      {/* Three-column studio layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: thumbnail strip */}
        <aside className="w-40 shrink-0 border-r overflow-y-auto">
          <ThumbnailStrip
            slides={slides}
            activeIndex={currentSlideIndex}
            onSelect={(i) => setCurrentSlideIndex(i)}
            titles={titles}
          />
        </aside>

        {/* Center: slide viewer */}
        <main className="flex-1 overflow-hidden bg-black">
          {session && (
            <SlidePreview
              ref={previewRef}
              html={session.html}
              css={session.css}
              currentSlide={currentSlideIndex}
              onSlideChange={setCurrentSlideIndex}
            />
          )}
        </main>

        {/* Right: edit panel */}
        <aside className="w-80 shrink-0 border-l overflow-y-auto">
          <EditPanel
            currentSlideNumber={currentSlideIndex + 1}
            onEdit={handleEdit}
            isLoading={editLoading}
            error={editError}
          />
        </aside>
      </div>
    </div>
  );
}
