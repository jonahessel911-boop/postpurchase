"use client";

import { useRef, useState } from "react";
import { Button, Input, Toggle } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MediaPreview, detectMediaType, acceptForMediaType } from "./media-preview";
import { MEDIA_TYPES, MEDIA_FORMAT_SPECS, type AdDraft } from "@/lib/types";
import { createEmptyAd, duplicateAdDraft, trafficSharePercent } from "@/lib/ads";
import { cn, formatNumber } from "@/lib/utils";
import { Copy, Plus, Trash2, Upload } from "lucide-react";

interface AdsEditorPanelProps {
  ads: AdDraft[];
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (ads: AdDraft[]) => void;
}

export function AdsEditorPanel({
  ads,
  selectedId,
  onSelect,
  onChange,
}: AdsEditorPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdDraft | null>(null);
  const selected = ads.find((a) => a.id === selectedId) ?? ads[0];
  const share = trafficSharePercent(ads);
  const formatSpec = MEDIA_FORMAT_SPECS[selected?.media_type ?? "image"];

  if (!selected) return null;

  function updateAd(id: string, patch: Partial<AdDraft>) {
    onChange(ads.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  function addAd() {
    const newAd = createEmptyAd(ads.length);
    onChange([...ads, newAd]);
    onSelect(newAd.id);
  }

  function duplicateSelected() {
    const copy = duplicateAdDraft(selected);
    onChange([...ads, copy]);
    onSelect(copy.id);
  }

  function confirmRemoveAd() {
    if (!deleteTarget || ads.length <= 1) return;
    const next = ads.filter((a) => a.id !== deleteTarget.id);
    onChange(next);
    if (selectedId === deleteTarget.id) onSelect(next[0].id);
    setDeleteTarget(null);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateAd(selected.id, {
      media_url: URL.createObjectURL(file),
      media_type: detectMediaType(file),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ads.map((ad) => (
            <div key={ad.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => onSelect(ad.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  ad.id === selectedId
                    ? "border-accent bg-accent-light text-accent"
                    : "border-border text-muted hover:text-accent",
                  !ad.active && "opacity-60",
                  ads.length > 1 && "pr-7"
                )}
              >
                {ad.name}
              </button>
              {ads.length > 1 && ad.id === selectedId && (
                <button
                  type="button"
                  title="Remove ad"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(ad);
                  }}
                  className="absolute right-1.5 rounded p-0.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={addAd} className="!py-1.5 !px-3 !text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add ad
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={duplicateSelected}
            className="!py-1.5 !px-3 !text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent-light/40 px-3.5 py-2.5 text-[12px] text-foreground">
        <strong>{ads.filter((a) => a.active).length}</strong> active ad
        {ads.filter((a) => a.active).length !== 1 ? "s" : ""} →{" "}
        <strong>{formatNumber(share, 1)}%</strong> traffic each when campaign is live
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border px-3.5 py-3">
        <div>
          <p className="text-[13px] font-medium">{selected.name}</p>
          <p className="text-[11px] text-muted">Toggle to include in traffic rotation</p>
        </div>
        <div className="flex items-center gap-3">
          {ads.length > 1 && (
            <button
              type="button"
              onClick={() => setDeleteTarget(selected)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
          <Toggle
            checked={selected.active}
            onChange={(v) => updateAd(selected.id, { active: v })}
          />
        </div>
      </div>

      <Input
        label="Ad name"
        value={selected.name}
        onChange={(e) => updateAd(selected.id, { name: e.target.value })}
      />

      <Input
        label="Title"
        value={selected.title}
        onChange={(e) => updateAd(selected.id, { title: e.target.value })}
        placeholder="Get Solar & Save Up to 70%"
      />

      <div className="space-y-1.5">
        <label className="block text-[13px] font-medium">Subheadline</label>
        <textarea
          value={selected.subheadline}
          onChange={(e) => updateAd(selected.id, { subheadline: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-[13px] font-medium">Media</label>
        <div className="inline-flex rounded-xl border border-border bg-background p-1">
          {MEDIA_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                updateAd(selected.id, { media_type: value });
                if (fileRef.current) fileRef.current.value = "";
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                selected.media_type === value
                  ? "bg-accent text-white shadow-sm"
                  : "text-muted hover:text-accent"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-background px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Expected format · {selected.media_type}
          </p>
          <ul className="mt-2 space-y-1 text-[12px] text-muted">
            <li>
              <span className="text-foreground">Formats:</span> {formatSpec.formats}
            </li>
            <li>
              <span className="text-foreground">Dimensions:</span> {formatSpec.size}
            </li>
            {formatSpec.notes && <li>{formatSpec.notes}</li>}
          </ul>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept={acceptForMediaType(selected.media_type)}
          onChange={handleUpload}
          className="hidden"
        />
        <div className="flex items-center gap-4 rounded-xl border border-border p-3">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
            {selected.media_url ? (
              <MediaPreview
                url={selected.media_url}
                mediaType={selected.media_type}
                alt="Preview"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted">
                No media
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-[13px] font-medium hover:border-accent/30"
          >
            <Upload className="h-4 w-4" />
            Upload media
          </button>
        </div>
      </div>

      <Input
        label="CTA button text"
        value={selected.cta_text}
        onChange={(e) => updateAd(selected.id, { cta_text: e.target.value })}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Sure to remove this ad?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be permanently removed from this campaign. This can't be undone.`
            : undefined
        }
        confirmLabel="Remove ad"
        cancelLabel="Keep ad"
        destructive
        onConfirm={confirmRemoveAd}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
