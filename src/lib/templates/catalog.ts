export type TemplateSection = {
  type: string;
  title: string;
  body: string;
};

export type SystemTemplate = {
  name: string;
  description: string;
  category: string;
  industry: string;
  sections: TemplateSection[];
};

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  {
    name: "Consulting engagement",
    description: "Discovery, recommendations, and a scoped implementation for independent consultants.",
    category: "consulting",
    industry: "Professional services",
    sections: [
      { type: "cover", title: "Proposal", body: "Prepared for [PLACEHOLDER: client name] by [PLACEHOLDER: your firm]." },
      { type: "introduction", title: "Understanding", body: "This proposal responds to the goals you shared. Facts we will not invent live as placeholders until you fill them." },
      { type: "scope", title: "Scope", body: "[PLACEHOLDER: in-scope work]\n\nOut of scope\n[PLACEHOLDER: out-of-scope items]" },
      { type: "approach", title: "Approach", body: "[PLACEHOLDER: phases and methods you actually use]" },
      { type: "timeline", title: "Timeline", body: "[PLACEHOLDER: start date, milestones, and duration]" },
      { type: "pricing", title: "Investment", body: "[PLACEHOLDER: fees, payment schedule, and what is included]" },
      { type: "terms", title: "Terms", body: "[PLACEHOLDER: your contract terms. Do not generate legal language you have not approved.]" },
      { type: "next_steps", title: "Next steps", body: "Review this proposal, ask questions, then sign and pay to begin." },
    ],
  },
  {
    name: "Brand and website",
    description: "For studios pitching identity, site, and launch support.",
    category: "agency",
    industry: "Design",
    sections: [
      { type: "cover", title: "Project proposal", body: "A website and brand engagement for [PLACEHOLDER: client name]." },
      { type: "introduction", title: "The brief", body: "[PLACEHOLDER: what the client asked for, in their words]" },
      { type: "scope", title: "Deliverables", body: "[PLACEHOLDER: pages, brand artifacts, and handoff items]" },
      { type: "timeline", title: "Schedule", body: "[PLACEHOLDER: kickoff, review rounds, launch]" },
      { type: "pricing", title: "Investment", body: "[PLACEHOLDER: package price or hourly cap]" },
      { type: "next_steps", title: "How we start", body: "Approve the scope, sign, and we schedule kickoff." },
    ],
  },
  {
    name: "Retainer",
    description: "Monthly advisory or fractional leadership with a clear cadence.",
    category: "retainer",
    industry: "Professional services",
    sections: [
      { type: "cover", title: "Retainer proposal", body: "Ongoing support for [PLACEHOLDER: client name]." },
      { type: "scope", title: "What is included", body: "[PLACEHOLDER: hours, channels, and response times]" },
      { type: "approach", title: "Cadence", body: "[PLACEHOLDER: meeting rhythm and reporting]" },
      { type: "pricing", title: "Monthly investment", body: "[PLACEHOLDER: monthly fee and how overage is billed]" },
      { type: "terms", title: "Term", body: "[PLACEHOLDER: start month, notice period, renewal]" },
      { type: "next_steps", title: "Next steps", body: "Sign to reserve the retainer start date." },
    ],
  },
  {
    name: "Software build",
    description: "Fixed-scope product work for development shops.",
    category: "software",
    industry: "Software",
    sections: [
      { type: "cover", title: "Build proposal", body: "Product work for [PLACEHOLDER: client name]." },
      { type: "scope", title: "Product scope", body: "[PLACEHOLDER: features in this release]\n\nNot in this release\n[PLACEHOLDER: deferred items]" },
      { type: "approach", title: "How we will build", body: "[PLACEHOLDER: stack, environments, and review process — only if the client already agreed]" },
      { type: "timeline", title: "Milestones", body: "[PLACEHOLDER: milestone dates and acceptance criteria]" },
      { type: "pricing", title: "Investment", body: "[PLACEHOLDER: fixed fee or T&M rates]" },
      { type: "terms", title: "Assumptions", body: "[PLACEHOLDER: access, content, and decision-maker availability]" },
      { type: "next_steps", title: "Next steps", body: "Sign to lock the kickoff week." },
    ],
  },
  {
    name: "Workshop or training",
    description: "A one-off session with outcomes, agenda, and logistics.",
    category: "training",
    industry: "Education",
    sections: [
      { type: "cover", title: "Workshop proposal", body: "A facilitated session for [PLACEHOLDER: client name]." },
      { type: "introduction", title: "Outcomes", body: "[PLACEHOLDER: what participants should leave able to do]" },
      { type: "approach", title: "Agenda", body: "[PLACEHOLDER: timed agenda]" },
      { type: "scope", title: "Logistics", body: "[PLACEHOLDER: date, location or link, audience size]" },
      { type: "pricing", title: "Investment", body: "[PLACEHOLDER: facilitation fee and expenses]" },
      { type: "next_steps", title: "Next steps", body: "Confirm the date and sign to hold it." },
    ],
  },
  {
    name: "Audit and recommendations",
    description: "A time-boxed review that ends in a written brief — not an invented score.",
    category: "audit",
    industry: "Professional services",
    sections: [
      { type: "cover", title: "Audit proposal", body: "A structured review for [PLACEHOLDER: client name]." },
      { type: "scope", title: "What we will review", body: "[PLACEHOLDER: systems, pages, or processes in scope]" },
      { type: "approach", title: "Method", body: "[PLACEHOLDER: interviews, data access, and review time]" },
      { type: "timeline", title: "Timeline", body: "[PLACEHOLDER: start and delivery dates]" },
      { type: "pricing", title: "Investment", body: "[PLACEHOLDER: audit fee]" },
      { type: "next_steps", title: "Next steps", body: "Share access, sign, and we begin." },
    ],
  },
];
