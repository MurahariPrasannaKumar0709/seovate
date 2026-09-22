import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/getSession";
import { getGitHubAccessToken } from "@/lib/integrations/githubClient";
import { prisma } from "@/lib/prisma";
import { mergePullRequest, GitHubApiError } from "@/lib/integrations/githubClient";

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json({ error: "not_logged_in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanId = typeof body.scanId === "string" ? body.scanId : null;
  if (!scanId) return NextResponse.json({ error: "missing_scan_id" }, { status: 400 });

  const scan = await prisma.technicalSeoScan.findFirst({ where: { id: scanId, userId: user.id } });
  if (!scan || !scan.fixPrNumber || !scan.fixPrRepoFullName) {
    return NextResponse.json({ error: "no_fix_pr" }, { status: 404 });
  }

  const token = await getGitHubAccessToken(user.id);
  if (!token) return NextResponse.json({ error: "github_not_connected" }, { status: 200 });

  try {
    await mergePullRequest(token, scan.fixPrRepoFullName, scan.fixPrNumber);
    return NextResponse.json({ merged: true });
  } catch (err) {
    const status = err instanceof GitHubApiError ? err.status : 500;
    return NextResponse.json({ error: "merge_failed", status }, { status: 200 });
  }
}
