export const site = {
  name: "MOLD",
  tagline: "Premium streetwear built in Chennai.",
  city: "Chennai, Tamil Nadu",
  instagram: "https://www.instagram.com/_mold._",
  whatsapp: "https://chat.whatsapp.com/ERHpn9x9MMz5N6IaYbMFwB?s=sw&p=i&mlu=4&ilr=4",
  freeShippingThreshold: 1999,
  shippingFee: 99,
  announcements: [
    "Free shipping over ₹1,999",
    "Made in Chennai",
    "Limited runs",
    "Drop 07 — Live now",
    "Heavy silhouettes",
  ],
};

export const helpTopics = {
  contact: {
    title: "Contact",
    body: [
      "Write to us at moldyourstyle@gmail.com or message the studio on WhatsApp. We reply within one working day, Monday to Saturday.",
      "Studio: Puzhal, Chennai, Tamil Nadu, India.",
    ],
  },
  shipping: {
    title: "Shipping",
    body: [
      "Free shipping across India on orders over ₹1,999. Below that, a flat ₹99 applies.",
      "Orders are dispatched within 48 hours. Metro delivery takes 2–4 days, rest of India 4–7 days.",
    ],
  },
  returns: {
    title: "Returns",
    body: [
      "Returns Not accepted ",
      "Raise a return from Track Order or message us on WhatsApp with your order number.",
    ],
  },
  "size-guide": {
    title: "Size Guide",
    body: [
      "MOLD is cut oversized. Take your usual size for a boxy fit and size down for a regular fit.",
      "Chest (inches) — S 42, M 44, L 46, XL 48, XXL 50. Waist sizes on pants are true to measurement.",
    ],
  },
  "track-order": {
    title: "Track Order",
    body: [
      "A tracking link is sent by SMS and email the moment your parcel leaves the studio.",
      "Lost the link? Send your order number to us on WhatsApp and we'll resend it.",
    ],
  },
  faq: {
    title: "FAQ",
    body: [
      "Do you restock? Drops are limited. Sold out pieces occasionally return in a new wash.",
      "Do you ship internationally? Not yet — India only for now.",
      "How heavy is heavy? Tees are 400gsm, outerwear 340–380gsm.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what is needed to fulfil your order: name, address, phone, email.",
      "We never sell your data. Marketing emails are opt-in and one click to leave.",
    ],
  },
  terms: {
    title: "Terms & Conditions",
    body: [
      "All prices are in INR and inclusive of GST. Orders are subject to availability.",
      "MOLD artwork, photography and wordmark remain the property of the label.",
    ],
  },
  refunds: {
    title: "Refund Policy",
    body: [
      "Approved refunds are issued to the original payment method within 5–7 working days.",
      "Cash on delivery orders are refunded by UPI transfer.",
    ],
  },
} as const;

export type HelpTopic = keyof typeof helpTopics;
