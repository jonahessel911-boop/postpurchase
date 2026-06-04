import type { WidgetOffer } from "@/lib/publisher-types";

/** Sample offers for publisher install preview (not live traffic). */
export const WIDGET_DEMO_OFFERS: WidgetOffer[] = [
  {
    campaign_id: "demo-solar",
    ad_id: "demo-solar-ad",
    title: "Solar",
    subheadline: "Bespaar direct op je energierekening met zonnepanelen",
    media_url:
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&q=80",
    media_type: "image",
    cta_text: "Bekijk aanbod",
    product_label: "Zonnepanelen",
  },
  {
    campaign_id: "demo-energie",
    ad_id: "demo-energie-ad",
    title: "Energiecontract",
    subheadline: "Vergelijk de scherpste energietarieven voor jouw situatie",
    media_url:
      "https://images.unsplash.com/photo-1473341303090-613bca8f2580?w=400&q=80",
    media_type: "image",
    cta_text: "Bekijk aanbod",
    product_label: "Energiecontract",
  },
  {
    campaign_id: "demo-laadpaal",
    ad_id: "demo-laadpaal-ad",
    title: "Laadpaal",
    subheadline: "Laad je auto voordelig thuis met een slimme laadpaal",
    media_url:
      "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400&q=80",
    media_type: "image",
    cta_text: "Bekijk aanbod",
    product_label: "Laadpaal",
  },
];
