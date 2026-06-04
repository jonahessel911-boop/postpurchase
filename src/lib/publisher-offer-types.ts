import type { ClickPlacement } from "@/lib/types";

export interface OfferTypeOption {
  id: ClickPlacement;
  title: string;
  description: string;
}

export const OFFER_TYPES: OfferTypeOption[] = [
  {
    id: "redirect",
    title: "Full redirect page",
    description:
      "Send the user to this page after filling out the form. They land on a dedicated offers page.",
  },
  {
    id: "popup",
    title: "Popup",
    description:
      "Popup after filling in the form, then showing relevant offers.",
  },
  {
    id: "native",
    title: "Native",
    description:
      "Show a card below your current thank-you message with relevant offers.",
  },
];

export function offerTypeLabel(placement: ClickPlacement): string {
  return OFFER_TYPES.find((t) => t.id === placement)?.title ?? placement;
}
