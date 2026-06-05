// LLM-as-judge interface — now backed by BAML (categorical rubric v2). judgeRender shells out to
// the tsx baml-judge stage (BAML's JudgeFacade: enum-constrained output_format + SAP parse, piped
// through claude -p), which samples N times and returns a median-aggregated categorical score.
// run.mjs and judge-runs.mjs call this unchanged.

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RUBRIC_VERSION = "v2-categorical-baml";
export const CATEGORIES = ["weak", "competent", "strong", "exceptional"];

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Score one rendered facade against the BAML categorical rubric (median of `samples`).
 * @param {{ imagePath: string, brief: string, samples?: number }} p
 * @returns {Promise<{ proportion:string, color:string, detail:string, fidelity:string,
 *   overall:string, notes:string, samples:number, rubric:string, perSample:string[],
 *   usage:{input_tokens:number,output_tokens:number,cost_usd:number} }>}
 */
export function judgeRender({ imagePath, brief, samples = 3 }) {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", join(HERE, "baml-judge.mts")], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (c) => (out += c.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(`baml-judge exited ${code}`));
      try {
        resolve(JSON.parse(out));
      } catch (e) {
        reject(new Error(`baml-judge: unparseable output (${e.message})\n${out.slice(0, 300)}`));
      }
    });
    child.stdin.end(JSON.stringify({ imagePath, brief, samples }));
  });
}
