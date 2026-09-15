# AdTech Journey

An onboarding platform that turns *The AdTech Book* (2026 edition) into a structured,
progress-tracked learning journey for new hires.

## What this is

- **79 lessons across 11 sections**, mapped one-to-one onto the book's chapters — section 5 is
  always chapter 5. A 12th "appendix" section (AI in AdTech) sits outside the book and outside
  progress tracking.
- Every lesson has its own interactive "try it" — a live auction simulator, an attribution model
  that recomputes credit as you edit a customer journey, a discrepancy calculator checked against
  the IAB tolerance rule, and more.
- Progress is tracked per-lesson in the browser (`src/lib/progress.ts`), no login required. The
  headline percentage is minute-weighted across the book's ~633 minutes of content, so it never
  reads 100% with anything left unfinished.
- Reference tools live alongside the journey: an ecosystem map, an 89-term glossary, a document
  library, and session notes.

## Structure

```
src/curriculum/        The single source of truth: parts -> sections -> lessons
src/components/journey/  Shell, sidebar, lesson chrome, the chain-rail signature element
src/components/lessons/  One file per lesson, grouped by section
src/pages/              Route-level pages (Dashboard, SectionPage, LessonPage, reference tools)
src/lib/progress.ts      localStorage-backed progress store
```

Adding a lesson is a filesystem convention: drop a file at
`src/components/lessons/<section>/<slug>.tsx` matching the slug in `src/curriculum/data.ts`, and
it's picked up automatically via `import.meta.glob`.

## Design

Built against Apple's Human Interface Guidelines foundations (accessibility, color, typography,
layout, motion, writing) — see `src/index.css` for the token system and `src/test/design-rules.test.ts`
for the executable rules that keep it that way.

## Development

```sh
npm i
npm run dev      # start the dev server
npm run test     # run the test suite (curriculum invariants, design rules, full render sweep)
npm run build    # production build
```

## Deployment

Deployed on Vercel from `main`. `vercel.json` configures the build command and SPA rewrites.
