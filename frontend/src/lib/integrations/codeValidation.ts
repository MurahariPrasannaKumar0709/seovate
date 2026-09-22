import ts from "typescript";

/**
 * A safety net for every file the auto-fix pipeline generates, run before it's ever committed.
 *
 * Deliberately syntax-only, not a real build: actually running a connected user's `npm install` +
 * `next build`/`tsc` on our own server would mean executing arbitrary third-party code (their repo
 * could have anything in a postinstall script) — exactly what the product's own security posture
 * rules out ("do not execute arbitrary customer repository code on the API server"). `ts.transpileModule`
 * does a single-file syntactic parse with no project context and no code execution, so it can't catch
 * cross-file type errors (the `legal: []` inferred as `never[]` incident that broke a real deploy was
 * exactly that kind of error, and this check would not have caught it) — but it does catch the more
 * common failure mode of a string-splicing edit producing outright malformed JS/TS: unbalanced braces,
 * broken JSX, a corrupted template literal, and similar. Any file that fails this check is dropped from
 * the PR rather than ever being committed; the true backstop for what this can't catch is the required
 * post-merge deployment check (see the `/fix/merge` route).
 */
export function findSyntaxErrors(content: string, path: string): string[] {
  const result = ts.transpileModule(content, {
    fileName: path,
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.Latest,
      allowJs: true,
      noEmit: true,
    },
  });

  const diagnostics = (result.diagnostics ?? []).filter((d) => d.category === ts.DiagnosticCategory.Error);
  if (diagnostics.length === 0) return [];

  return diagnostics.map((d) => {
    const message = ts.flattenDiagnosticMessageText(d.messageText, " ");
    if (d.file && d.start !== undefined) {
      const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
      return `${path}:${line + 1}:${character + 1} — ${message}`;
    }
    return `${path} — ${message}`;
  });
}
