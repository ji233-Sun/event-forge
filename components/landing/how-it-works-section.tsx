import { IconPencil, IconSparkles, IconSend } from '@tabler/icons-react'

const steps = [
  {
    number: '01',
    icon: IconPencil,
    title: 'Describe your event',
    description:
      'Enter a brief — name, theme, audience, tone. A single paragraph is enough for the AI to get started.',
    mockup: (
      <div className="border border-border bg-background p-4">
        <div className="mb-2 text-[10px] font-medium text-muted-foreground">Event brief</div>
        <div className="border border-border/60 bg-muted/40 p-2.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
          Tech conference for 300 attendees,{' '}
          <span className="text-foreground">indie hacker</span> vibe, 2-day
          event, needs sponsorship deck...
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-primary align-middle" />
        </div>
        <div className="mt-3 flex justify-end">
          <div className="bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground">
            Generate →
          </div>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: IconSparkles,
    title: 'AI generates everything',
    description:
      'Slides, event posters, background music, and interactive surveys — created in parallel, each tuned to your brief.',
    mockup: (
      <div className="border border-border bg-background p-4">
        <div className="mb-3 text-[10px] font-medium text-muted-foreground">Generating assets</div>
        <div className="space-y-2">
          {[
            { label: 'Pitch deck', w: 'w-full', done: true },
            { label: 'Event poster', w: 'w-4/5', done: true },
            { label: 'Survey form', w: 'w-3/5', done: false },
            { label: 'Soundtrack', w: 'w-2/5', done: false },
          ].map(({ label, w, done }) => (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{label}</span>
                {done && (
                  <span className="text-[9px] font-medium text-primary">Done</span>
                )}
              </div>
              <div className="h-1 w-full bg-muted">
                <div className={`h-full bg-primary transition-all ${w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    number: '03',
    icon: IconSend,
    title: 'Publish and deliver',
    description:
      'Share your slide deck, distribute the survey link, and hand off media assets — ready for any channel.',
    mockup: (
      <div className="border border-border bg-background p-4">
        <div className="mb-3 text-[10px] font-medium text-muted-foreground">Ready to share</div>
        <div className="space-y-2">
          {[
            { label: 'Pitch deck', tag: 'Slides', color: 'bg-primary/10 text-primary' },
            { label: 'Event poster', tag: 'PNG', color: 'bg-muted text-muted-foreground' },
            { label: 'Audience survey', tag: 'Live', color: 'bg-primary/10 text-primary' },
          ].map(({ label, tag, color }) => (
            <div
              key={label}
              className="flex items-center justify-between border border-border/60 px-3 py-2"
            >
              <span className="text-[11px] text-foreground">{label}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 ${color}`}>{tag}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Brief in. Full event kit out.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Three steps from blank page to a complete set of event assets.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {steps.map(({ number, icon: Icon, title, description, mockup }) => (
            <div key={number} className="flex flex-col">
              {/* Mockup preview */}
              <div className="mb-6">{mockup}</div>

              {/* Step meta */}
              <div className="flex items-start gap-4">
                <span className="mt-0.5 text-3xl font-black tabular-nums text-border">
                  {number}
                </span>
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Icon size={16} className="text-primary" />
                    <h3 className="text-sm font-semibold">{title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
