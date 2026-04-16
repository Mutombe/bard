"use client";

import Link from "next/link";
import {
  Eye,
  Keyboard,
  SpeakerHigh,
  TextAa,
  Envelope,
  CheckCircle,
} from "@phosphor-icons/react";
import { MainLayout } from "@/components/layout/MainLayout";

const commitments = [
  {
    icon: <Eye className="h-6 w-6" />,
    title: "Visual Accessibility",
    points: [
      "WCAG 2.1 AA contrast ratios across all text",
      "Resizable text without breaking layouts",
      "Light and dark themes for reader preference",
      "Focus indicators on all interactive elements",
    ],
  },
  {
    icon: <Keyboard className="h-6 w-6" />,
    title: "Keyboard Navigation",
    points: [
      "All functionality available via keyboard",
      "Logical tab order throughout the site",
      "Skip-to-content links on long pages",
      "No keyboard traps in modals or menus",
    ],
  },
  {
    icon: <SpeakerHigh className="h-6 w-6" />,
    title: "Screen Reader Support",
    points: [
      "Semantic HTML structure throughout",
      "ARIA labels on icons and interactive controls",
      "Alt text on meaningful images",
      "Article text-to-speech available on detail pages",
    ],
  },
  {
    icon: <TextAa className="h-6 w-6" />,
    title: "Readable Content",
    points: [
      "Editorial typography (Fraunces, Newsreader) optimized for reading",
      "Generous line spacing for long-form articles",
      "Plain-language summaries on research reports",
      "Pinch-to-zoom enabled on all viewports",
    ],
  },
];

const standards = [
  "Web Content Accessibility Guidelines (WCAG) 2.1 — Level AA",
  "Section 508 of the U.S. Rehabilitation Act",
  "European EN 301 549 standard",
];

export default function AccessibilityPage() {
  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-brand-plum text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-xs font-medium uppercase tracking-[0.2em] text-brand-coral mb-5">
            Accessibility Statement
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-bold mb-5 leading-tight">
            Built for every reader
          </h1>
          <p className="text-lg md:text-xl text-white/85 leading-relaxed font-serif-body">
            BGFI is committed to making African financial intelligence accessible to all readers — regardless of ability, device, or context. Our platform is designed and tested to meet international accessibility standards.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16 md:py-20">
        {/* Standards */}
        <section className="mb-16">
          <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
            Standards We Follow
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6">
            International accessibility standards
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-serif-body mb-6">
            We strive to conform to the following standards in everything we publish:
          </p>
          <ul className="space-y-3">
            {standards.map((s) => (
              <li key={s} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-brand-coral flex-shrink-0 mt-0.5" weight="fill" />
                <span className="text-base">{s}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Our Commitments */}
        <section className="mb-16">
          <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
            What We Do
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8">
            Our accessibility commitments
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {commitments.map((c) => (
              <div key={c.title} className="p-6 bg-terminal-bg-secondary border border-terminal-border">
                <div className="h-12 w-12 bg-brand-plum/10 text-brand-plum flex items-center justify-center mb-4">
                  {c.icon}
                </div>
                <h3 className="font-serif text-lg font-bold mb-3">{c.title}</h3>
                <ul className="space-y-2">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-brand-coral flex-shrink-0 mt-1">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Known Limitations */}
        <section className="mb-16">
          <div className="text-xs font-medium uppercase tracking-[0.15em] text-brand-violet mb-3">
            Honest Disclosure
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-5">
            Known limitations
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-serif-body mb-4">
            We&apos;re continuously improving. The following are known accessibility gaps we&apos;re actively working to address:
          </p>
          <ul className="space-y-3 text-base text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-brand-coral mt-1">·</span>
              <span>Some scraped article images may lack descriptive alt text — we&apos;re building automated alt-text generation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-coral mt-1">·</span>
              <span>PDF research reports are not yet fully tagged for screen readers — HTML versions are in development</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-coral mt-1">·</span>
              <span>Embedded video transcripts are not yet available for all content</span>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section className="p-8 bg-brand-plum text-white">
          <Envelope className="h-8 w-8 text-brand-coral mb-4" />
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-3">
            Found an accessibility issue?
          </h2>
          <p className="text-white/85 leading-relaxed mb-6 max-w-2xl">
            We take accessibility seriously. If you encounter any barrier on the platform — broken navigation, missing alt text, low contrast, anything — please tell us so we can fix it.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:accessibility@bgfi.global"
              className="inline-flex items-center gap-2 px-5 py-3 bg-brand-coral text-white text-sm font-semibold uppercase tracking-wider hover:bg-brand-coral-dark transition-colors"
            >
              <Envelope className="h-4 w-4" />
              accessibility@bgfi.global
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 border border-white/30 text-white text-sm font-semibold uppercase tracking-wider hover:bg-white/10 transition-colors"
            >
              General contact
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
