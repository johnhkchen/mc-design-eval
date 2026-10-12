// Farmhouse + potager generator: `node build.mjs [out.nbt]` (default build.raw.nbt). make.sh adds the house roof afterwards.
import { Grid, runParts, SIZE, fixConnections } from "./vocab.mjs";
import * as shell from "./parts/shell.mjs";
import * as porch from "./parts/porch.mjs";
import * as potager from "./parts/potager.mjs";
import * as features from "./parts/features.mjs";
import * as interior from "./parts/interior.mjs";
import * as grounds from "./parts/grounds.mjs";
import { renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] ?? join(here, "build.raw.nbt");
const g = new Grid(SIZE);
// the ground: grass at y=0 over the whole site (cells set here stay writable by every part: paths and farmland may replace it)
g.fill([0, 0, 0], [SIZE[0] - 1, 0, SIZE[2] - 1], "grass_block");
const reports = runParts(g, [
  ["house shell", shell.build],
  ["porch + openings", porch.build],
  ["potager", potager.build],
  ["garden features", features.build],
  ["interior", interior.build],
  ["grounds", grounds.build],
], { palette: join(here, "palette.json") });
console.log("connections fixed:", fixConnections(g));
const tmp = out + ".tmp.nbt";
g.save(tmp);
renameSync(tmp, out);
console.log(JSON.stringify({ saved: out, size: g.size, parts: reports.map((r) => `${r.part}:${r.placed}${r.refused ? `(refused ${r.refused})` : ""}`) }));
