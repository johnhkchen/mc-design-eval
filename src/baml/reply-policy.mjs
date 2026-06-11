// Shared ASYNC reply policy (T-131-01, story S-131, epic E-32) — the bounded same-prompt
// re-ask loop with T-114 semantics, for callers whose parse is async (the BAML bridge).
// Promoted here on T-129's explicit invitation ("if a third caller needs async-parse reply
// policy, promote a shared async variant in a non-judge module"): the callers are the fixture
// minter (scripts/mint-baml-fixture.mjs) and the design-backlog factory
// (scripts/design-backlog.mjs). The frozen judge keeps its own sync core
// (src/form/judge-reply.mjs — instrument surface, E-32 Rule 2); only its declared constants
// are imported FROM it, so the judge path gains no dependency.
//
// T-114 semantics, verbatim:
//   - a reply that parses is FINAL, whatever it says — no re-ask ever after a parse;
//   - re-asks happen on malformed replies ONLY (parse throw / transport throw), bounded by
//     maxAttempts, with the SAME ask thunk every attempt (the caller closes over prompt +
//     pinned model once — byte-identical instrument by construction);
//   - every attempt is ledgered (clipped rawReply, parse status, usage, transport flag) and
//     every live raw text is kept in full for the committed record.
//
// PURE of I/O — ask and parse arrive injected; no fs, no network, no clock.

import { MAX_REPLY_ATTEMPTS, RAW_REPLY_CLIP } from "../form/judge-reply.mjs";

export { MAX_REPLY_ATTEMPTS, RAW_REPLY_CLIP };

/**
 * Run the bounded same-prompt re-ask loop.
 * @param {object} p
 * @param {() => Promise<{text:string, raw?:object}>} p.ask one transport attempt (throw = transport-flagged)
 * @param {(text:string) => Promise<object>} p.parse typed parse (throw = malformed)
 * @param {number} [p.maxAttempts]
 * @returns {Promise<{accepted:boolean, expected:object|null, replies:object[], rawTexts:string[], askCount:number}>}
 */
export async function runAsyncReplyPolicy({ ask, parse, maxAttempts = MAX_REPLY_ATTEMPTS }) {
  const replies = [];
  const rawTexts = [];
  let expected = null;
  let askCount = 0;
  while (expected === null && replies.length < maxAttempts) {
    const attempt = replies.length + 1;
    askCount += 1;
    try {
      const { text, raw } = await ask();
      rawTexts.push(text);
      try {
        expected = await parse(text);
        replies.push({ attempt, parsed: true, rawReply: text.slice(0, RAW_REPLY_CLIP), usage: raw?.usage ?? null, source: "live" });
      } catch (e) {
        replies.push({ attempt, parsed: false, rawReply: text.slice(0, RAW_REPLY_CLIP), parseError: e.message, usage: raw?.usage ?? null, source: "live" });
      }
    } catch (e) {
      replies.push({ attempt, parsed: false, rawReply: null, parseError: `transport: ${e.message}`, transport: true, usage: null, source: "live" });
    }
  }
  return { accepted: expected !== null, expected, replies, rawTexts, askCount };
}
