// Builds the Golden Gate south tower and suspension span from its parts, in plan order. runParts lets each part only
// ADD into air (writes into an earlier part's cells are refused and reported) and reports off-palette blocks per part.
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE_SIZE } from "./vocab/base.mjs";
import * as tower from "./parts/tower.mjs";
import * as towerSkin from "./parts/tower-skin.mjs";
import * as deck from "./parts/deck.mjs";
import * as cables from "./parts/cables.mjs";
import * as trim from "./parts/trim.mjs";

const out = process.argv[2];
if (!out) throw new Error("usage: node build.mjs <out.nbt>");

// no ground course: y 0 is the water surface, every cell not built stays air
const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSIONS["1.21.1"] });

runParts(
  g,
  [
    ["tower massing", tower.build],
    ["tower skin", towerSkin.build],
    ["deck", deck.build],
    ["cables", cables.build],
    ["lights and trim", trim.build],
  ],
  { palette: "palette.json", roof: "roof.json" },
);

g.save(out);
console.log(`saved ${out}`);
