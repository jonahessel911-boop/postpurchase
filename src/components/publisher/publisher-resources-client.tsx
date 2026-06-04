"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, BookOpen } from "lucide-react";
import { CopyButton, PageHeader } from "@/components/ui";
import { getInstallGuides } from "@/lib/publisher-install-guides";
import { TRAFFIC_PARTNER_ID_LABEL } from "@/lib/publisher-integration";
import { getResourcesExampleOrigin } from "@/lib/widget-url";
import type { ClickPlacement } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PublisherResourcesClient({
  partnerId,
}: {
  partnerId: string;
}) {
  const [openId, setOpenId] = useState<ClickPlacement | "">("");
  const platformOrigin = getResourcesExampleOrigin();
  const guides = useMemo(() => getInstallGuides(partnerId), [partnerId]);

  function toggle(id: ClickPlacement) {
    setOpenId((current) => (current === id ? "" : id));
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Resources"
        action={
          <Link
            href="/publisher/manager"
            className="inline-flex h-9 items-center rounded-lg bg-accent px-3 text-[13px] font-medium text-white hover:bg-accent/90"
          >
            Integration
          </Link>
        }
      />

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-[13px] font-semibold">Before you install</h2>
        <dl className="mt-3 space-y-3 text-[13px] leading-relaxed">
          <div>
            <dt className="font-medium text-foreground">Platform domain</dt>
            <dd className="mt-0.5 text-muted">
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px]">
                {platformOrigin}
              </code>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">
              {TRAFFIC_PARTNER_ID_LABEL}
            </dt>
            <dd className="mt-0.5 text-muted">
              One id for your whole account (created at signup). All three
              formats use the same id — you do not create separate offers.
            </dd>
            <dd className="mt-2">
              <code className="break-all rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[11px] text-accent">
                {partnerId}
              </code>
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-3">
        {guides.map((guide) => {
          const isOpen = openId === guide.id;
          return (
            <div
              key={guide.id}
              className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <button
                type="button"
                onClick={() => toggle(guide.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">
                    {guide.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {guide.summary}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-zinc-400 transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen ? (
                <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
                  <p className="text-[13px] leading-relaxed text-zinc-600">
                    <span className="font-medium text-foreground">
                      When to use:{" "}
                    </span>
                    {guide.whenToUse}
                  </p>
                  <ol className="mt-5 space-y-4">
                    {guide.steps.map((step, i) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[12px] font-semibold text-accent">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[13px] font-semibold">{step.title}</p>
                          <p className="mt-1 text-[13px] text-muted">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <ul className="mt-5 space-y-2 rounded-lg bg-zinc-50 px-4 py-3">
                    {guide.tips.map((tip) => (
                      <li
                        key={tip}
                        className="text-[12px] leading-relaxed text-zinc-600 before:mr-2 before:content-['•']"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                        Example code
                      </p>
                      <CopyButton text={guide.exampleCode} />
                    </div>
                    <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-[11px] text-zinc-100">
                      {guide.exampleCode}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
