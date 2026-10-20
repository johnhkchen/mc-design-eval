import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 4 x 5, roof about 7 blocks above lowest ground.
// Read as a two-storey Taiwanese shophouse of the 1960s-80s: white rendered
// walls, red tile cornice and parapet, a stone base, and a shopfront with a
// street-side door on the front (south, z = 4) elevation.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1305263753";
const W = 4, H = 19, D = 5;

const FLOOR = 3;   // floor slab between the two storeys (y = 3)
const ROOF = 6;    // roof deck and cornice course (y = 6)
const TOP = 7;     // parapet / rooftop equipment (y = 7)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function doorProps(half) {
  return { facing: "south", half, hinge: "left", open: "false", powered: "false" };
}

// Returns [id, props?] for an above-foundation block, or null for air.
function blockAt(x, y, z, gr) {
  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const front = z === D - 1;

  // Parapet and rooftop
  if (y === TOP) {
    if (perim) return ["red_terracotta"];
    if (x === 1 && z === 2) return ["lantern", { hanging: "false" }];
    return null;
  }

  // Roof deck and cornice course
  if (y === ROOF) return perim ? ["red_terracotta"] : ["smooth_stone"];

  // Floor slab between storeys
  if (y === FLOOR) return ["smooth_stone"];

  // Interior cells are air behind the envelope
  if (!perim) return null;

  // Ground storey (gr .. FLOOR-1)
  if (y < FLOOR) {
    if (front) {
      if (x === 0 || x === W - 1) return ["polished_andesite"];           // shopfront piers
      if (x === 1 && y <= gr + 1 && y < FLOOR - 1) {
        return y === gr
          ? ["oak_door", doorProps("lower")]
          : ["oak_door", doorProps("upper")];                              // entrance door
      }
      if (y >= FLOOR - 1) return ["white_concrete"];                       // fascia band
      return ["glass_pane"];                                               // shop glazing
    }
    // Side and back ground walls, with a single small window on the sides
    if ((x === 0 || x === W - 1) && z === 2 && y === gr + 1) return ["glass_pane"];
    return ["white_concrete"];
  }

  // Upper storey (FLOOR+1 .. ROOF-1)
  if (front) {
    if (x === 0 || x === W - 1) return ["white_concrete"];                  // window piers
    if (x === 1 && y === 4) return ["glowstone"];                          // warm lit window
    return ["glass_pane"];
  }
  if ((x === 0 || x === W - 1) && z === 2) return ["glass_pane"];
  if (z === 0 && (x === 1 || x === 2)) return ["glass_pane"];
  return ["white_concrete"];
}

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(gr0, H - 1));

  // Foundation: solid stone from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Building envelope from this cell's ground up to the parapet
  for (let y = gr; y <= TOP && y < H; y++) {
    const b = blockAt(x, y, z, gr);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

g.save(`${DIR}/${ID}.nbt`);
