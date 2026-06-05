// BAML build stage, run via tsx (the generated client is TypeScript). Reads {brief,
// designDoc} as JSON on stdin; renders the BAML prompt (terse output_format), pipes it
// through `claude -p` (subscription, via the seam's requestText), SAP-parses the reply,
// and writes {design, usage} JSON to stdout. run.mjs (pure node) shells out to this.

import { b } from "../../baml_client/index.ts";
import { requestText } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => resolve(d));
  });
}

const { brief, designDoc } = JSON.parse(await readStdin());

// BAML needs ANTHROPIC_API_KEY present to RENDER the request (it's never sent). Use a dummy
// if absent, then delete it before the claude -p transport call so claude -p stays on the
// SUBSCRIPTION (a real/dummy key in env could flip it to API billing).
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!hadKey) process.env.ANTHROPIC_API_KEY = "baml-render-only-never-sent";

// (1) Render the BAML prompt WITHOUT sending — extract the message text + system prompt.
const req: any = await b.request.BuildTempleFacade(brief, designDoc);
const body: any = req.body.json();
const msgText = (body.messages ?? [])
  .map((m: any) => (Array.isArray(m.content) ? m.content.map((c: any) => c.text ?? "").join("") : m.content))
  .join("\n");
const sysText = body.system
  ? Array.isArray(body.system)
    ? body.system.map((s: any) => s.text ?? s).join("\n")
    : body.system
  : "";
const prompt = sysText ? `${sysText}\n\n${msgText}` : msgText;

// (2) Transport: claude -p (SUBSCRIPTION). Drop the dummy key first so claude -p doesn't see
// it. No withSchemaInstruction — BAML's output_format is already in the prompt.
if (!hadKey) delete process.env.ANTHROPIC_API_KEY;
const { text, raw } = await requestText({ prompt, model: PHASE1_MODEL_ID });

// (3) Pre-slice to the brace span FIRST — the model narrates around the JSON (prose preamble +
// feature-summary postamble, P10), and BAML's SAP can mis-locate the object in that wrapper while a
// dumb first-{…last-} slice recovers it. Then SAP-parse the clean object.
let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
const lo = cleaned.indexOf("{");
const hi = cleaned.lastIndexOf("}");
if (lo >= 0 && hi > lo) cleaned = cleaned.slice(lo, hi + 1);

let design: any;
try {
  design = b.parse.BuildTempleFacade(cleaned);
} catch (e) {
  console.error(`[baml-build] SAP parse failed on ${text.length}-char output.`);
  console.error("--- head ---\n" + text.slice(0, 700));
  console.error("--- tail ---\n" + text.slice(-700));
  throw e;
}

const u = raw.usage || {};
process.stdout.write(
  JSON.stringify({
    design,
    usage: { input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0, cost_usd: raw.total_cost_usd || 0 },
    promptChars: prompt.length,
  }),
);
