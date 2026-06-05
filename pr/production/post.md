# post.md — LinkedIn post copy

Lifts the locked voice from `pr/script/script.md` (declarative, receipts-forward, no hype
adjectives) and the CTA block verbatim. Every number traces to a `[receipt:…]` in
`pr/assets/sequence.md`. **No product promise** — none exists yet (v1-sequencing).

---

## Hook line (first line — the feed preview)

> Same model. Same game. The only thing that changed was the method — and it took an LLM from a
> 333-block gray box to a "strong"-rated Minecraft facade.

## Body

I spent two days making an LLM *design* — not just code — by adding one technique at a time and
measuring every step.

The climb, on one subject so the improvement reads as method, not a subject swap:
- **+ a design doc** to ground the build → competent. ($1.08, 1,372 blocks.)
- **+ a reference photo** → it inherited real proportion. (20,311 blocks.)
- **+ craft and color, split** (craft from the reference, color from the brief) and one fix — a
  facade is *one connected plane* → **strong**, unanimous 3/3. Same model as the gray box:
  `claude-opus-4-8`, same seed.

The part I'm actually proud of is the stuff that *didn't* work, because it's why I trust the rest:
- **I replaced my own metric.** My first numeric score saturated at ~4 with noise — it couldn't
  tell which technique helped. So I rebuilt it as a categorical judge (weak / competent / strong /
  exceptional, median-of-3). The score you see climbing exists *because* I distrusted the easy one.
- **Best-of-N cost 7× and gained nothing.** Four candidates, judge-selected: $5.34 and ~29 minutes,
  re-scored the same band as one $0.76 one-shot. Stacking surface detail in one pass actually
  *regressed* quality (color crashed 4.0 → 2.67).
- **One dimension still won't climb: detail.** Both dedicated fixes failed; an overnight loop
  promoted nothing. I'd called it a "structural ceiling" — then retracted that, because it was my
  own cap, not the model's.

Then text-JSON hit a wall, so I changed tools — grounding on an *image* instead — and the builds got
sharp fast. The concept frames in the video are exactly that: concept art, labeled `[concept]`, not
the Minecraft build. The one thing I claim is *real* is the rotation — the actual voxel build
spinning in my own renderer (`prismarine-viewer` + real `minecraft-assets`), which a generated
picture can't fake.

Where it's heading — the closing Golden Gate frame — is a **staged sculptor**: build in locked,
validated passes (relief, palette, ornament) instead of one budget-constrained blob. That's the
direction, not something I've shipped.

The thesis: **we're the sculptor, not the 2-D-to-3-D tool.** A perfect scan still needs someone to
decide what's good — and to prove it with a number that survives scrutiny.

## CTA (verbatim from `script.md` CTA block — do not add a "try it")

> I'm publishing the whole journal — the principles, the null results, the climb. Follow if you
> build with LLMs and want the receipts.

> Comment bait: Which technique would you have bet on? I was wrong about best-of-N.

(Link the journal: `docs/knowledge/design-learnings.md`. There is **no packaged tool yet** — do not
promise a product; it breaks the honesty contract and the v1-sequencing reality.)

## Hashtags (3–5 — LinkedIn rewards restraint)

`#LLM` `#AIagents` `#PromptEngineering` `#Minecraft` `#AIevaluatIon`

## Posting notes

- **Upload the square 1:1 `rough-cut.mp4`** (or the 4:5 vertical per `spec.md`) — captions are
  burned in, so it reads on muted autoplay.
- Put the **journal link in the first comment**, not the post body (LinkedIn de-ranks outbound links
  in-body).
- Pin the comment-bait reply to seed discussion.
- If recording VO, use the `script.md` `VO:` lines; otherwise the burned captions stand alone.

## Honesty self-check (matches the chain's ledger)

- [x] Concept ≠ real build — concepts called out in-body; only the rotation is claimed real.
- [x] v1-sequencing — the Golden Gate is "where it's heading," not "what I shipped."
- [x] No invented metrics — every number above traces to a run `summary.json` / the journal.
- [x] Same model load-bearing — `claude-opus-4-8`, same seed, both ends of the climb.
- [x] No product promise — follow-for-method + comment bait only; no "try it."
