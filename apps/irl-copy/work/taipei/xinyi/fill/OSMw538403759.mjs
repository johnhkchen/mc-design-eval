import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 14 x 14 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey 1960s-80s reinforced-concrete commercial block:
// white concrete piers, glazed ground-floor shopfront with red tile bulkhead,
// upper-floor punched windows with sills and heads, flat roof with parapet
// and a small steel water tank.
const W = 14, H = 23, D = 14;
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${SRC}/OSMw538403759.cells.json`, "utf8"));

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(key(x, z), gy);
const has = (x, z) => ground.has(key(x, z));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Exposed faces: outward neighbour not in footprint.
// along = index along the wall (used for bay rhythm), inx/inz = step inside the building.
const FACES = [
  { name: "north", dx: 0, dz: -1, inx: 0, inz: 1, along: (x) => x, pane: "ns" },
  { name: "south", dx: 0, dz: 1, inx: 0, inz: -1, along: (x) => x, pane: "ns" },
  { name: "west", dx: -1, dz: 0, inx: 1, inz: 0, along: (x, z) => z, pane: "ew" },
  { name: "east", dx: 1, dz: 0, inx: -1, inz: 0, along: (x, z) => z, pane: "ew" },
];
const exposed = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// One entrance: prefer the south-facing bay at index 7, else any exposed bay 7.
let doorKey = null;
const sorted = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
for (const [x, z] of sorted) {
  const f = exposed(x, z).find((ff) => ff.name === "south" && ff.along(x, z) === 7);
  if (f) { doorKey = key(x, z) + "," + f.name; break; }
}
if (!doorKey) {
  for (const [x, z] of sorted) {
    const f = exposed(x, z).find((ff) => ff.along(x, z) === 7);
    if (f) { doorKey = key(x, z) + "," + f.name; break; }
  }
}

const paneProps = (f) =>
  f.pane === "ns"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gy] of cells) {
  const faces = exposed(x, z);
  const corner = faces.length >= 2;

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Ground-level floor slab (interior) and base course (exterior).
  put(x, gy, z, faces.length ? "polished_andesite" : "smooth_stone");

  // Storey line / floor slab at gy+5, roof slab at gy+10.
  put(x, gy + 5, z, "smooth_stone");
  put(x, gy + 10, z, "smooth_stone");

  // Parapet on exterior cells.
  if (faces.length) put(x, gy + 11, z, "white_concrete");

  if (corner) {
    // Corner columns are solid concrete piers through both storeys.
    for (let y = gy + 1; y <= gy + 4; y++) put(x, y, z, "white_concrete");
    for (let y = gy + 6; y <= gy + 9; y++) put(x, y, z, "white_concrete");
    continue;
  }

  for (const f of faces) {
    const idx = f.along(x, z);
    const isPier = idx % 3 === 0;
    const inside = has(x + f.inx, z + f.inz);
    const isDoor = doorKey === key(x, z) + "," + f.name;

    // Storey 1: shopfront.
    if (isPier) {
      for (let y = gy + 1; y <= gy + 4; y++) put(x, y, z, "white_concrete");
    } else if (isDoor) {
      put(x, gy + 1, z, "dark_oak_door", {
        facing: f.name, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gy + 2, z, "dark_oak_door", {
        facing: f.name, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(x, gy + 3, z, "glass");
      put(x, gy + 4, z, "white_concrete");
    } else {
      put(x, gy + 1, z, "red_terracotta");
      put(x, gy + 2, z, "glass");
      put(x, gy + 3, z, "glass");
      put(x, gy + 4, z, "white_concrete");
      if (inside && idx % 6 === 4) put(x + f.inx, gy + 2, z + f.inz, "glowstone");
    }

    // Storey 2: punched windows with sill and head.
    if (isPier) {
      for (let y = gy + 6; y <= gy + 9; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gy + 6, z, "smooth_stone");
      put(x, gy + 7, z, "glass_pane", paneProps(f));
      put(x, gy + 8, z, "glass_pane", paneProps(f));
      put(x, gy + 9, z, "white_concrete");
      if (inside && idx % 6 === 2) put(x + f.inx, gy + 7, z + f.inz, "shroomlight");
    }
  }
}

// Steel water tank on the roof, centred in the footprint.
for (const [x, z] of [[6, 6], [7, 6], [6, 7], [7, 7]]) {
  if (!has(x, z)) continue;
  const gy = ground.get(key(x, z));
  put(x, gy + 11, z, "spruce_planks");
  put(x, gy + 12, z, "spruce_planks");
  put(x, gy + 13, z, "iron_block");
}

g.save(`${SRC}/OSMw538403759.nbt`);
