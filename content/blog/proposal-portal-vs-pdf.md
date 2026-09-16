---
title: Proposal portal vs PDF
description: A PDF is a snapshot. A client portal can hold the questions, the signature, and Stripe payment without bouncing through three tools.
date: 2026-09-15
---

A PDF is a good snapshot. It is a weak place to finish a deal.

You can attach one to an email in ten seconds. The client can open it without an account. Those are real strengths. The weaknesses show up as soon as they have a question, need to sign, or need to pay: the file cannot hold those steps, so you invent a stack around it.

A **proposal portal** is a page for that proposal. The document is still the document. The difference is that Q&A, e-sign, and payment can live on the same URL instead of in three products you glue together.

## What a PDF is good at

- Archiving a version you sent.
- Printing, forwarding, and attaching to a purchase order.
- A familiar format for clients who want a file.

ProposalFast still renders PDFs. We did not pick a portal because PDFs are obsolete. We picked a portal because “here is a file” is not the same as “here is how we close.”

## Where the snapshot breaks

**Questions.** Comments in email are not comments on the proposal. They drift. They attach to the wrong version. A portal can take a question on the page the client is reading. In our case the client does not need an account; the team sees the comment on that version.

**Signature.** A separate e-sign request is another tab and another login story. If they have already read the scope, signing on the same page is the smaller ask. We store consent text, signer name and email, an IP hash, and a signature artifact. That is e-sign, not a screenshot of a pen.

**Payment.** “We’ll invoice you” is a fourth step after a signed PDF. Stripe Checkout on the proposal is the fee they already saw, paid in the same session if they are ready. Webhooks mark the payment. We do not invent a checkout URL in marketing, and we do not mark a workspace paid because someone clicked a button in the UI.

**Seeing whether they opened it.** A PDF attachment is mostly a black box. A portal can store view events (open, duration, referrer) against that proposal. That is not mind-reading. It is a record that the link was used.

## One client path, not a document OS

The path [ProposalFast](/) is built for:

**Draft from your facts → send a branded portal → track views → questions on the page → e-sign → Stripe.**

That is narrower than PandaDoc, Qwilr, or Proposify. They have been in market longer, with broader toolkits. If you need a mature document platform, that is a fair reason to use them. We wrote [honest comparisons](/compare) instead of a fake scorecard.

We also will not claim a portal always converts better. We have not run that study. The argument is operational: fewer hops after send, and a draft that is [not allowed to invent the fee](/blog/fact-bound-proposals-vs-invented-numbers).

## When you should still send a PDF

Send a file when the buyer’s process requires one — procurement, a board pack, an attachment in their own system. Export it from the same proposal you already sent as a portal so the numbers match. Do not maintain a parallel Doc that diverges.

If the stall you are fighting is “they went quiet after I emailed the PDF,” the portal is the more honest experiment. The questions and the signature are at least in one place. We wrote about that stall in [why proposals stall after you send them](/blog/why-proposals-stall-after-send).

## Try it without a speech

[Create a workspace](/register) on the free plan. Send a proposal as a public link (`/p/…`). The client can read it without signing up. If you need paid seats, [pricing](/pricing) is the source of truth — including Founding Pro while that offer is still open. We will not put a Stripe payment link in this post.
