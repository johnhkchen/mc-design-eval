// Generic BAML bridge for the collection pipeline (run via tsx). stdin: {fn, args, images?, model?, effort?, parseOnly?}
//   args    the function's arguments in order; an argument {image: "<path>"} or {images: ["<path>", ...]} becomes BAML Image(s)
//   fn      a baml_src function name (JudgeGlance, ReviewChange, ParseTasks, ...)
// BAML renders the prompt (with ctx.output_format from the typed return class), claude -p answers on the subscription,
// and b.parse.<fn> SAP-parses the reply into the typed result. parseOnly: skip the model and parse args[0] directly.
// Routing: which CLI answers is chosen per function in routes.json (or by `provider` in the request): claude (claude -p
// on the Claude plan) or codex (codex exec on the ChatGPT plan), with a fallback. stdout: {result, cost, provider}
import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml";
const { Image } = bamlpkg as any;
import { requestTextWithImage, requestText } from "../../src/sdk-binding.mjs";
import { mkdtempSync, writeFileSync, rmSync, existsSync as exists } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

const read = (): Promise<string> => new Promise((r) => { let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => r(d)); });
const req0 = JSON.parse(await read());
const { fn, args = [], parseOnly } = req0;
const routes = exists(join(HERE, "routes.json")) ? JSON.parse(readFileSync(join(HERE, "routes.json"), "utf8")) : {};
const route = { ...(routes[fn] || routes.default || { provider: "claude" }), ...(req0.provider ? { provider: req0.provider } : {}), ...(req0.model ? { model: req0.model } : {}), ...(req0.effort ? { effort: req0.effort } : {}) };
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
// answer with one CLI: returns {text, cost}
async function answer(r: any): Promise<{ text: string; cost: number }> {
  if (r.provider === "codex") {
    const d = mkdtempSync(join(tmpdir(), "baml-codex-"));
    try {
      const files = images.map((im: any, i: number) => { const f = join(d, `img-${i}.${im.mediaType === "image/png" ? "png" : "jpg"}`); writeFileSync(f, Buffer.from(im.base64, "base64")); return f; });
      const out = join(d, "reply.txt");
      const p = spawnSync("codex", ["exec", "--skip-git-repo-check", "--ephemeral", "-s", "read-only", "-C", d, "-o", out,
        ...(r.model && !String(r.model).startsWith("claude") ? ["-m", r.model] : []), ...files.flatMap((f: string) => ["-i", f])],
        { input: prompt + "\n\nReply with the answer only, in the requested format.", encoding: "utf8", maxBuffer: 1 << 26, timeout: 600000 });
      if (p.status !== 0 || !exists(out)) throw new Error(`codex exec failed: ${(p.stderr || p.stdout || "").slice(-300)}`);
      return { text: readFileSync(out, "utf8"), cost: 0 };          // plan-billed
    } finally { rmSync(d, { recursive: true, force: true }); }
  }
  const model = r.model && String(r.model).startsWith("claude") ? r.model : "claude-sonnet-5-5";
  const { text, raw } = images.length ? await requestTextWithImage({ prompt, images, model, effort: r.effort }) : await requestText({ prompt, model, effort: r.effort });
  return { text, cost: raw?.total_cost_usd || 0 };
}
const clean = (text: string) => {
  let t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const lo = t.indexOf("{"), hi = t.lastIndexOf("}");
  return lo >= 0 && hi > lo ? t.slice(lo, hi + 1) : t;
};
let lastErr: any;
for (const r of [route, ...(route.fallback ? [{ ...route, ...route.fallback, fallback: undefined }] : [])]) {
  for (let attempt = 1; attempt <= 3; attempt++) {   // malformed != verdict: re-ask the same prompt a bounded number of times
    try {
      const { text, cost } = await answer(r);
      process.stdout.write(JSON.stringify({ result: (b.parse as any)[fn](clean(text)), cost, provider: r.provider }));
      process.exit(0);
    } catch (e) { lastErr = e; }
  }
}
throw lastErr;
