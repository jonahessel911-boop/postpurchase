import { buildPartnerEmbedSnippetForDocs } from "@/lib/publisher-integration";
import { OFFER_TYPES } from "@/lib/publisher-offer-types";
import type { ClickPlacement } from "@/lib/types";
import { getResourcesExampleOrigin } from "@/lib/widget-url";

export interface InstallGuideStep {
  title: string;
  body: string;
}

export interface InstallGuide {
  id: ClickPlacement;
  title: string;
  summary: string;
  whenToUse: string;
  steps: InstallGuideStep[];
  tips: string[];
  exampleCode: string;
}

export function getInstallGuides(partnerId: string): InstallGuide[] {
  const origin = getResourcesExampleOrigin();
  const meta = Object.fromEntries(
    OFFER_TYPES.map((t) => [t.id, t])
  ) as Record<ClickPlacement, (typeof OFFER_TYPES)[number]>;

  return [
    {
      id: "redirect",
      title: meta.redirect.title,
      summary: meta.redirect.description,
      whenToUse:
        "Use when your form redirects the browser after submit. One URL for your whole traffic partner account.",
      steps: [
        {
          title: "Copy redirect URL from Integration",
          body: `Open Integration → Full redirect page. Your URL looks like ${origin}/p/{your-traffic-partner-id}.`,
        },
        {
          title: "Paste in form settings",
          body: 'Set your form post-submit action to redirect to that URL.',
        },
        {
          title: "Test",
          body: "After submit you should see offers, then clicks go to advertisers.",
        },
      ],
      tips: [
        `Traffic partner ID: ${partnerId}`,
        `Domain: ${origin}`,
        "No separate offers to create — one id per partner account.",
      ],
      exampleCode: buildPartnerEmbedSnippetForDocs(partnerId, "redirect"),
    },
    {
      id: "popup",
      title: meta.popup.title,
      summary: meta.popup.description,
      whenToUse: "Use when the user stays on the page and you show a popup on submit.",
      steps: [
        {
          title: "Set submit button id on Integration",
          body: 'Save the id of your submit button (e.g. checkout-submit), then copy the popup script.',
        },
        {
          title: "Paste before </body>",
          body: "On the page with your form.",
        },
        {
          title: "Match button id in HTML",
          body: "The button id must match what you saved on Integration.",
        },
      ],
      tips: [
        `Traffic partner ID in script: ${partnerId}`,
        `Script host: ${origin}/embed/postpurchase.js`,
      ],
      exampleCode: buildPartnerEmbedSnippetForDocs(partnerId, "popup", {
        submitElementId: "submit-button",
      }),
    },
    {
      id: "native",
      title: meta.native.title,
      summary: meta.native.description,
      whenToUse: "Embed offer cards under your thank-you message with an iframe.",
      steps: [
        {
          title: "Copy iframe from Integration",
          body: "Integration → Native → copy iframe code.",
        },
        {
          title: "Paste on thank-you page",
          body: "Below your own confirmation text.",
        },
        {
          title: "Done",
          body: "Offers load for your traffic partner id; site context matching comes later.",
        },
      ],
      tips: [
        `iframe src: ${origin}/widget/${partnerId}?embed=1`,
        "Only offer cards are shown in the iframe.",
      ],
      exampleCode: buildPartnerEmbedSnippetForDocs(partnerId, "native"),
    },
  ];
}
