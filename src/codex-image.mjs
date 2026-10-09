// Image generation through the Codex CLI on the ChatGPT plan (its built-in image_gen tool: gpt-image, no API key).
// The same pattern as `claude -p`: a non-interactive agent run in a scratch directory that writes one file.
// Input images (for redraws, edits, side views) are attached with -i. Use through src/images.mjs (cache + ledger).
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

const TIMEOUT_MS = Number(process.env.MC_CODEX_TIMEOUT_MS || 600000);

// the prompt goes on stdin: `-i <FILE>...` is variadic and would swallow a positional prompt as another image
function run(args, cwd, input) {
  return new Promise((resolve, reject) => {
    const p = spawn("codex", args, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    p.stdin.end(input);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (out += d));
    const timer = setTimeout(() => { p.kill("SIGKILL"); reject(new Error(`codex exec timed out after ${TIMEOUT_MS} ms`)); }, TIMEOUT_MS);
    p.on("close", (code) => { clearTimeout(timer); code === 0 ? resolve(out) : reject(new Error(`codex exec exit ${code}: ${out.slice(-600)}`)); });
  });
}

/** @param {{prompt:string, images?:{base64:string,mediaType:string}[], size?:string}} req */
export async function codexImage({ prompt, images = [], size }) {
  const dir = mkdtempSync(join(tmpdir(), "codex-img-"));
  try {
    const inputs = images.map((im, i) => {
      const f = join(dir, `input-${i + 1}.${im.mediaType === "image/png" ? "png" : "jpg"}`);
      writeFileSync(f, Buffer.from(im.base64, "base64"));
      return f;
    });
    const task = [
      `Use your built-in image generation tool (image_gen) to make ONE image from the PROMPT below${inputs.length ? ", using the attached image(s) as the reference/input as the prompt describes" : ""}.`,
      size ? `Image size/aspect: ${size}.` : "",
      "Save it in the current directory as out.png (copy it there if the tool writes it elsewhere). Do not draw it with code and do not",
      "post-process it. Do not ask questions. Reply with only: out.png",
      "",
      "PROMPT:",
      prompt,
    ].filter(Boolean).join("\n");
    const log = await run(["exec", "--skip-git-repo-check", "-s", "workspace-write", "-C", dir, ...inputs.flatMap((f) => ["-i", f])], dir, task);
    const file = readdirSync(dir).find((f) => /^out\.(png|jpe?g|webp)$/.test(f));
    if (!file) throw new Error(`codex produced no out.png: ${log.slice(-600)}`);
    const model = (log.match(/^model: (.+)$/m) || [])[1];
    const buf = readFileSync(join(dir, file));
    return { base64: buf.toString("base64"), mediaType: file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg",
      model: `codex image_gen (agent ${model || "?"})` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
