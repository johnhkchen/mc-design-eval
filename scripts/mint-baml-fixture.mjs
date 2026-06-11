// Mint a committed BAML fixture for the two NEW design functions (T-129-01, story S-129,
// epic E-32): vernacular (AuthorMaterialStory) and decompose (DecomposeBrushBacklog).
// `npm run baml:mint -- --fn vernacular|decompose [--rotate-pins]`.
//
// LIVE (subscription shim, STRONG tier — never the metered API; this run IS the AC2 transport
// proof): render through the bridge (BAML authority for prompt + schema), ask via requestText,
// parse via b.parse — bounded SAME-PROMPT re-asks on malformed replies via the shared async
// policy (src/baml/reply-policy.mjs, T-114 semantics: every attempt ledgered, full raw texts
// committed, a parsed reply is final, transport throws are flagged).
//
// Writes src/baml/fixtures/<fn>/{inputs.json, prompt.txt, reply.txt, expected.json, ledger.json}
// — pin-guarded (T-119): committed fixtures never silently overwritten.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { MODEL_TIERS } from "../src/config.mjs";
import { requestText } from "../src/sdk-binding.mjs";
import { runAsyncReplyPolicy, MAX_REPLY_ATTEMPTS } from "../src/baml/reply-policy.mjs";
import { guardedWriteRecord, preflightPins, loadTrackedSet, isTracked, ROTATE_FLAG } from "../src/form/pin-guard.mjs";
import { bamlRender, bamlParse } from "../src/baml/bridge.mjs";
import { loadStylePack } from "../src/pack/style-pack.mjs";
import { registryDigest } from "../src/pack/brush-catalog.mjs";
import { packSummary } from "../src/factory/backlog.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const jsonOf = (x) => JSON.stringify(x, null, 2) + "\n";

const FIXTURES = {
  vernacular: {
    fn: "AuthorMaterialStory",
    args: async () => ({ theme_brief: "a fishing village on a cold coast" }),
  },
  decompose: {
    fn: "DecomposeBrushBacklog",
    args: async () => ({
      style_summary: packSummary(loadStylePack(join(ROOT, "packs/rustic.json"))),
      registry_state: registryDigest(),
    }),
  },
};

const argv = process.argv.slice(2);
const which = argv[argv.indexOf("--fn") + 1];
const rotate = argv.includes(ROTATE_FLAG);
const def = FIXTURES[which];
if (!def) throw new Error(`pass --fn <${Object.keys(FIXTURES).join("|")}>`);

const relDir = `src/baml/fixtures/${which}`;
const rels = ["inputs.json", "prompt.txt", "reply.txt", "expected.json", "ledger.json"]
  .map((f) => `${relDir}/${f}`);

// BEFORE ANY SPEND (T-119): declare every record this run writes.
const trackedSet = loadTrackedSet(ROOT);
preflightPins({
  pins: rels.map((rel) => ({ rel, tracked: isTracked(trackedSet, rel) })),
  rotate,
  intent: `mint BAML fixture (${which})`,
});

const args = await def.args();
const { prompt } = await bamlRender({ fn: def.fn, args });
const model = MODEL_TIERS.strong;
console.error(`[mint] ${which}: asking ${def.fn} (budget ${MAX_REPLY_ATTEMPTS}, model ${model})…`);

// Bounded same-prompt re-asks (T-114 semantics; async parse via the bridge — see header).
const { expected, replies, rawTexts, askCount } = await runAsyncReplyPolicy({
  ask: () => requestText({ prompt, model }),
  parse: (text) => bamlParse({ fn: def.fn, text }),
});

await mkdir(join(ROOT, relDir), { recursive: true });
const write = (rel, content) => guardedWriteRecord({ root: ROOT, rel, content, rotate });

await write(`${relDir}/ledger.json`, jsonOf({
  schema: "baml-fixture-ledger/v1",
  ticket: "T-129-01",
  fn: def.fn,
  model,
  transport: "claude -p subscription shim (sdk-binding requestText) — no metered API key",
  promptSha256: sha256(prompt),
  budget: MAX_REPLY_ATTEMPTS,
  askCount,
  accepted: expected !== null,
  replies,
  rawTexts, // FULL raw texts, one per live ask (the AC's committed raw replies)
}));
await write(`${relDir}/inputs.json`, jsonOf(args));
await write(`${relDir}/prompt.txt`, prompt);

if (expected === null) {
  console.error(`[mint] ${which}: REFUSED — every reply malformed within the budget (ledger committed).`);
  process.exit(1);
}
await write(`${relDir}/reply.txt`, rawTexts[rawTexts.length - 1]);
await write(`${relDir}/expected.json`, jsonOf(expected));
console.error(`[mint] ${which}: accepted on attempt ${askCount}; fixtures committed under ${relDir}/`);
