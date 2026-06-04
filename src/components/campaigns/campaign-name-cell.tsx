import Link from "next/link";
import { campaignDisplayId, formatRelativeUpdated } from "@/lib/campaign-table-utils";
import type { CampaignWithMetrics } from "@/lib/campaign-types";
import { verticalLabel } from "@/lib/campaign-types";

export function CampaignNameCell({
  campaign,
  href,
}: {
  campaign: CampaignWithMetrics;
  href?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden py-0.5">
      <div className="truncate">
        {href ? (
          <Link
            href={href}
            className="text-[15px] font-semibold text-foreground hover:text-accent"
          >
            {campaign.name}
          </Link>
        ) : (
          <span className="text-[15px] font-semibold text-foreground">
            {campaign.name}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[12px] text-zinc-400">
        {campaignDisplayId(campaign.id)}
        <span className="mx-1 text-zinc-300">·</span>
        {verticalLabel(campaign.vertical)}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-zinc-400">
        Updated {formatRelativeUpdated(campaign.updated_at)}
      </p>
    </div>
  );
}
