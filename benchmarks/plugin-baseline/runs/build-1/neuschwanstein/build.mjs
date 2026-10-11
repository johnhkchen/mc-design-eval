// Neuschwanstein generator: `node build.mjs` (all parts) or `LEVEL=1 node build.mjs` (massing + shell only).
import { Grid, LOG, fixPanes, despeckle } from "./parts/shared.mjs";
import { rock, approach, trees, outcrops } from "./parts/rock.mjs";
import { curtain } from "./parts/curtain.mjs";
import { palas } from "./parts/palas.mjs";
import { towers } from "./parts/towers.mjs";
import { gatehouse } from "./parts/gatehouse.mjs";
import { wings } from "./parts/wings.mjs";
import { details } from "./parts/details.mjs";
import { renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const LEVEL = +(process.env.LEVEL ?? 9);
const out = process.env.OUT ?? join(here, "build.nbt");
const g = new Grid([112, 76, 52]);
for (const part of [rock, outcrops, approach, curtain, palas, towers, gatehouse, wings, details, trees]) part(g, { level: LEVEL });
console.log("despeckled", despeckle(g));
fixPanes(g);
const tmp = out + ".tmp.nbt";
g.save(tmp);
renameSync(tmp, out);
console.log(JSON.stringify({ saved: out, level: LEVEL, size: g.size }));
