import { NextRequest, NextResponse } from "next/server";
import { getApiKeyWorkspace } from "@/lib/api-key-auth";
import { getWorkspaceInstagramAccount } from "@/lib/instagram-accounts";
import { getUserMedia } from "@/lib/meta/client";
import { decryptToken } from "@/lib/meta/oauth";

// Bearer-key endpoint used by the reel-studio campaign script to grab the most
// recent reels (id, caption, permalink) without a browser session.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const apiKeyContext = await getApiKeyWorkspace(request);
  if (!apiKeyContext) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const account = await getWorkspaceInstagramAccount(apiKeyContext.workspaceId);
  if (!account) {
    return NextResponse.json(
      { success: false, error: "Instagram account not connected" },
      { status: 400 }
    );
  }

  try {
    const token = decryptToken(account.accessToken);
    const media = await getUserMedia(token, 25);
    const reels = media
      .filter((m) => m.media_product_type === "REELS")
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .map((m) => ({
        id: m.id,
        caption: m.caption ?? "",
        permalink: m.permalink ?? null,
        timestamp: m.timestamp,
      }));

    return NextResponse.json(
      { success: true, data: reels },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("[Reels Latest] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reels" },
      { status: 500 }
    );
  }
}
