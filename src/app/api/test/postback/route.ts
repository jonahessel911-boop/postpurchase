import { NextResponse } from "next/server";
import { recordPostback } from "@/lib/api/postback";

async function handlePostback(request: Request) {
  const url = new URL(request.url);
  let clickId = url.searchParams.get("click_id") ?? "";
  let value = parseFloat(url.searchParams.get("value") ?? "0");

  if (request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    clickId = String(body.clickId ?? clickId);
    value = parseFloat(String(body.value ?? value));
  }

  const result = await recordPostback(clickId, Number.isFinite(value) ? value : 0);
  return NextResponse.json(result);
}

export async function GET(request: Request) {
  try {
    return await handlePostback(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Postback failed" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return await handlePostback(request);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Postback failed" },
      { status: 400 }
    );
  }
}
