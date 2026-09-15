export type Comparison = {
  slug: "pandadoc" | "qwilr" | "proposify";
  competitor: string;
  competitorSite: string;
  competitorSiteLabel: string;
  title: string;
  description: string;
  indexBlurb: string;
  theyAre: string;
  chooseThemIf: string[];
  chooseUsIf: string[];
};

export const COMPARISONS: Comparison[] = [
  {
    slug: "pandadoc",
    competitor: "PandaDoc",
    competitorSite: "https://www.pandadoc.com",
    competitorSiteLabel: "pandadoc.com",
    title: "ProposalFast vs PandaDoc",
    description:
      "An honest comparison of ProposalFast and PandaDoc for agencies and consultants who send proposals, collect signatures, and take payment.",
    indexBlurb:
      "PandaDoc is a mature document platform. ProposalFast is a focused AI proposal workspace with a single client path.",
    theyAre:
      "PandaDoc is an established document workflow product. Teams use it for proposals, quotes, contracts, e-sign, and a wider set of document processes than a single proposal portal. Feature lists, integrations, and pricing change — check their site for what they offer today.",
    chooseThemIf: [
      "You need a broad document OS (contracts, quotes, and proposals in one mature suite).",
      "You already run PandaDoc and need its depth, templates, or existing integrations.",
      "You want a long-established vendor with a large catalog of workflows.",
    ],
    chooseUsIf: [
      "You want fact-bound AI drafts that leave fees and timelines as placeholders until you set them.",
      "You want one client path: draft → branded portal with Q&A → e-sign → Stripe.",
      "You are an agency or consultant who would rather start free and take Founding Pro while it lasts.",
    ],
  },
  {
    slug: "qwilr",
    competitor: "Qwilr",
    competitorSite: "https://www.qwilr.com",
    competitorSiteLabel: "qwilr.com",
    title: "ProposalFast vs Qwilr",
    description:
      "An honest comparison of ProposalFast and Qwilr for agencies and consultants who want web proposals, client questions, e-sign, and payment in one path.",
    indexBlurb:
      "Qwilr is known for interactive, design-forward web proposals. ProposalFast is earlier and narrower: facts first, then portal, sign, and pay.",
    theyAre:
      "Qwilr is a more established product for interactive web-based sales documents. It is often chosen for visual presentation and a broader sales-document toolkit. We do not inventory their current features or prices here — see their site for that.",
    chooseThemIf: [
      "You want a mature interactive-page experience and a longer track record in web proposals.",
      "Design-forward sales pages matter more than a fact-bound AI draft with fee placeholders.",
      "You already rely on Qwilr and need its existing workflow.",
    ],
    chooseUsIf: [
      "You want AI that drafts from your facts and refuses to invent numbers.",
      "You want client questions, e-sign, and Stripe on the same portal — not a second tool after the PDF.",
      "You want to start free, with Founding Pro priced for early teams while the offer is open.",
    ],
  },
  {
    slug: "proposify",
    competitor: "Proposify",
    competitorSite: "https://www.proposify.com",
    competitorSiteLabel: "proposify.com",
    title: "ProposalFast vs Proposify",
    description:
      "An honest comparison of ProposalFast and Proposify for agencies and consultants closing work with proposals, e-sign, and payment.",
    indexBlurb:
      "Proposify is established proposal software for sales teams. ProposalFast is an early, fact-bound workspace built around one client path.",
    theyAre:
      "Proposify is mature proposal software, typically used by sales teams that want a content library and a full proposal workflow. It has been in market longer and covers more of that category. Confirm current capabilities and pricing on their site.",
    chooseThemIf: [
      "You need a long-standing proposal platform with a deeper content-library workflow.",
      "Your team already lives in Proposify and needs that existing process.",
      "Breadth and maturity matter more than a focused AI-plus-portal path.",
    ],
    chooseUsIf: [
      "You want drafts bound to the brief, with fees as placeholders until you confirm them.",
      "You want the client to ask questions, sign, and pay in one branded portal.",
      "You are an independent or small agency starting free, with Founding Pro available while the early-team offer lasts.",
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((item) => item.slug === slug);
}

export const COMPARE_INDEX = {
  title: "Compare ProposalFast",
  description:
    "Honest, high-level comparisons of ProposalFast with PandaDoc, Qwilr, and Proposify. We are early and focused — they are more mature, with broader feature sets.",
};
