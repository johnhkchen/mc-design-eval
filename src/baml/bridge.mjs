// Pure-.mjs wrapper over the one BAML bridge (T-129-01, story S-129, epic E-32). Spawns
// `npx tsx src/baml/bridge.mts` with a batch of render/parse ops on stdin and returns its
// results — the seam every runner and test uses, so no .mjs file ever imports baml_client.
// Transport NEVER happens here or in the bridge: the caller takes the rendered {prompt, images}
// to sdk-binding / model-tier (the subscription shim) itself.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const BRIDGE = fileURLToPath(new URL("./bridge.mts", import.meta.url));
const ROOT = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Run a batch of bridge ops in one tsx spawn.
 * @param {Array<{fn:string, mode:"render"|"parse", args?:object, images?:object, text?:string}>} ops
 * @returns {Promise<Array<{ok:true, prompt?:string, images?:{base64:string, mediaType:string}[], parsed?:object}|{ok:false, error:string}>>}
 */
export async function bamlBatch(ops) {
  const stdout = await new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", BRIDGE], { cwd: ROOT, stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`baml bridge exited ${code}`))));
    child.stdin.write(JSON.stringify({ ops }));
    child.stdin.end();
  });
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    throw new Error(`baml bridge: unparseable output (${stdout.slice(0, 200)}…)`);
  }
  return parsed.results;
}

/** Render one function's prompt + image blocks (the rendered request is the source of truth). */
export async function bamlRender({ fn, args, images }) {
  const [r] = await bamlBatch([{ fn, mode: "render", args, images }]);
  if (!r.ok) throw new Error(`bamlRender(${fn}): ${r.error}`);
  return { prompt: r.prompt, images: r.images };
}

/** Parse one raw reply through the function's typed SAP parser. Throws on parse failure. */
export async function bamlParse({ fn, text }) {
  const [r] = await bamlBatch([{ fn, mode: "parse", text }]);
  if (!r.ok) throw new Error(`bamlParse(${fn}): ${r.error}`);
  return r.parsed;
}
