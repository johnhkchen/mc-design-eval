// Presidio Tunnel Tops, east half: the full site grid, the base stone layer, then the six parts in plan order.
// Usage: node build.mjs <out.nbt>   (make.sh writes a temp file and moves it into place)
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_X, SITE_Z, SITE_Y_MAX, GROUND_BASE_Y, STONE } from "./vocab/base.mjs";
import { build as ground } from "./parts/ground.mjs";
import { build as earthworks } from "./parts/earthworks.mjs";
import { build as portal } from "./parts/portal.mjs";
import { build as station } from "./parts/station.mjs";
import { build as planting } from "./parts/planting.mjs";
import { build as furnish } from "./parts/furnish.mjs";
import { build as drifts } from "./parts/drifts.mjs";

const out = process.argv[2] ?? "build.nbt";

// the full site: x 0..85, y 0..30, z 0..145 (86 x 31 x 146), 1.21.1 data version for the server
const g = new Grid([SITE_X[1] + 1, SITE_Y_MAX + 1, SITE_Z[1] + 1], { dataVersion: DATA_VERSIONS["1.21.1"] });

// base layer: stone at y1 over the whole site. The ground part lays groundColumn over it up to the height map; cells
// set here stay writable for it (runParts only locks what the parts place).
g.fill([SITE_X[0], GROUND_BASE_Y, SITE_Z[0]], [SITE_X[1], GROUND_BASE_Y, SITE_Z[1]], STONE);

runParts(g, [
  ["Ground and paths", ground],
  ["Earthworks", earthworks],
  ["Tunnel portal", portal],
  ["Field Station and Outpost", station],
  ["Planting and trees", planting],
  ["Furnishings and lighting", furnish],
  ["Trees, terraces and dense drifts", drifts],
], { palette: "palette.json", roof: "roof.json" });

g.save(out);
console.log(`saved ${out}`);
