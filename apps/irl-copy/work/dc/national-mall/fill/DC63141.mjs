// DC63141: a two-storey red-brick Federal-era office block (c. 1880s) on the lidar footprint, with a stone base,
// belt course and cornice, a flat roof behind the parapet, and a door in the north wall. The roof is one flat tier at
// the median lidar height (the 4s are noise at the corners and are smoothed up). No interiors: each storey is an air
// room with a floor slab under it, and each window has its air room behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63141.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => fp.has(key(x, z));
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const TOP = roofs[Math.floor(roofs.length / 2)];      // 5: the median lidar roof, one flat tier
const GROUND = Math.min(...cells.map((c) => c[2]));   // 0: the lowest ground under the footprint

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const exposed = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !inFp(x + dx, z + dz)).map(([d]) => d);
const perimeter = (x, z) => exposed(x, z).length > 0;

// storeys: base course, ground storey, belt course (and upper floor), upper storey, cornice (top layer)
const Y = { base: GROUND, g1: GROUND + 1, belt: GROUND + 2, u1: GROUND + 3, top: TOP - 1 };

// a window sits on an exposed face whose inner neighbour is core room, so the glass has air behind it
const windowFace = (x, z) => {
  if (!perimeter(x, z)) return null;
  for (const d of exposed(x, z)) {
    const [dx, dz] = DIRS[d];
    if (inFp(x - dx, z - dz) && !perimeter(x - dx, z - dz)) return d;
  }
  return null;
};

const DOOR = [2, 1];                                  // north wall, opens into the core room behind it
const LIGHTS = new Set(["lantern", "glowstone", "shroomlight"]);
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`);

for (const [x, z] of cells) {
  if (!perimeter(x, z)) {                             // core room: floor, floor slab, roof deck; air between
    put(x, Y.base, z, "smooth_stone");
    put(x, Y.belt, z, "smooth_quartz");
    put(x, Y.top, z, "stone");
    continue;
  }
  const isDoor = x === DOOR[0] && z === DOOR[1];
  const face = windowFace(x, z);
  put(x, Y.base, z, "polished_andesite");             // base course
  put(x, Y.belt, z, "smooth_quartz");                 // belt course, sill of the upper windows
  put(x, Y.top, z, (x + z) % 2 ? "chiseled_quartz_block" : "smooth_quartz");   // cornice with dentils
  for (const y of [Y.g1, Y.u1]) {
    if (isDoor && y === Y.g1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    else if (isDoor && y === Y.u1) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });   // hood over the door
    else if (face) put(x, y, z, "PANE");                // glass pane, state set once every neighbour is known
    else put(x, y, z, "bricks");
  }
}

// the upper half of the door sits in the belt course row
put(DOOR[0], Y.belt, DOOR[1], "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });

// lights behind the glass, in the air of the core rooms
put(3, Y.g1, 2, "lantern", { hanging: "false" });
put(5, Y.g1, 2, "glowstone");
put(3, Y.u1, 2, "lantern", { hanging: "false" });
put(4, Y.u1, 2, "shroomlight");

// panes join the solid neighbours in their plane (not lights, not the door), so a window reads as a run of glass
for (const [k, v] of plan) {
  if (v.block !== "PANE") continue;
  const [x, y, z] = k.split(",").map(Number);
  const state = { waterlogged: "false" };
  for (const [d, [dx, dz]] of Object.entries(DIRS)) {
    const n = at(x + dx, y, z + dz);
    state[d] = n && !LIGHTS.has(n.block) && n.block !== "dark_oak_door" ? "true" : "false";
  }
  v.block = "glass_pane";
  v.state = state;
}

const g = new Voxels([8, 17, 4]);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC63141.nbt`);
console.log(`DC63141: ${out.blocks} blocks, ${out.palette} palette entries, roof ${TOP}, ground ${GROUND}`);
