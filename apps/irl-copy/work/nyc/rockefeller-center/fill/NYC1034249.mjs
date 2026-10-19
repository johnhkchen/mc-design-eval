// 15 West 45th Street, 2003: a nineteen-storey Midtown office tower on a two-storey lobby. The lobby, with its granite
// base and entrance, faces 45th Street (the z = 21 face). The tower is a curtain wall of blue-tinted glass between pale
// precast piers and floor lines, with windowless concrete party walls on the lot lines. The south half of the tower
// shoulders back two blocks, with the core standing up at x 2..3. The west corner steps down to 36 blocks. Rooftop plant
// sits on the tower and a planted terrace on the lobby roof. Some offices are lit behind the glass, and lanterns show
// in the lobby.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034249.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 9, Y = 71, Z = 22;
const STREET_Z = 21;          // the 45th Street front: the z = 21 face (the 9-wide side)
const LOBBY = 6;              // the lobby's roof height in blocks: two storeys
const DOOR_X = 4;

// Lidar roof heights smoothed into flat tiers. A 0 (no return) inside the tower reads as the roof; at the south end it is
// the lobby. Off the footprint is open to the air at every height.
const tierOf = (x, z, r) => {
  if (z >= 18) return x === 0 ? 36 : r >= 50 ? 59 : LOBBY;      // south end: lobby, with the west corner stepping up to 36
  if (x === 0 && z === 0) return 36;                              // north-west corner step
  if (r === 0 || r >= 50) return z >= 11 && x !== 2 && x !== 3 ? 57 : 59;   // tower; south half shoulders back, core 2..3
  return r < 16 ? LOBBY : 36;
};
const H = new Map();
for (const [x, z, , r] of cells) H.set(`${x},${z}`, tierOf(x, z, r));
const hAt = (x, z) => H.get(`${x},${z}`) ?? 0;
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const open = (x, z, y, d) => { const [dx, dz] = DIRS[d]; return hAt(x + dx, z + dz) <= y; };

const SLAB = "smooth_quartz", PIER = "light_gray_concrete", PANEL = "gray_concrete", GLASS = "light_blue_stained_glass_pane";
const SHOP = "glass_pane", BASE = "polished_granite";
const PANE_Z = { north: "false", south: "false", east: "true", west: "true" };   // panes run along x on a z face
const lit = (f, x, z) => (f * 5 + x * 3 + z * 2) % 7 === 0;                       // some offices lit, scattered

const g = new Voxels([X, Y, Z]);
for (const [x, z, ground] of cells) {
  const T = H.get(`${x},${z}`);
  for (let y = 0; y < ground; y++) g.set(x, y, z, PIER);                          // foundation: solid up to the ground
  for (let y = ground; y < T; y++) {
    const ez = open(x, z, y, "n") || open(x, z, y, "s");
    const ex = open(x, z, y, "w") || open(x, z, y, "e");
    const perim = ez || ex;
    if (y === T - 1) { g.set(x, y, z, perim ? SLAB : PIER); continue; }         // parapet, and the roof deck inside it
    if (y === 0 && perim) { g.set(x, y, z, BASE); continue; }                    // granite base course
    if (y % 3 === 0) { g.set(x, y, z, perim ? SLAB : PIER); continue; }          // storey line: a floor slab everywhere
    if (!perim) continue;                                                        // air gap behind the envelope
    if (z === STREET_Z && T === LOBBY && x >= 1) {                               // the lobby front on 45th Street
      if ((y === 1 || y === 2) && x === DOOR_X) {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (x === 1 || x === 8) g.set(x, y, z, PIER);
      else g.set(x, y, z, SHOP, PANE_Z);
      continue;
    }
    if (ez) {
      if (x % 2 === 0) g.set(x, y, z, PIER);                                     // mullion piers, two bays of glass between
      else g.set(x, y, z, GLASS, PANE_Z);
    } else g.set(x, y, z, z % 4 === 0 ? PIER : PANEL);                           // windowless party walls, in precast panels
  }
}

// Lit offices: glowstone just inside the glass on the north (z 1) and south (z 16) curtain walls, on scattered bays.
for (const [x, z] of [[...Array(9).keys()].map((x) => [x, 1]), [...Array(9).keys()].map((x) => [x, 16])].flat()) {
  if (x % 2 === 0) continue;
  for (let y = 1; y < (H.get(`${x},${z}`) ?? 0) - 1; y++) {
    if (y % 3 === 0 || (z === 16 && y < 6)) continue;
    if (lit(Math.floor(y / 3), x, z) && g.get(x, y, z) === null) g.set(x, y, z, "glowstone");
  }
}

// Lobby lanterns hang behind the glass, from the storey line above.
g.set(3, 2, 20, "lantern", { hanging: "true" });
g.set(5, 2, 20, "lantern", { hanging: "true" });

// Planted terrace on the lobby roof, and a plant room on the lobby roof's north-east end.
g.set(1, 6, 19, "moss_block"); g.set(2, 6, 19, "moss_block");
g.set(1, 6, 20, "moss_block"); g.set(2, 6, 20, "moss_block");
for (let x = 5; x <= 6; x++) for (let z = 18; z <= 19; z++) {
  g.set(x, 6, z, PIER); g.set(x, 7, z, PIER); g.set(x, 8, z, SLAB);
}

// Rooftop plant on the tower's north-west core, standing on the roof deck.
for (let x = 2; x <= 3; x++) for (let z = 2; z <= 4; z++) {
  g.set(x, 59, z, PIER); g.set(x, 60, z, PIER); g.set(x, 61, z, SLAB);
}

const { blocks, palette } = g.save(`${DIR}/NYC1034249.nbt`);
console.log(`NYC1034249.nbt: ${blocks} blocks, ${palette} palette entries`);
