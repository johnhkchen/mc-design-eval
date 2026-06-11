// Judge-reply robustness policy — pure core (T-114-01, story S-114, epic E-29).
//
// A MALFORMED REPLY IS NOT A VERDICT. The church's first gate run returned one truncated judge
// reply at 225° and the aggregate correctly REFUSED — but the no-re-roll rule (re-rolling
// *verdicts* is how gates get gamed) was conflated with "never ask again", letting one
// transport/format hiccup poison a milestone. This module makes the distinction STRUCTURAL:
//
//   - a reply either parses to a verdict — then it is FINAL, whatever it says, no re-ask ever —
//     or it is MALFORMED (schema violation / unparseable / transport throw), a distinct state;
//   - re-asks happen on malformed replies ONLY, bounded by a declared limit, with the SAME ask
//     thunk every attempt (the caller closes over prompt + pinned model once, so the instrument
//     is byte-identical by construction — no corrective addendum, unlike the sdk-binding
//     artifact-path retries, which mutate the prompt and are NOT reusable here);
//   - every reply — malformed ones included — is committed to a `replies[]` ledger with parse
//     status per attempt (the audit trail; the runner persists it on the view record).
//
// NO RE-ROLL BY CONSTRUCTION: nextAction() returns "final" whenever ANY ledger entry is parsed —
// there is no input for which a parsed verdict leads to another ask, and no API that accepts a
// parsed reply and produces one. runReplyPolicy() only asks while nextAction() says "ask".
//
// PURE — no I/O, no network, no gate-record knowledge. Judge-generic: parameterized by the
// seam's own parse function (multi-angle today; the E-22 resemblance seam can adopt it as-is).
// The metered ask, the view-record splice, and the re-judge mode live in the impure runner
// (benchmarks/sculpture/multi-angle-gate.mjs).

/** Total attempt bound: 1 initial ask + 2 bounded re-asks (the declared re-ask limit). */
export const MAX_REPLY_ATTEMPTS = 3;

/** The ledger keeps the first 400 chars of every reply (matches the runner's prior rawReply). */
export const RAW_REPLY_CLIP = 400;

/**
 * Classify one reply text against a seam's parse function. PURE, total: never throws on reply
 * content (a parser throw IS the malformed classification; the parser's precise message is the
 * evidence the ledger records).
 * @param {string} text  raw model reply
 * @param {(text: string) => object} parse  the seam's validating parser (throws on violation)
 * @returns {{parsed: true, verdict: object} | {parsed: false, error: string}}
 */
export function classifyReply(text, parse) {
  if (typeof parse !== "function") throw new Error("classifyReply: parse must be a function");
  try {
    return { parsed: true, verdict: parse(text) };
  } catch (e) {
    return { parsed: false, error: e.message };
  }
}

/**
 * The pure re-ask state machine over a reply ledger.
 *   "final"  ⇔ ANY entry is parsed — a verdict ends the matter permanently (no re-roll by
 *              construction: this arm is checked first and is independent of maxAttempts);
 *   "refuse" ⇔ the bound is exhausted and every reply was malformed;
 *   "ask"    ⇔ otherwise (every prior reply malformed, attempts remain).
 * Throws on a malformed ledger — that is a caller bug, not a reply state.
 * @param {Array<{parsed: boolean}>} replies  the ledger so far (seed + live, in order)
 * @param {{maxAttempts?: number}} [opts]
 * @returns {"final" | "refuse" | "ask"}
 */
export function nextAction(replies, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? MAX_REPLY_ATTEMPTS;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error(`nextAction: maxAttempts must be a positive integer, got ${maxAttempts}`);
  }
  if (!Array.isArray(replies)) throw new Error("nextAction: replies must be an array");
  for (const [i, r] of replies.entries()) {
    if (!r || typeof r.parsed !== "boolean") {
      throw new Error(`nextAction: replies[${i}] must carry a boolean .parsed`);
    }
  }
  if (replies.some((r) => r.parsed)) return "final";
  if (replies.length >= maxAttempts) return "refuse";
  return "ask";
}

/**
 * The policy driver: ask → classify → ledger, looping ONLY while nextAction() says "ask".
 *
 * `ask` is invoked with no arguments and must return `{text, usage}` — the SAME thunk every
 * attempt, so the prompt and model are byte-identical across re-asks by construction. A THROWN
 * ask is a malformed attempt (`transport:true`), not a crash: a CLI/stream failure is an I/O
 * hiccup to bound and audit, exactly like a truncated reply.
 *
 * `seed` enters pre-existing attempts (e.g. a committed record's malformed reply) at the head of
 * the ledger; seeded attempts COUNT toward the bound, and a seeded parsed reply means ZERO asks.
 *
 * The parsed verdict object is RETURNED, never embedded in the ledger — the caller's `verdict`
 * field keeps its existing shape and meaning.
 *
 * @param {() => Promise<{text: string, usage?: object|null}>} ask
 * @param {{parse: (text: string) => object, maxAttempts?: number,
 *          seed?: Array<{parsed: boolean, parseError?: string, rawReply?: string|null,
 *                        transport?: boolean, usage?: object|null}>}} opts
 * @returns {Promise<{verdict: object|null,
 *            replies: Array<{attempt: number, parsed: boolean, rawReply: string|null,
 *                            parseError?: string, transport?: true, usage: object|null,
 *                            source: "committed"|"live"}>,
 *            askCount: number}>}
 */
export async function runReplyPolicy(ask, { parse, maxAttempts = MAX_REPLY_ATTEMPTS, seed = [] } = {}) {
  if (typeof ask !== "function") throw new Error("runReplyPolicy: ask must be a function");
  if (typeof parse !== "function") throw new Error("runReplyPolicy: parse must be a function");
  if (!Array.isArray(seed)) throw new Error("runReplyPolicy: seed must be an array");

  const clip = (t) => (typeof t === "string" ? t.slice(0, RAW_REPLY_CLIP) : null);
  const replies = seed.map((s, i) => {
    if (!s || typeof s.parsed !== "boolean") {
      throw new Error(`runReplyPolicy: seed[${i}] must carry a boolean .parsed`);
    }
    return {
      attempt: i + 1,
      parsed: s.parsed,
      rawReply: clip(s.rawReply ?? null),
      ...(s.parseError != null ? { parseError: s.parseError } : {}),
      ...(s.transport ? { transport: true } : {}),
      usage: s.usage ?? null,
      source: "committed",
    };
  });

  let verdict = null; // a parsed seed is final but carries no verdict object to return
  let askCount = 0;
  while (nextAction(replies, { maxAttempts }) === "ask") {
    const attempt = replies.length + 1;
    askCount += 1;
    let entry;
    try {
      const { text, usage = null } = await ask();
      const c = classifyReply(text, parse);
      if (c.parsed) verdict = c.verdict;
      entry = {
        attempt,
        parsed: c.parsed,
        rawReply: clip(text),
        ...(c.parsed ? {} : { parseError: c.error }),
        usage,
        source: "live",
      };
    } catch (e) {
      entry = {
        attempt,
        parsed: false,
        rawReply: null,
        parseError: `transport: ${e.message}`,
        transport: true,
        usage: null,
        source: "live",
      };
    }
    replies.push(entry);
  }
  return { verdict, replies, askCount };
}
