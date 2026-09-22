import { getFileContent, getRepoTree } from "@/lib/integrations/githubClient";
import { findTagEnd, findMatchingBrace } from "@/lib/integrations/pageMetadataFix";

export type DeadLinkFixTarget = { brokenUrl: string; path: string; occurrences: number };
export type DeadLinkFixSkip = { brokenUrl: string; reason: string };

// GitHub's code search API is unreliable for exactly the sites this targets: small, low-traffic
// repos can sit unindexed indefinitely ("incomplete_results": true, zero hits on a literal string
// that's definitely there) with no way to force reindexing on demand. Fetching every code file's
// content directly is slower but actually reliable — bounded here so a very large repo doesn't
// turn one fix run into hundreds of API calls.
const MAX_FILES_TO_SCAN = 200;
const FETCH_CONCURRENCY = 8;

/**
 * The auto-fix for a page that 404s and is linked from elsewhere: remove the dead link(s), not
 * fabricate the missing page. Writing placeholder content for something like a Privacy Policy or
 * Terms page and opening a PR with it is a real liability risk if it were ever merged onto a live
 * site — that's a human decision with real legal/business content behind it, not a deterministic
 * patch. Removing a link that goes nowhere is safe and unambiguous by comparison.
 *
 * A finding only tells us which *page* renders a dead link, not which *file* — on a real site
 * that link almost always lives in one shared component (a footer/nav), not duplicated in every
 * page's own source. So this scans the whole repo for the literal href rather than trying to
 * patch the page files the crawler happened to find it on. Two real-world shapes are handled:
 *  - a plain JSX attribute: `<a href="/privacy">` / `<Link href="/privacy">`
 *  - a nav-items data array: `{ href: "/privacy", label: "Privacy Policy" }` later `.map()`-ed
 *    into links — removing the whole array entry is the correct fix here, not touching JSX at all.
 */
export async function planDeadLinkRemovals(
  token: string,
  repoFullName: string,
  defaultBranch: string,
  brokenUrls: string[]
): Promise<{ targets: (DeadLinkFixTarget & { newContent: string; sha: string })[]; skipped: DeadLinkFixSkip[] }> {
  const targets: (DeadLinkFixTarget & { newContent: string; sha: string })[] = [];
  const skipped: DeadLinkFixSkip[] = [];

  const { entries } = await getRepoTree(token, repoFullName, defaultBranch);
  const codeFilePaths = entries.map((e) => e.path).filter((p) => /\.(tsx|jsx|ts|js)$/.test(p)).slice(0, MAX_FILES_TO_SCAN);

  const fileContents = new Map<string, { content: string; sha: string }>();
  let index = 0;
  async function worker() {
    while (index < codeFilePaths.length) {
      const path = codeFilePaths[index++];
      const file = await getFileContent(token, repoFullName, path, defaultBranch);
      if (file) fileContents.set(path, file);
    }
  }
  await Promise.all(Array.from({ length: FETCH_CONCURRENCY }, worker));

  for (const brokenUrl of brokenUrls) {
    let pathname: string;
    try {
      pathname = new URL(brokenUrl).pathname;
    } catch {
      skipped.push({ brokenUrl, reason: "Invalid URL" });
      continue;
    }

    let removedAny = false;
    for (const [path, file] of fileContents) {
      const result = removeLinksTo(file.content, pathname);
      if (result.removedCount > 0) {
        targets.push({ brokenUrl, path, newContent: result.content, sha: file.sha, occurrences: result.removedCount });
        removedAny = true;
      }
    }
    if (!removedAny) {
      skipped.push({ brokenUrl, reason: "Couldn't find a matching link to remove in any scanned file" });
    }
  }

  return { targets, skipped };
}

/** Exported so the orchestrating route can re-run a link removal against content another planner
 *  already patched (e.g. the same file needed both a metadata fix and a dead-link removal) —
 *  this function is pure string manipulation, no network calls, so re-running it is cheap and
 *  avoids silently dropping one of the two changes. */
export function removeLinksTo(content: string, pathname: string): { content: string; removedCount: number } {
  // All position-finding (regex matches, brace/tag matching) happens against this comment-masked
  // copy so a stale link left inside a `//` or `/* */` comment can never match, or worse, let a
  // tag-balance scan run out of a dead comment block into real, live code. `masked` is the exact
  // same length as `content` (comment interiors become spaces, newlines kept), so every index
  // found against it is safe to reuse for splicing the ORIGINAL, un-masked content.
  const masked = maskComments(content);
  const escaped = escapeRegExp(pathname);

  const ranges: { start: number; end: number }[] = [];

  const jsxHrefRe = new RegExp(`href\\s*=\\s*(["'])${escaped}\\1`, "g");
  let m: RegExpExecArray | null;
  while ((m = jsxHrefRe.exec(masked))) {
    const range = findEnclosingLinkElement(masked, m.index);
    if (range) ranges.push(range);
  }

  const dataHrefRe = new RegExp(`href\\s*:\\s*(["'])${escaped}\\1`, "g");
  while ((m = dataHrefRe.exec(masked))) {
    const range = findEnclosingObjectEntry(masked, m.index);
    if (range) ranges.push(range);
  }

  if (ranges.length === 0) return { content, removedCount: 0 };

  const sorted = [...ranges].sort((a, b) => b.start - a.start);
  const seen = new Set<string>();
  let result = content;
  let count = 0;
  for (const r of sorted) {
    const key = `${r.start}-${r.end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result = result.slice(0, r.start) + result.slice(r.end);
    count++;
  }
  return { content: result, removedCount: count };
}

/** Replaces the interior of every `//...` and `/* ... *‍/` comment with spaces (newlines kept),
 *  respecting string/template-literal state so a `//` inside a URL string isn't mistaken for a
 *  comment start. Same length as the input — every character index still lines up. */
function maskComments(content: string): string {
  let result = "";
  let inString: '"' | "'" | "`" | null = null;
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (inString) {
      result += ch;
      if (ch === inString && content[i - 1] !== "\\") inString = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      result += ch;
      i++;
      continue;
    }
    if (ch === "/" && content[i + 1] === "/") {
      while (i < content.length && content[i] !== "\n") {
        result += " ";
        i++;
      }
      continue;
    }
    if (ch === "/" && content[i + 1] === "*") {
      result += "  ";
      i += 2;
      while (i < content.length && !(content[i] === "*" && content[i + 1] === "/")) {
        result += content[i] === "\n" ? "\n" : " ";
        i++;
      }
      if (i < content.length) {
        result += "  ";
        i += 2;
      }
      continue;
    }
    result += ch;
    i++;
  }
  return result;
}

/** Finds the `<a ...href=...>...</a>` (or `<Link>`) element an href match at `hrefIndex` belongs
 *  to, tracking nested same-name tags so an inner element doesn't get mistaken for the closing
 *  tag. Returns null on anything ambiguous or unbalanced — skip rather than guess. */
function findEnclosingLinkElement(content: string, hrefIndex: number): { start: number; end: number } | null {
  const tagStartRe = /<(a|Link)\b/g;
  let best: { index: number; tag: string } | null = null;
  let m: RegExpExecArray | null;
  while ((m = tagStartRe.exec(content))) {
    if (m.index > hrefIndex) break;
    const between = content.slice(m.index, hrefIndex);
    if (!between.includes(">")) best = { index: m.index, tag: m[1] };
  }
  if (!best) return null;

  const openEnd = findTagEnd(content, best.index);
  if (openEnd === null) return null;
  if (content[openEnd - 1] === "/") return { start: best.index, end: openEnd + 1 }; // self-closing

  const boundaryRe = new RegExp(`<${best.tag}\\b|</${best.tag}>`, "g");
  boundaryRe.lastIndex = openEnd + 1;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = boundaryRe.exec(content))) {
    if (match[0].startsWith("</")) {
      depth--;
      if (depth === 0) return { start: best.index, end: boundaryRe.lastIndex };
    } else {
      const nestedOpenEnd = findTagEnd(content, match.index);
      if (nestedOpenEnd !== null && content[nestedOpenEnd - 1] !== "/") depth++;
    }
  }
  return null; // ran off the end without balancing — bail out
}

/** Finds the `{ href: "...", ... }` object-literal entry a `href:` match at `hrefIndex` belongs
 *  to (the nav-items-data-array shape), including one adjacent comma so the array stays valid
 *  JS after the entry is removed. Returns null if the enclosing braces can't be matched. */
function findEnclosingObjectEntry(content: string, hrefIndex: number): { start: number; end: number } | null {
  let depth = 0;
  let openIndex: number | null = null;
  for (let i = hrefIndex; i >= 0; i--) {
    const ch = content[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      if (depth === 0) {
        openIndex = i;
        break;
      }
      depth--;
    }
  }
  if (openIndex === null) return null;

  const closeIndex = findMatchingBrace(content, openIndex);
  if (closeIndex === null) return null;

  let start = openIndex;
  let end = closeIndex + 1;
  // Prefer eating a trailing comma (`{...},`); fall back to a leading one if this is the array's
  // last entry, so the remaining entries stay comma-separated either way.
  const afterMatch = /^\s*,/.exec(content.slice(end));
  if (afterMatch) {
    end += afterMatch[0].length;
  } else {
    const beforeMatch = /,\s*$/.exec(content.slice(0, start));
    if (beforeMatch) start -= beforeMatch[0].length;
  }
  return { start, end };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
