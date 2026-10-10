// Generic BAML bridge for the collection pipeline (run via tsx). stdin: {fn, args, images?, model?, effort?, parseOnly?}
//   args    the function's arguments in order; an argument {image: "<path>"} or {images: ["<path>", ...]} becomes BAML Image(s)
//   fn      a baml_src function name (JudgeGlance, ReviewChange, ParseTasks, ...)
// BAML renders the prompt (with ctx.output_format from the typed return class), claude -p answers on the subscription,
// and b.parse.<fn> SAP-parses the reply into the typed result. parseOnly: skip the model and parse args[0] directly.
// stdout: {result, cost}
import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml";
const { Image } = bamlpkg as any;
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const read = (): Promise<string> => new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d)); });
const { fn, args = [], model = "claude-sonnet-5-5", effort, parseOnly } = JSON.parse(await read());
const mt = (p: string) => (/\.jpe?g$/i.test(p) ? "image/jpeg" : /\.webp$/i.test(p) ? "image/webp" : "image/png");
const toImg = (p: string) => Image.fromBase64(mt(p), readFileSync(p).toString("base64"));

if (parseOnly) {
  process.stdout.write(JSON.stringify({ result: (b.parse as any)[fn](String(args[0])), cost: 0 }));
  process.exit(0);
}
const bamlArgs = args.map((a: any) => (a && a.image ? toImg(a.image) : a && a.images ? a.images.map(toImg) : a));
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";   // needed to render; never sent
const req: any = await (b.request as any)[fn](...bamlArgs);
if (!hadKey) delete process.env.ANTHROPIC_API_KEY;
const content = (req.body.json().messages ?? []).flatMap((m: any) => (Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }]));
const prompt = content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
const images = content.filter((c: any) => c.type === "image").map((c: any) => ({ base64: c.source.data, mediaType: c.source.media_type }));
let lastErr: any;
for (let attempt = 1; attempt <= 3; attempt++) {   // malformed != verdict: re-ask the same prompt a bounded number of times
  try {
    const { text, raw } = images.length ? await requestTextWithImage({ prompt, images, model, effort })
      : await (await import("../../src/sdk-binding.mjs") as any).requestText({ prompt, model, effort });
    let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const lo = t.indexOf("{"), hi = t.lastIndexOf("}");
    if (lo >= 0 && hi > lo) t = t.slice(lo, hi + 1);
    process.stdout.write(JSON.stringify({ result: (b.parse as any)[fn](t), cost: raw?.total_cost_usd || 0 }));
    process.exit(0);
  } catch (e) { lastErr = e; }
}
throw lastErr;
