import { getFileContent, getRepoTree } from "@/lib/integrations/githubClient";

export type PageFixTarget = { url: string; path: string; fixedFields: string[] };
export type PageFixSkip = { url: string; reason: string };

const USE_CLIENT_RE = /^\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["'];?/;
const GENERATE_METADATA_RE = /export\s+(async\s+)?function\s+generateMetadata\b/;
const METADATA_OBJECT_RE = /export\s+const\s+metadata\s*(:\s*[\w.<>[\], ]+)?=\s*\{/;

export type DesiredField = { mode: "insertIfMissing" | "replaceExisting"; value: string };
export type DesiredPageFixes = {
  canonical?: string;
  title?: DesiredField;
  description?: DesiredField;
  h1?: string; // heading text to inject if the page has no H1 at all
};

/** Turns a URL path into a plausible, non-fabricated title/heading — "Home" for the root, else
 *  the last path segment title-cased ("/water-heater-repair" -> "Water Heater Repair"). Never
 *  invents facts about the page, just derives a label from its own address. */
export function titleFromSlug(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  if (!last) return "Home";
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Deliberately generic, non-committal placeholder — restates the page's own title rather than
 *  inventing any new claim about the page's content. Meant to be refined by a human, not shipped
 *  as final copy — the PR body says as much. */
export function descriptionFromTitle(title: string): string {
  return `Learn more about ${title}.`;
}

/**
 * Plans a combined fix for every metadata-shaped finding on a page (missing/duplicate title,
 * missing/duplicate meta description, missing canonical, missing H1) in one pass per file, so a
 * page with several findings gets one coherent patch instead of conflicting overlapping edits.
 *
 * Safety rules (same approval-gate principle as everywhere else in this pipeline):
 *  - Client Components and dynamic `generateMetadata()` are skipped outright — see the reasons
 *    inline below.
 *  - Replacing an *existing* title/description (the "duplicate" case) only happens when its
 *    current value is a plain string literal — anything computed (a variable, template literal,
 *    function call) is left alone rather than risk rewriting logic we can't parse.
 *  - Edits are computed as a list of exact (start, end, text) ranges against the ORIGINAL file
 *    content and applied in one pass sorted back-to-front, so multiple edits to the same file
 *    can't invalidate each other's offsets.
 *  - The H1 injection is best-effort only: it looks for a single clear JSX opening tag right
 *    after `return (` and gives up (skips just that field, not the whole page) if the component's
 *    structure isn't that simple to avoid guessing at unfamiliar JSX.
 */
export async function planPageFixes(
  token: string,
  repoFullName: string,
  defaultBranch: string,
  desiredByUrl: Map<string, DesiredPageFixes>
): Promise<{ targets: (PageFixTarget & { newContent: string; sha: string })[]; skipped: PageFixSkip[] }> {
  const { entries } = await getRepoTree(token, repoFullName, defaultBranch);
  const blobPaths = new Set(entries.map((e) => e.path));

  const targets: (PageFixTarget & { newContent: string; sha: string })[] = [];
  const skipped: PageFixSkip[] = [];

  for (const [url, desired] of desiredByUrl) {
    let pathname: string;
    try {
      pathname = new URL(url).pathname;
    } catch {
      skipped.push({ url, reason: "Invalid URL" });
      continue;
    }
    const segment = pathname === "/" ? "" : pathname.replace(/\/$/, "");
    const candidates = [
      `app${segment}/page.tsx`,
      `app${segment}/page.jsx`,
      `app${segment}/page.ts`,
      `app${segment}/page.js`,
      `src/app${segment}/page.tsx`,
      `src/app${segment}/page.jsx`,
      `src/app${segment}/page.ts`,
      `src/app${segment}/page.js`,
    ];
    const matchedPath = candidates.find((c) => blobPaths.has(c));
    if (!matchedPath) {
      skipped.push({ url, reason: "Couldn't find a matching page file (only Next.js App Router pages are supported)" });
      continue;
    }

    const file = await getFileContent(token, repoFullName, matchedPath, defaultBranch);
    if (!file) {
      skipped.push({ url, reason: "Page file listed in the repo tree but couldn't be read" });
      continue;
    }

    if (USE_CLIENT_RE.test(file.content)) {
      skipped.push({ url, reason: `${matchedPath} is a Client Component ("use client") — Next.js doesn't allow exporting metadata from one` });
      continue;
    }
    if (GENERATE_METADATA_RE.test(file.content)) {
      skipped.push({ url, reason: `${matchedPath} uses a dynamic generateMetadata() function — can't safely determine what it already returns` });
      continue;
    }

    const result = planFileEdits(file.content, desired, pathname);
    if (result.fixedFields.length === 0) {
      skipped.push({ url, reason: result.reason ?? "Nothing could be safely applied" });
      continue;
    }

    targets.push({ url, path: matchedPath, newContent: result.newContent, sha: file.sha, fixedFields: result.fixedFields });
  }

  return { targets, skipped };
}

type Edit = { start: number; end: number; text: string };

function planFileEdits(
  content: string,
  desired: DesiredPageFixes,
  pathname: string
): { newContent: string; fixedFields: string[]; reason?: string } {
  const fixedFields: string[] = [];
  const edits: Edit[] = [];
  const objectMatch = METADATA_OBJECT_RE.exec(content);

  if (!objectMatch) {
    // No metadata export at all — build one from scratch with whatever fields are desired.
    const parts: string[] = [];
    if (desired.title) {
      parts.push(`title: ${JSON.stringify(desired.title.value)}`);
      fixedFields.push("title");
    }
    if (desired.description) {
      parts.push(`description: ${JSON.stringify(desired.description.value)}`);
      fixedFields.push("description");
    }
    if (desired.canonical) {
      parts.push(`alternates: { canonical: ${JSON.stringify(desired.canonical)} }`);
      fixedFields.push("canonical");
    }
    let newContent = content;
    if (parts.length > 0) {
      const exportStatement = `\nexport const metadata = { ${parts.join(", ")} };\n`;
      const importRe = /^(import .*from .*;?\s*)+/m;
      const importMatch = importRe.exec(content);
      newContent = importMatch
        ? content.slice(0, importMatch[0].length) + exportStatement + content.slice(importMatch[0].length)
        : exportStatement + content;
    }
    return applyH1IfNeeded(newContent, desired, pathname, fixedFields);
  }

  const openIndex = objectMatch.index + objectMatch[0].length - 1;
  const closeIndex = findMatchingBrace(content, openIndex);
  if (closeIndex === null) {
    return { newContent: content, fixedFields: [], reason: "Metadata object's braces couldn't be safely matched" };
  }
  const body = content.slice(openIndex + 1, closeIndex);

  if (desired.canonical) {
    if (/\balternates\s*:/.test(body)) {
      // Already has some alternates config — too risky to merge into it without real parsing.
    } else {
      fixedFields.push("canonical");
    }
  }

  // Tracks, per key, whether it ended up needing an INSERT (new key) vs a REPLACE (existing
  // string-literal edit) — a "duplicate" finding (mode "replaceExisting") on a page whose own
  // metadata object doesn't set that key at all means the rendered value is inherited from a
  // parent layout, so the fix is the same either way: add a page-level override. Only a key that
  // already exists as something *other* than a plain string literal is genuinely unsafe to touch.
  const keyInsertMode: Partial<Record<"title" | "description", boolean>> = {};

  for (const key of ["title", "description"] as const) {
    const wanted = desired[key];
    if (!wanted) continue;
    const keyExists = new RegExp(`\\b${key}\\s*:`).test(body);

    if (!keyExists) {
      fixedFields.push(key);
      keyInsertMode[key] = true;
      continue;
    }
    if (wanted.mode === "insertIfMissing") continue; // already set — nothing to do

    const existing = findStringLiteralValue(body, key);
    if (existing) {
      edits.push({
        start: openIndex + 1 + existing.start,
        end: openIndex + 1 + existing.end,
        text: JSON.stringify(wanted.value),
      });
      fixedFields.push(key);
    }
    // else: key exists but isn't a plain string literal (a variable/expression) — leave untouched.
  }

  const insertKeys: string[] = [];
  if (fixedFields.includes("canonical")) insertKeys.push(`alternates: { canonical: ${JSON.stringify(desired.canonical)} }`);
  if (fixedFields.includes("title") && keyInsertMode.title) {
    insertKeys.push(`title: ${JSON.stringify(desired.title!.value)}`);
  }
  if (fixedFields.includes("description") && keyInsertMode.description) {
    insertKeys.push(`description: ${JSON.stringify(desired.description!.value)}`);
  }
  if (insertKeys.length > 0) {
    const trimmedLength = body.replace(/\s+$/, "").length;
    const needsComma = trimmedLength > 0 && body[trimmedLength - 1] !== ",";
    const insertAt = openIndex + 1 + trimmedLength;
    edits.push({ start: insertAt, end: insertAt, text: `${needsComma ? "," : ""}\n  ${insertKeys.join(",\n  ")},` });
  }

  if (fixedFields.length === 0) {
    return { newContent: content, fixedFields: [], reason: "Metadata already sets everything requested (as something other than a plain string), or already has alternates" };
  }

  const newContent = applyEdits(content, edits);
  return applyH1IfNeeded(newContent, desired, pathname, fixedFields);
}

function applyH1IfNeeded(
  content: string,
  desired: DesiredPageFixes,
  pathname: string,
  fixedFields: string[]
): { newContent: string; fixedFields: string[]; reason?: string } {
  if (!desired.h1) return { newContent: content, fixedFields };
  const injected = injectHiddenH1(content, desired.h1);
  if (injected) {
    return { newContent: injected, fixedFields: [...fixedFields, "h1"] };
  }
  // H1 couldn't be safely added, but other fields may still have succeeded — keep those.
  return { newContent: content, fixedFields, reason: fixedFields.length === 0 ? `Couldn't find a safe place to add an H1 in this component's JSX (${pathname})` : undefined };
}

/** Best-effort: finds the first JSX element right after `return (` and inserts a visually-hidden
 *  (but real, crawlable) <h1> as its first child. Deliberately conservative — a component whose
 *  structure doesn't match this simple shape is left alone rather than guessed at. */
function injectHiddenH1(content: string, headingText: string): string | null {
  const returnRe = /return\s*\(\s*<([A-Za-z][\w.]*)/;
  const m = returnRe.exec(content);
  if (!m) return null;
  const tagStart = m.index + m[0].indexOf("<");
  const openEnd = findTagEnd(content, tagStart);
  if (openEnd === null || content[openEnd - 1] === "/") return null; // self-closing root — no children slot
  const h1 = `\n      <h1 className="sr-only">${headingText}</h1>`;
  return content.slice(0, openEnd + 1) + h1 + content.slice(openEnd + 1);
}

function findStringLiteralValue(body: string, key: string): { start: number; end: number } | null {
  const re = new RegExp(`\\b${key}\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')`);
  const m = re.exec(body);
  if (!m) return null;
  const groupStart = m.index + m[0].indexOf(m[1]);
  return { start: groupStart, end: groupStart + m[1].length };
}

function applyEdits(content: string, edits: Edit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let result = content;
  for (const e of sorted) {
    result = result.slice(0, e.start) + e.text + result.slice(e.end);
  }
  return result;
}

/** Scans forward from an opening `{` (or, via findTagEnd, a JSX `<`) tracking string/template
 *  state so quoted content can't throw off matching. Shared by the metadata-object brace matcher
 *  and the JSX tag-end finder below. */
export function findMatchingBrace(content: string, openIndex: number): number | null {
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;

  for (let i = openIndex; i < content.length; i++) {
    const ch = content[i];
    const prev = content[i - 1];
    if (inString) {
      if (ch === inString && prev !== "\\") inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}

/** Finds the `>` (or `/>`) that ends a JSX opening tag starting at `tagStart`, respecting quoted
 *  attribute values and one level of `{expression}` braces so a stray `>` inside either doesn't
 *  end the tag early. */
export function findTagEnd(content: string, tagStart: number): number | null {
  let inString: '"' | "'" | "`" | null = null;
  let braceDepth = 0;
  for (let i = tagStart; i < content.length; i++) {
    const ch = content[i];
    if (inString) {
      if (ch === inString && content[i - 1] !== "\\") inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "{") {
      braceDepth++;
      continue;
    }
    if (ch === "}") {
      braceDepth--;
      continue;
    }
    if (ch === ">" && braceDepth === 0) return i;
  }
  return null;
}
