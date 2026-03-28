import {
  IconPresentationAnalytics,
  IconPhoto,
  IconCheckbox,
  IconTool,
} from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const features = [
  {
    icon: IconPresentationAnalytics,
    title: 'AI-Powered Slides',
    description:
      'Generate professional presentation slides in seconds. Our AI understands your topic and creates structured, visually appealing content automatically.',
  },
  {
    icon: IconPhoto,
    title: 'Rich Multimedia',
    description:
      'Embed images, videos, audio, and interactive media seamlessly. Create engaging experiences that captivate your audience.',
  },
  {
    icon: IconCheckbox,
    title: 'Smart Surveys',
    description:
      'Build dynamic surveys and polls that adapt in real-time. Collect feedback instantly and visualize responses with live analytics.',
  },
  {
    icon: IconTool,
    title: 'Mini Tools & Widgets',
    description:
      'Embed interactive calculators, timers, Q&A boards, and custom widgets. Make your events truly participatory and memorable.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative px-4 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A complete toolkit powered by AI to plan, create, and deliver exceptional events
            from start to finish.
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={28} />
                </div>
                <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
