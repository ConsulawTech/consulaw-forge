import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Proposal Not Found — Consulaw</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f8faff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #0f172a;
    }
    .box { text-align: center; padding: 0 24px; }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
      background: #1B3FEE;
      color: #fff;
      font-weight: 700;
      font-size: 16px;
      padding: 10px 20px;
      border-radius: 10px;
    }
    h1 { font-size: 1.5rem; font-weight: 700; margin: 0 0 10px; }
    p  { color: #475569; font-size: 0.9rem; margin: 0; }
  </style>
</head>
<body>
  <div class="box">
    <div class="logo">Consulaw Forge</div>
    <h1>Proposal Not Found</h1>
    <p>This proposal may have been removed or the link is incorrect.</p>
  </div>
</body>
</html>`;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: proposal, error } = await admin
    .from("proposals")
    .select("id, html, status, view_count")
    .eq("slug", slug)
    .single();

  if (error || !proposal) {
    return new NextResponse(NOT_FOUND_HTML, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Rewrite the form's fetch URL so client submissions hit our real API endpoint.
  // Proposals built with the localhost placeholder are automatically corrected on serve.
  const servedHtml = (proposal.html as string).replace(
    /https?:\/\/[^\s"']*\/api\/submit-proposal/g,
    `/api/proposals/${slug}/submit`
  );

  // Fire-and-forget: track view without blocking the response
  void admin
    .from("proposals")
    .update({
      view_count: (proposal.view_count ?? 0) + 1,
      viewed_at: new Date().toISOString(),
      status: proposal.status !== "draft" ? "viewed" : "draft",
    })
    .eq("id", proposal.id);

  return new NextResponse(servedHtml, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
