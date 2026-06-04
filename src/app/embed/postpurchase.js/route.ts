import { buildPostpurchaseEmbedScript } from "@/lib/embed/widget-script";
import { getAppOrigin } from "@/lib/widget-url";

export async function GET() {
  const script = buildPostpurchaseEmbedScript(getAppOrigin());

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
