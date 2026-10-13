// Builds build.nbt from scratch: the site's ground, then every part in plan order (runParts locks each part's blocks).
// Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SITE_SIZE, GROUND_Y } from "./vocab/base.mjs";
import * as shell from "./parts/shell.mjs";
import * as stairs from "./parts/stairs.mjs";
import * as roofs from "./parts/roofs.mjs";
import * as colonnade from "./parts/colonnade.mjs";
import * as joinery from "./parts/joinery.mjs";
import * as outbuildings from "./parts/outbuildings.mjs";
import * as grounds from "./parts/grounds.mjs";
import * as room1 from "./parts/room-1.mjs";
import * as room2 from "./parts/room-2.mjs";
import * as room3 from "./parts/room-3.mjs";
import * as room4 from "./parts/room-4.mjs";
import * as room5 from "./parts/room-5.mjs";
import * as room6 from "./parts/room-6.mjs";
import * as room7 from "./parts/room-7.mjs";
import * as room8 from "./parts/room-8.mjs";
import * as room9 from "./parts/room-9.mjs";
import * as room10 from "./parts/room-10.mjs";
import * as room11 from "./parts/room-11.mjs";
import * as room12 from "./parts/room-12.mjs";
import * as room13 from "./parts/room-13.mjs";
import * as room14 from "./parts/room-14.mjs";
import * as room15 from "./parts/room-15.mjs";
import * as room16 from "./parts/room-16.mjs";
import * as room17 from "./parts/room-17.mjs";
import * as room18 from "./parts/room-18.mjs";
import * as room19 from "./parts/room-19.mjs";
import * as room20 from "./parts/room-20.mjs";
import * as room21 from "./parts/room-21.mjs";
import * as room22 from "./parts/room-22.mjs";
import * as room23 from "./parts/room-23.mjs";
import * as room24 from "./parts/room-24.mjs";
import * as room25 from "./parts/room-25.mjs";
import * as room26 from "./parts/room-26.mjs";
import * as room27 from "./parts/room-27.mjs";
import * as room28 from "./parts/room-28.mjs";
import * as room29 from "./parts/room-29.mjs";
import * as room30 from "./parts/room-30.mjs";
import * as room31 from "./parts/room-31.mjs";
import * as room32 from "./parts/room-32.mjs";
import * as room33 from "./parts/room-33.mjs";
import * as room34 from "./parts/room-34.mjs";
import * as room35 from "./parts/room-35.mjs";
import * as room36 from "./parts/room-36.mjs";
import * as room37 from "./parts/room-37.mjs";

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(1);
}

// The stair joiner carves its stairwells through the shell's floors (carve: true); every other part only adds into air.
const PARTS = [
  ["mansion shell", shell.build],
  ["stairs and ladders", stairs.build, { carve: true }],
  ["roofs and chimneys", roofs.build],
  ["colonnade and galleries", colonnade.build],
  ["joinery", joinery.build],
  ["outbuildings", outbuildings.build],
  ["grounds", grounds.build],
  ["room: entrance hall", room1.build],
  ["room: parlour library", room2.build],
  ["room: dining room", room3.build],
  ["room: west ground corridor", room4.build],
  ["room: east ground corridor", room5.build],
  ["room: guest bedroom", room6.build],
  ["room: guest bath", room7.build],
  ["room: back hall morning room", room8.build],
  ["room: butler's pantry", room9.build],
  ["room: powder room", room10.build],
  ["room: living room", room11.build],
  ["room: kitchen", room12.build],
  ["room: upper hall and porch landing", room13.build],
  ["room: master bedroom", room14.build],
  ["room: master bath", room15.build],
  ["room: bedroom 2", room16.build],
  ["room: bedroom 3", room17.build],
  ["room: west upper corridor", room18.build],
  ["room: bedroom 4", room19.build],
  ["room: west hall bath", room20.build],
  ["room: east upper corridor and wing passage", room21.build],
  ["room: bedroom 5", room22.build],
  ["room: east hall bath", room23.build],
  ["room: wing balcony walk", room24.build],
  ["room: wing walkway", room25.build],
  ["room: bedroom 6", room26.build],
  ["room: bedroom 7", room27.build],
  ["room: upper porch", room28.build],
  ["room: ground gallery", room29.build],
  ["room: rear porch", room30.build],
  ["room: carriage bay", room31.build],
  ["room: carriage loft", room32.build],
  ["room: cottage parlour", room33.build],
  ["room: cottage bedroom", room34.build],
  ["room: cottage bath", room35.build],
  ["room: gazebo", room36.build],
  ["room: greenhouse", room37.build],
];

// The kit's ids are the 26.x names (iron_chain in vocab and palette.json), so the grid is saved as 26.3 (DataVersion 5023).
// The grid's 1.21.4 default would make every chain an unknown block.
const DATA_VERSION_26_3 = 5023;

// The roof tool lays its truss ties after every part, and a tie over a bottom slab hangs half a block over air (fit:
// "on a bottom slab"). Fill each such slab to a whole block so the tie has a whole face.
function fillTieSlabs(g) {
  let n = 0;
  for (let x = 0; x < SITE_SIZE[0]; x++) for (let y = 1; y < SITE_SIZE[1]; y++) for (let z = 0; z < SITE_SIZE[2]; z++) {
    if (!/stripped_spruce_log$/.test(g.blockAt(x, y, z))) continue;
    const below = g.get(x, y - 1, z);
    if (below && /deepslate_tile_slab$/.test(below.block) && below.state?.type === "bottom") {
      g.set(x, y - 1, z, "deepslate_tiles");
      n++;
    }
  }
  return n;
}

function buildWith(roof) {
  const g = new Grid(SITE_SIZE, { dataVersion: DATA_VERSION_26_3 });
  g.fill([0, GROUND_Y, 0], [SITE_SIZE[0] - 1, GROUND_Y, SITE_SIZE[2] - 1], "grass_block");
  runParts(g, PARTS, { palette: "palette.json", roof });
  console.log(`truss ties: ${fillTieSlabs(g)} bottom slabs under them filled to whole blocks`);
  return g;
}

// roof.json lays the roof on the shell's walls. While the shell is still a stub there are no walls to roof: build without it.
let g;
try {
  g = buildWith("roof.json");
} catch (e) {
  if (!/no walls found/.test(e.message)) throw e;
  console.log(`roof: skipped, ${e.message} (the shell has no walls yet)`);
  g = buildWith(undefined);
}

g.save(out);
console.log(`saved ${out}`);
