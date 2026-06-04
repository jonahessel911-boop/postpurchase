"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdEditorWorkspace } from "@/components/campaigns/ad-editor-workspace";
import {
  CampaignCreateWizard,
  type WizardSavePayload,
} from "@/components/campaigns/campaign-create-wizard";
import { launchCampaign, saveCampaign } from "@/lib/api/campaign-actions";
import type { CampaignWithMetrics } from "@/lib/campaign-types";

function CampaignEditorInner({
  campaign,
  isNew,
}: {
  campaign?: CampaignWithMetrics;
  isNew?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const initialAdId = searchParams.get("ad") ?? undefined;
  const initialNewAd = searchParams.get("newAd") === "1";
  const draftIdRef = useRef<string | undefined>(campaign?.id);

  if (isNew) {
    return (
      <>
        {saveError ? (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-[13px] text-red-700 sm:px-6">
            {saveError}
          </div>
        ) : null}
        <CampaignCreateWizard
          onPersist={async (data: WizardSavePayload) => {
            const { campaignId } = await saveCampaign(data, draftIdRef.current);
            draftIdRef.current = campaignId;
            return campaignId;
          }}
          onFinalize={async (id) => {
            setSaveError("");
            await launchCampaign(id);
            router.refresh();
            router.push(`/campaigns/${id}`);
          }}
        />
      </>
    );
  }

  return (
    <>
      {saveError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-[13px] text-red-700 sm:px-6">
          {saveError}
        </div>
      ) : null}
      <AdEditorWorkspace
        campaign={campaign}
        isNew={isNew}
        initialAdId={initialAdId}
        initialNewAd={initialNewAd}
        saving={saving}
        onSave={async (data, options) => {
          setSaving(true);
          setSaveError("");
          try {
            const { campaignId, adIds } = await saveCampaign(
              data,
              campaign?.id
            );
            router.refresh();
            if (options.mode === "publish") {
              router.push(`/campaigns/${campaignId}`);
              return;
            }
            if (options.mode === "draft") {
              const persistedId =
                adIds[options.selectedAdId] ?? options.selectedAdId;
              router.push(
                `/campaigns/${campaignId}/edit?ad=${persistedId}`
              );
              return;
            }
            router.push(`/campaigns/${campaignId}`);
          } catch (err) {
            setSaveError(
              err instanceof Error ? err.message : "Failed to save campaign"
            );
          } finally {
            setSaving(false);
          }
        }}
      />
    </>
  );
}

export function CampaignEditorClient({
  campaign,
  isNew,
}: {
  campaign?: CampaignWithMetrics;
  isNew?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <CampaignEditorInner campaign={campaign} isNew={isNew} />
    </Suspense>
  );
}
