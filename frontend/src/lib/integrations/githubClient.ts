import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/integrations/crypto";

const API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

/** GitHub tokens from the OAuth web flow don't expire — no refresh needed, unlike Google's. */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider: "github" } },
  });
  if (!integration || integration.status !== "connected") return null;
  return decryptToken(integration.accessTokenEnc);
}

async function githubFetch<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GitHubApiError(`GitHub API ${path} failed: ${res.status} ${body}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type GitHubRepo = {
  full_name: string;
  default_branch: string;
  private: boolean;
  html_url: string;
};

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  for (let page = 1; ; page++) {
    const batch = await githubFetch<GitHubRepo[]>(
      token,
      `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

export async function getRepo(token: string, repoFullName: string): Promise<GitHubRepo> {
  return githubFetch<GitHubRepo>(token, `/repos/${repoFullName}`);
}

export type GitHubTreeEntry = { path: string; type: "blob" | "tree" };

/** Full recursive file listing for the repo at `ref` (its default branch). GitHub truncates
 *  past ~100k entries/7MB response — `truncated` tells the caller the list may be incomplete. */
export async function getRepoTree(
  token: string,
  repoFullName: string,
  ref: string
): Promise<{ entries: GitHubTreeEntry[]; truncated: boolean }> {
  const data = await githubFetch<{ tree: GitHubTreeEntry[]; truncated: boolean }>(
    token,
    `/repos/${repoFullName}/git/trees/${ref}?recursive=1`
  );
  return { entries: data.tree.filter((e) => e.type === "blob"), truncated: data.truncated };
}

/** Returns file content (decoded) + sha if the file exists, or null if it doesn't (404). */
export async function getFileContent(
  token: string,
  repoFullName: string,
  path: string,
  ref?: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const data = await githubFetch<{ content: string; sha: string; encoding: string }>(
      token,
      `/repos/${repoFullName}/contents/${path}${ref ? `?ref=${ref}` : ""}`
    );
    return { content: Buffer.from(data.content, "base64").toString("utf-8"), sha: data.sha };
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getRef(token: string, repoFullName: string, branch: string): Promise<string> {
  const data = await githubFetch<{ object: { sha: string } }>(
    token,
    `/repos/${repoFullName}/git/ref/heads/${branch}`
  );
  return data.object.sha;
}

export async function createBranch(
  token: string,
  repoFullName: string,
  newBranch: string,
  fromSha: string
): Promise<void> {
  await githubFetch(token, `/repos/${repoFullName}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: fromSha }),
  });
}

/** Repo-wide literal-text search (GitHub's code search API) — used to locate which file(s)
 *  reference a dead link (e.g. a shared Footer/Nav component), since a finding only tells us
 *  which *page* contains the link, not which *file* actually renders that shared component. */
export async function searchCode(token: string, repoFullName: string, literal: string): Promise<{ path: string }[]> {
  const query = `${JSON.stringify(literal)} repo:${repoFullName}`;
  const data = await githubFetch<{ items: { path: string }[] }>(token, `/search/code?q=${encodeURIComponent(query)}`);
  return data.items.map((i) => ({ path: i.path }));
}

export type GitHubCompareFile = { filename: string; status: string; additions: number; deletions: number; patch?: string };

/** Unified diffs for every file between two refs — richer than `listPullRequestFiles` (which only
 *  gives filenames + line counts), used to render an in-platform review view of a PR's changes. */
export async function compareCommits(
  token: string,
  repoFullName: string,
  base: string,
  head: string
): Promise<{ files: GitHubCompareFile[] }> {
  const data = await githubFetch<{ files: GitHubCompareFile[] }>(token, `/repos/${repoFullName}/compare/${base}...${head}`);
  return { files: data.files ?? [] };
}

// --- Git Data API: building one commit out of several file changes at once (the Contents API's
// createOrUpdateFile always makes its own commit per call, which is fine for a single file but
// produces a noisy multi-commit PR — and each intermediate commit's preview deployment gets
// cancelled by Vercel — when fixing several files together). ---

export async function createBlob(token: string, repoFullName: string, content: string): Promise<string> {
  const data = await githubFetch<{ sha: string }>(token, `/repos/${repoFullName}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({ content: Buffer.from(content, "utf-8").toString("base64"), encoding: "base64" }),
  });
  return data.sha;
}

export async function createTree(
  token: string,
  repoFullName: string,
  baseTreeSha: string,
  files: { path: string; blobSha: string }[]
): Promise<string> {
  const data = await githubFetch<{ sha: string }>(token, `/repos/${repoFullName}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", sha: f.blobSha })),
    }),
  });
  return data.sha;
}

export async function getCommitTreeSha(token: string, repoFullName: string, commitSha: string): Promise<string> {
  const data = await githubFetch<{ tree: { sha: string } }>(token, `/repos/${repoFullName}/git/commits/${commitSha}`);
  return data.tree.sha;
}

export async function createGitCommit(
  token: string,
  repoFullName: string,
  message: string,
  treeSha: string,
  parentSha: string
): Promise<string> {
  const data = await githubFetch<{ sha: string }>(token, `/repos/${repoFullName}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  return data.sha;
}

export async function updateRef(token: string, repoFullName: string, branch: string, sha: string): Promise<void> {
  await githubFetch(token, `/repos/${repoFullName}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha, force: false }),
  });
}

/** Commits several file changes to `branch` as a single commit (instead of one Contents-API call
 *  per file). `files` must be a non-empty array of {path, content}. */
export async function commitFiles(
  token: string,
  repoFullName: string,
  branch: string,
  message: string,
  files: { path: string; content: string }[]
): Promise<void> {
  const parentSha = await getRef(token, repoFullName, branch);
  const baseTreeSha = await getCommitTreeSha(token, repoFullName, parentSha);
  const blobs = await Promise.all(
    files.map(async (f) => ({ path: f.path, blobSha: await createBlob(token, repoFullName, f.content) }))
  );
  const treeSha = await createTree(token, repoFullName, baseTreeSha, blobs);
  const commitSha = await createGitCommit(token, repoFullName, message, treeSha, parentSha);
  await updateRef(token, repoFullName, branch, commitSha);
}

export async function createOrUpdateFile(
  token: string,
  repoFullName: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  existingSha?: string
): Promise<void> {
  await githubFetch(token, `/repos/${repoFullName}/contents/${path}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });
}

export type GitHubPullRequest = {
  number: number;
  state: "open" | "closed";
  merged: boolean;
  html_url: string;
  title: string;
  head: { ref: string };
  base: { ref: string };
};

export async function createPullRequest(
  token: string,
  repoFullName: string,
  title: string,
  body: string,
  head: string,
  base: string
): Promise<GitHubPullRequest> {
  return githubFetch<GitHubPullRequest>(token, `/repos/${repoFullName}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head, base }),
  });
}

export async function getPullRequest(
  token: string,
  repoFullName: string,
  number: number
): Promise<GitHubPullRequest> {
  return githubFetch<GitHubPullRequest>(token, `/repos/${repoFullName}/pulls/${number}`);
}

export type GitHubPullRequestFile = { filename: string; status: string; additions: number; deletions: number };

export async function listPullRequestFiles(
  token: string,
  repoFullName: string,
  number: number
): Promise<GitHubPullRequestFile[]> {
  return githubFetch<GitHubPullRequestFile[]>(token, `/repos/${repoFullName}/pulls/${number}/files`);
}

export async function mergePullRequest(token: string, repoFullName: string, number: number): Promise<void> {
  await githubFetch(token, `/repos/${repoFullName}/pulls/${number}/merge`, { method: "PUT", body: "{}" });
}

export async function closePullRequest(token: string, repoFullName: string, number: number): Promise<void> {
  await githubFetch(token, `/repos/${repoFullName}/pulls/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

/** Deletes a branch ref. Treats "already gone" (404) as success — deleting a branch a merge or
 *  an earlier retry already removed shouldn't surface as a failure to the caller. */
export async function deleteBranch(token: string, repoFullName: string, branch: string): Promise<void> {
  try {
    await githubFetch(token, `/repos/${repoFullName}/git/refs/heads/${branch}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof GitHubApiError && err.status === 404) return;
    throw err;
  }
}
