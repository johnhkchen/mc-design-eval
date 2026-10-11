// Neuschwanstein generator: `node build.mjs` (all parts) or `LEVEL=1 node build.mjs` (massing + shell only).
import { Grid, LOG, DY, fixPanes, despeckle } from "./parts/shared.mjs";
import { rock, approach, trees, outcrops } from "./parts/rock.mjs";
import { backCliff, cliffPines } from "./parts/backcliff.mjs";
import { frontRoad } from "./parts/road.mjs";
import { apse } from "./parts/apse.mjs";
import { courtyard } from "./parts/courtyard.mjs";
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
const CASTLE_H = 102;                                   // castle is authored at its own levels (terraces at y10/y16), then lifted DY
const g = new Grid([112, CASTLE_H + DY, 52]);
for (const part of [rock, outcrops, approach, backCliff, frontRoad]) part(g, { level: LEVEL });
const c = new Grid([112, CASTLE_H, 52]);
for (const part of [curtain, palas, towers, gatehouse, wings, details, apse, courtyard]) part(c, { level: LEVEL });
for (const cell of c.cells.values()) g.set(cell.pos[0], cell.pos[1] + DY, cell.pos[2], cell.block, cell.state, cell.nbt);
trees(g);
cliffPines(g);
console.log("despeckled", despeckle(g));
fixPanes(g);
const tmp = out + ".tmp.nbt";
g.save(tmp);
renameSync(tmp, out);
console.log(JSON.stringify({ saved: out, level: LEVEL, size: g.size }));
