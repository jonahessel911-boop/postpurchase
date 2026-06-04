import { buildPostpurchaseEmbedScript } from "@/lib/embed/widget-script";
import { getPublisherPlatformOrigin } from "@/lib/widget-url";

export async function GET() {
  const script = buildPostpurchaseEmbedScript(getPublisherPlatformOrigin());

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
