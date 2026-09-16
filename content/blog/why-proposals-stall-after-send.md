---
title: Why proposals stall after you send them
description: The writing is often done. The stall is what happens next — questions in email, a second signature tool, and a separate chase for payment.
date: 2026-09-10
---

Most agencies do not lose the room while drafting. They lose it after “sent.”

A PDF leaves the inbox. The client skims it on a phone. A question sits in a thread nobody owns. Signature waits on a different product. Payment is an invoice you send later, if you remember. None of that is a copy problem. It is a path problem.

[ProposalFast](/) is an AI proposal workspace for agencies and consultants. This note is about the stall after send — questions, signatures, and payment — and what we actually built. No close-rate claims. No invented case studies.

## The send is not the close

“Sent” feels like progress because it is the end of *your* document. For the client it is the start of three chores they did not ask for:

1. Figure out who to ask about the scope they do not understand.
2. Figure out where to sign, if signing is even in the same place as the proposal.
3. Figure out how to pay, which is often a fourth email.

If any of those chores is annoying, the proposal sits. Your follow-up then sounds like nagging, even when you are only trying to unblock a real question.

## Questions vanish into email

The common pattern: the client replies to the send thread with “quick question.” That reply may go to the person who is out Friday. It may go to a personal Gmail. It may start a parallel conversation that never makes it back into the document the decision-maker opens.

Then you have two artifacts — the PDF and the thread — and neither is the source of truth. Version chaos follows. Someone signs an older attachment. Someone asks a question you already answered in a later draft.

A better default is boring: **questions live on the proposal the client is looking at.** In ProposalFast that is a comment on the public client portal. The client does not need an account. The team sees the note on that version of the proposal. It is not a full ticketing system, and we do not pretend it is. It is a place for the question so it does not disappear.

## Signatures become a second project

PDF in one tab, DocuSign or a wet-ink scan in another, is a familiar split. It is also a stall. People postpone anything that feels like a new tool.

If the client has already read the scope, the next action should be on the same page: name, email, consent, signature. ProposalFast stores signer identity, consent text, an IP hash, and a signature artifact. That is the e-sign we ship. It is not a replacement for a mature contract suite. If you need a document OS for every agreement you send, a broader product is the honest fit — see [how we compare](/compare).

## Payment is the third chase

Even a signed PDF is often not money. Someone still has to raise an invoice, pick a processor, and remind the client. Each hop is another chance to wait until next week.

ProposalFast can take the fee on the proposal through Stripe Checkout. A webhook writes the payment — the UI does not mark it paid because a button was clicked. If there is no fee on the proposal yet, there is nothing to charge. We do not invent a number to make Checkout look busy.

## What “one path” means here

The path we care about is narrow on purpose:

**Draft → branded portal → track views → questions on the page → e-sign → Stripe.**

You still write and edit. Versions stay on the proposal so you can see what the client saw. Opens are stored as view events. Follow-ups can be scheduled. None of that removes the need to do good work or to price it honestly.

What it removes is the improvisation after send: forwarding a PDF, pasting a sign link, then remembering to invoice.

## What we will not claim

We will not tell you this raises win rate by a round number. We do not have a customer logo wall. ProposalFast is early. The stall after send is real whether you use us or a folder of Docs.

If you want to try the path, [create a free workspace](/register). Plans, including any founding price still on the table, are on [pricing](/pricing) — we do not put a checkout URL in a blog post.

Related: [fact-bound drafts vs invented numbers](/blog/fact-bound-proposals-vs-invented-numbers) and [proposal portal vs PDF](/blog/proposal-portal-vs-pdf).
