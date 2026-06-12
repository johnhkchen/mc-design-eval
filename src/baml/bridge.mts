// THE ONE BAML BRIDGE (T-129-01, story S-129, epic E-32) — render + parse, NEVER transport.
// Spawned via `npx tsx` from src/baml/bridge.mjs; batch JSON protocol on stdio so one spawn
// serves a whole test run. This is the only NEW file that imports baml_client (the facade-era
// per-function bridges are grandfathered; the transport-guard test pins the importer set).
//
// E-32 Rule 2 transport: BAML is the schema/prompt/test authority; execution rides the
// `claude -p` subscription shim FROM THE .MJS RUNNERS (sdk-binding / model-tier). This bridge
// therefore exposes exactly two modes per function and no third:
//   render — args(+images) -> { prompt, images } extracted from the BAML-rendered request
//            (the rendered request is the single source of truth for text AND image order;
//            the joined text is trimEnd()ed: image-block separation appends trailing newlines
//            the .mjs builders never produced);
//   parse  — raw reply text -> typed object via b.parse (the SAP parser; fixture authority —
//            the live gates parseProgramReply/parseWorkshopReply stay in .mjs).
// BAML needs a key present to RENDER (never sent); the guard sets a dummy and deletes it —
// no transport happens in this process, so the metered key never meets a live call.

import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml"; // CJS: `Image` is on the default export, not an ESM named export
const { Image } = bamlpkg as any;

type Img = { base64: string; mediaType?: string };
const toImage = (i: Img) => Image.fromBase64(i.mediaType ?? "image/png", i.base64);

// fn name -> how to build the rendered request / how to parse a reply
const FNS: Record<string, { request: (a: any, img: any) => Promise<any>; parse: (t: string) => any }> = {
  RecognizeBuildingProgram: {
    request: (a, img) =>
      b.request.RecognizeBuildingProgram(a.pack_digest, a.sketch_digest, a.schema_json, toImage(img.concept), toImage(img.sketch_sheet)),
    parse: (t) => b.parse.RecognizeBuildingProgram(t),
  },
  CritiqueWorkshopRound: {
    request: (a, img) =>
      b.request.CritiqueWorkshopRound(
        a.round_num, a.budget, a.image_list, a.program_json, a.palette_block,
        a.conformance_block, a.last_round_note, a.live_actions, a.max_issues,
        toImage(img.concept), (img.renders ?? []).map(toImage),
      ),
    parse: (t) => b.parse.CritiqueWorkshopRound(t),
  },
  ReRecognizeMass: {
    request: (a) =>
      b.request.ReRecognizeMass(
        a.mass_id, a.pack_digest, a.sketch_digest, a.mass_json, a.critique_block, a.mass_schema_json,
      ),
    parse: (t) => b.parse.ReRecognizeMass(t),
  },
  AuthorMaterialStory: {
    request: (a) => b.request.AuthorMaterialStory(a.theme_brief),
    parse: (t) => b.parse.AuthorMaterialStory(t),
  },
  DecomposeBrushBacklog: {
    request: (a) => b.request.DecomposeBrushBacklog(a.style_summary, a.registry_state),
    parse: (t) => b.parse.DecomposeBrushBacklog(t),
  },
  DerivePalette: {
    request: (a) => b.request.DerivePalette(a.story_digest, a.source_keys, a.block_vocabulary),
    parse: (t) => b.parse.DerivePalette(t),
  },
  DeriveProportions: {
    request: (a) => b.request.DeriveProportions(a.story_digest, a.palette_digest),
    parse: (t) => b.parse.DeriveProportions(t),
  },
};

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

async function render(fn: string, args: any, images: any) {
  // Render-only key guard (the facade-era ClaudeStub precedent): never sent, deleted at once.
  const hadKey = "ANTHROPIC_API_KEY" in process.env;
  if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
  let req: any;
  try {
    req = await FNS[fn].request(args, images ?? {});
  } finally {
    if (!hadKey) delete process.env.ANTHROPIC_API_KEY;
  }
  const content = (req.body.json().messages ?? []).flatMap((m: any) =>
    Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }],
  );
  const prompt = content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trimEnd();
  const imgs = content
    .filter((c: any) => c.type === "image")
    .map((c: any) => ({ base64: c.source.data, mediaType: c.source.media_type }));
  return { prompt, images: imgs };
}

const { ops } = JSON.parse(await readStdin());
const results: any[] = [];
for (const op of ops ?? []) {
  try {
    if (!FNS[op.fn]) throw new Error(`unknown function "${op.fn}" (have: ${Object.keys(FNS).join(", ")})`);
    if (op.mode === "render") {
      results.push({ ok: true, ...(await render(op.fn, op.args ?? {}, op.images)) });
    } else if (op.mode === "parse") {
      results.push({ ok: true, parsed: FNS[op.fn].parse(String(op.text)) });
    } else {
      throw new Error(`unknown mode "${op.mode}" (render|parse)`);
    }
  } catch (e: any) {
    results.push({ ok: false, error: e?.message ?? String(e) });
  }
}
process.stdout.write(JSON.stringify({ results }));
