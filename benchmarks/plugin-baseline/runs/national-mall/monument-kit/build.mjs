// The Washington Monument grounds (plan.md): the ground, then the six parts in order, saved to argv[2].
// The ground is laid before runParts so later parts may replace its surface (walks, plaza, floodlights); runParts locks
// each part's blocks from the parts after it, reports off-palette ids, and lays roof.json after the first part once it exists.
import { existsSync } from "node:fs";
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SIZE } from "./vocab/base.mjs";

// A part whose file is not written yet (its worker is still on it) is a no-op, so make.sh never fails on a missing part.
async function partBuild(module) {
  const url = new URL(module, import.meta.url);
  if (!existsSync(url)) return () => {};
  return (await import(url.href)).build ?? (() => {});
}

const out = process.argv[2] ?? "build.nbt";
const g = new Grid(SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

(await partBuild("./parts/ground.mjs"))(g);

const parts = [
  ["obelisk", "./parts/obelisk.mjs"],
  ["plaza and pavilion", "./parts/plaza.mjs"],
  ["flag ring and floodlights", "./parts/flags.mjs"],
  ["walks, lamps, lawn lights and trees", "./parts/walks-trees.mjs"],
  ["survey lodge", "./parts/lodge.mjs"],
];
const list = await Promise.all(parts.map(async ([name, module]) => [name, await partBuild(module)]));
runParts(g, list, { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
