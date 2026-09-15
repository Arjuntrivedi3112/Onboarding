import { lazy, type ComponentType } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";

/**
 * Lesson modules are discovered by path convention:
 *
 *   src/components/lessons/<sectionId>/<lessonSlug>.tsx
 *
 * Each exports a `LessonContent` object as its default export. Using a glob
 * rather than a hand-maintained map means adding a lesson file is all it takes
 * to register it, and Vite code-splits every lesson into its own chunk so the
 * initial bundle stays small.
 */
const lessonModules = import.meta.glob<{ default: LessonContent }>(
  "/src/components/lessons/*/*.tsx"
);

function keyFor(sectionId: string, lessonSlug: string): string {
  return `/src/components/lessons/${sectionId}/${lessonSlug}.tsx`;
}

export function hasLessonContent(sectionId: string, lessonSlug: string): boolean {
  return keyFor(sectionId, lessonSlug) in lessonModules;
}

/**
 * A lazy component that renders the lesson body slots. Returns null when the
 * lesson has no file yet, so the caller can show a placeholder instead of
 * crashing — the journey stays navigable while content is being written.
 */
export function loadLessonContent(
  sectionId: string,
  lessonSlug: string
): ComponentType<{ render: (content: LessonContent) => JSX.Element }> | null {
  const key = keyFor(sectionId, lessonSlug);
  const loader = lessonModules[key];
  if (!loader) return null;

  return lazy(async () => {
    const mod = await loader();
    const content = mod.default;
    return {
      default: ({ render }: { render: (content: LessonContent) => JSX.Element }) =>
        render(content),
    };
  });
}

/** Every lesson slug that currently has a file, for coverage checks. */
export function writtenLessonKeys(): string[] {
  return Object.keys(lessonModules);
}
