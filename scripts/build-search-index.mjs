#!/usr/bin/env node
/**
 * Builds a content search index over every lesson's actual prose — not just
 * titles and summaries — by parsing each lesson's TypeScript/JSX source with
 * the TypeScript compiler API and walking the AST for readable text.
 *
 * Output: public/search-index.json, fetched lazily by the command palette
 * only when it's opened, so this never bloats the main bundle.
 *
 * Runs automatically before `dev` and `build` (see package.json), so it can
 * never go stale relative to the lesson files on disk.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOT = path.resolve(import.meta.dirname, "..");
const LESSONS_DIR = path.join(ROOT, "src/components/lessons");
const OUT_FILE = path.join(ROOT, "public/search-index.json");

const SKIP_TAGS = new Set(["kbd", "svg", "path", "Icon"]);
const HEADING_TAGS = new Set(["h2", "h3", "h4"]);
const MIN_SNIPPET_LENGTH = 15;
const MAX_SNIPPET_LENGTH = 220;

function collapseWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Catches the rare Tailwind class string that isn't inside a JsxAttribute at
 * all (e.g. `const rowClass = cn("min-h-[2.75rem] ...")` used elsewhere) —
 * the AST-based exclusion above can't see those as attributes because they
 * genuinely aren't. Heuristic: looks like space-separated utility classes,
 * not a sentence.
 */
function looksLikeClassList(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;
  const classyTokens = tokens.filter((t) =>
    /^(min-h-|max-h-|min-w-|max-w-|rounded|border|bg-|text-|hover:|focus:|disabled:|px-|py-|pl-|pr-|pt-|pb-|mx-|my-|gap-|flex|grid|transition|font-|leading-|tracking-|shrink-|shadow-|w-\d|h-\d)/.test(
      t
    )
  );
  return classyTokens.length / tokens.length > 0.6;
}

function getTagName(node) {
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText();
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText();
  return null;
}

/** Flattens a JSX element's own text content one level, ignoring nested elements. */
function flattenDirectText(node) {
  if (!ts.isJsxElement(node)) return "";
  return collapseWhitespace(
    node.children
      .filter((child) => ts.isJsxText(child))
      .map((child) => child.text)
      .join(" ")
  );
}

function extractLessonMeta(sourceFile) {
  // The default-exported LessonContent object literal. Its Body property is
  // a component reference (not walked structurally here); everything else
  // is walked by the same text-collecting pass as the rest of the file, so
  // whyThisMatters / objectives / takeaways / checkYourself are captured
  // automatically without special-casing their shape.
  return sourceFile;
}

/**
 * One pass over the whole file in source order. `lastHeading` is a single
 * mutable value rather than a properly scoped stack — correct because JSX
 * in these files is always written top-to-bottom in reading order, so a
 * flat "most recent heading seen" is equivalent to proper scoping here.
 */
function extractSnippets(sourceFile, fileText) {
  const snippets = [];
  let lastHeading = "";

  function pushSnippet(text, heading) {
    const clean = collapseWhitespace(text);
    if (clean.length < MIN_SNIPPET_LENGTH) return;
    if (looksLikeClassList(clean)) return;
    snippets.push({
      heading: heading || null,
      text: clean.length > MAX_SNIPPET_LENGTH ? clean.slice(0, MAX_SNIPPET_LENGTH) : clean,
    });
  }

  function visit(node) {
    // Never descend into a JSX attribute's value — className={cn(...)} and
    // aria-label="..." are not prose, and this guard is what keeps a whole
    // separate branch below (JsxElement) from ever reaching them, since that
    // branch walks only `.children`, never `.attributes`.
    if (ts.isJsxAttribute(node) || ts.isJsxAttributes(node)) return;

    if (ts.isJsxElement(node)) {
      const tag = getTagName(node);
      if (tag && SKIP_TAGS.has(tag)) return; // icons, shortcut hints — not prose

      if (tag && HEADING_TAGS.has(tag)) {
        const text = flattenDirectText(node);
        if (text) {
          lastHeading = text;
          pushSnippet(text, text);
        }
        return; // headings have no further nested prose worth walking
      }

      // Only the children — the opening element's attributes are never
      // visited, which is what excludes every className/aria-* string.
      for (const child of node.children) visit(child);
      return;
    }

    if (ts.isJsxFragment(node)) {
      for (const child of node.children) visit(child);
      return;
    }

    if (ts.isJsxSelfClosingElement(node)) {
      return; // no children; its attributes are skipped by the guard above
    }

    if (ts.isJsxText(node)) {
      pushSnippet(node.text, lastHeading);
      return;
    }

    if (ts.isJsxExpression(node)) {
      if (node.expression) visit(node.expression);
      return;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      // Reachable here only for plain code strings (data arrays, object
      // properties) — anything JSX-attribute-shaped was already excluded
      // above, regardless of which path reached this node.
      const parent = node.parent;
      const isImportish =
        parent &&
        (ts.isImportSpecifier(parent) || ts.isImportClause(parent) || ts.isImportDeclaration(parent));
      if (!isImportish) pushSnippet(node.text, lastHeading);
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return snippets;
}

function listLessonFiles() {
  const files = [];
  for (const sectionId of readdirSync(LESSONS_DIR)) {
    const sectionDir = path.join(LESSONS_DIR, sectionId);
    if (!statSync(sectionDir).isDirectory()) continue;
    for (const file of readdirSync(sectionDir)) {
      if (!file.endsWith(".tsx") || file === "_shared.tsx") continue;
      files.push({ sectionId, slug: file.replace(/\.tsx$/, ""), file: path.join(sectionDir, file) });
    }
  }
  return files;
}

/** Pulls lesson id/title/minutes from the curriculum so results can show real labels. */
function loadCurriculumMeta() {
  const dataPath = path.join(ROOT, "src/curriculum/data.ts");
  const src = readFileSync(dataPath, "utf8");
  const sf = ts.createSourceFile(dataPath, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const meta = new Map(); // `${sectionId}/${slug}` -> { lessonId, lessonTitle, sectionTitle, bookChapter, sectionNumber }
  let currentSection = null;

  function getStringProp(obj, name) {
    const prop = obj.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === name);
    if (!prop) return null;
    const init = prop.initializer;
    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) return init.text;
    if (ts.isNumericLiteral(init)) return Number(init.text);
    return null;
  }

  function visit(node) {
    if (ts.isObjectLiteralExpression(node)) {
      const hasLessons = node.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText() === "lessons");
      const hasSlug = node.properties.some((p) => ts.isPropertyAssignment(p) && p.name.getText() === "slug");
      if (hasLessons) {
        currentSection = {
          id: getStringProp(node, "id"),
          title: getStringProp(node, "title"),
          number: getStringProp(node, "number"),
          bookChapter: getStringProp(node, "bookChapter"),
        };
      } else if (hasSlug && currentSection) {
        const slug = getStringProp(node, "slug");
        const lessonId = getStringProp(node, "id");
        const title = getStringProp(node, "title");
        meta.set(`${currentSection.id}/${slug}`, {
          lessonId,
          lessonTitle: title,
          sectionId: currentSection.id,
          sectionTitle: currentSection.title,
          sectionNumber: currentSection.number,
          bookChapter: currentSection.bookChapter,
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return meta;
}

function build() {
  const curriculumMeta = loadCurriculumMeta();
  const files = listLessonFiles();
  const index = [];

  for (const { sectionId, slug, file } of files) {
    const text = readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const meta = curriculumMeta.get(`${sectionId}/${slug}`);
    if (!meta) {
      console.warn(`[search-index] no curriculum entry for ${sectionId}/${slug}, skipping`);
      continue;
    }

    const snippets = extractSnippets(extractLessonMeta(sourceFile), text);

    // Dedupe identical consecutive text (JSX fragmentation around inline
    // spans sometimes yields the same short fragment twice).
    const seen = new Set();
    for (const snippet of snippets) {
      const key = snippet.text;
      if (seen.has(key)) continue;
      seen.add(key);
      index.push({
        sectionId,
        slug,
        lessonId: meta.lessonId,
        lessonTitle: meta.lessonTitle,
        sectionTitle: meta.sectionTitle,
        heading: snippet.heading,
        text: snippet.text,
      });
    }
  }

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(index));
  console.log(`[search-index] wrote ${index.length} snippets from ${files.length} lessons to ${path.relative(ROOT, OUT_FILE)}`);
}

build();
