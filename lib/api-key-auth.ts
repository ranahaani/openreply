import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";

/**
 * Bearer-key auth for programmatic access (e.g. the reel-studio campaign
 * script), so a new campaign can be created without a browser session.
 *
 * Single-user, self-hosted: when the request carries the shared
 * `OPENREPLY_API_KEY` as a bearer token, resolve to the workspace that owns
 * the most recently connected Instagram account. Returns null when the key is
 * absent or wrong, so callers fall through to normal session auth.
 */
export async function getApiKeyWorkspace(
  request: NextRequest
): Promise<{ workspaceId: string } | null> {
  const configured = process.env.OPENREPLY_API_KEY;
  if (!configured) return null;

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${configured}`) return null;

  const account = await prisma.instagramAccount.findFirst({
    orderBy: { connectedAt: "desc" },
    select: { workspaceId: true },
  });
  if (!account) return null;

  return { workspaceId: account.workspaceId };
}
