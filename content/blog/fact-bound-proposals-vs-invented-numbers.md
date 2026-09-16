---
title: Fact-bound proposals vs invented numbers
description: AI that fills in missing fees, timelines, or case studies is a liability. How to keep a proposal draft bound to the brief you actually have.
date: 2026-09-12
---

A proposal with a confident fee you never typed is not a draft. It is a guess with letterhead.

Agencies already know this in the analog world. You do not paste last quarter’s PDF and hope the number is still right. The same rule applies when a model writes the first pass. If the brief has a gap, the honest output is a visible hole — not a plausible dollar amount.

[ProposalFast](/) is built around that constraint. This is not a vibe. The pipeline is not allowed to invent facts, and quality control is supposed to flag the ones that sneak through.

## What “fact-bound” means

Fact-bound, as we use it:

- You paste the brief, the fee, the dates, and the proof you already have.
- The model drafts from that material.
- Missing fees and timelines stay marked as placeholders until a human sets them.
- Invented prices, statistics, and case studies are treated as defects, not creativity.

That is slower than “write me a proposal” with no inputs. It is also the only version we are willing to put in front of a client.

A model is a writer with rules, not a researcher. It does not know your rate card. It does not know whether Harbor Civic still exists. If you did not provide a result, we should not print one.

## Why invented numbers show up

They show up because the prompt looks like a blank. “Include pricing” without a number is an invitation to complete the pattern. “Similar to our work with [well-known brand]” without a sentence of proof is an invitation to fan fiction.

The failure is rarely theatrical. It is a round number that looks like a package. It is a timeline that sounds like four weeks because four weeks is a common phrase. It is a case study with a metric nobody measured.

Clients may not catch it on the first skim. You will catch it when they ask you to stand behind it — or when finance asks where the fee came from.

## Placeholders are a feature

In ProposalFast, gaps stay visible as `[PLACEHOLDER]`. That is deliberate. A placeholder is cheaper than a hallucination.

The job of the first draft is to get structure and language in place so you can edit. The job is not to look finished while the commercial terms are still fiction. If a section needs a number you have not decided, leave the hole, fill it, then send.

We also keep versions. If you generate again or make a major edit, you can see what went to the client. That matters when a later pass quietly changes a fee.

## What the pipeline actually does

The generation path is extract → outline → generate → QC → score. Extraction is supposed to take only what you provided. QC is supposed to reject invented prices, stats, or case studies. If OpenAI keys are missing, generation fails with a real error. It does not return canned sample copy and call it a draft.

That is the product promise on [features](/features). It is not a claim that the model never errs. You still read the draft. You still own the number that goes out.

## What we will not do for marketing

We will not invent our own proof, either. This site does not ship fake logos or customer counts. Comparison pages do not invent competitor prices. If a number is not in the brief or in a public plan we actually sell, it should not appear as a fact.

If you want the other side of this problem — the stall after a PDF leaves your inbox — we wrote [why proposals stall after send](/blog/why-proposals-stall-after-send). If you want the delivery surface, see [proposal portal vs PDF](/blog/proposal-portal-vs-pdf).

Try a workspace [free](/register). Current seats and any founding offer are on [pricing](/pricing).
