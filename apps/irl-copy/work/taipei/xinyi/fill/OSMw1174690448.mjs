import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1174690448";
const W = 19, H = 23, D = 23;
const ROOF = 11;     // parapet top (absolute y)
const CEIL = 10;     // roof / second-floor ceiling slab
const FLOOR2 = 5;    // belt course and second-floor slab

const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gy] of cells) {
  ground.set(key(x, z), gy);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const inside = (x, z) => ground.has(key(x, z));
const outward = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("north");
  if (!inside(x, z + 1)) f.push("south");
  if (!inside(x - 1, z)) f.push("west");
  if (!inside(x + 1, z)) f.push("east");
  return f;
};
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);

// Door: north-facing street edge, nearest the centre line.
let doorKey = null, bestD = Infinity;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  if (outward(x, z).includes("north")) {
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; doorKey = key(x, z); }
  }
}

const g = new Voxels([W, H, D]);

function put(x, y, z, gy, id, props) {
  if (y < gy || y >= H || y < 0) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const inwardOf = (face, x, z) => {
  if (face === "north") return [x, z + 1];
  if (face === "south") return [x, z - 1];
  if (face === "west") return [x + 1, z];
  return [x - 1, z];
};

for (const [x, z, gy] of cells) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  const out = outward(x, z);
  const perim = out.length > 0;

  if (!perim) {
    // Interior: floor slabs only, air elsewhere (no interiors).
    put(x, gy, z, gy, "smooth_quartz");
    put(x, FLOOR2, z, gy, "smooth_quartz");
    put(x, CEIL, z, gy, "smooth_quartz");
    continue;
  }

  const face = out[0];
  const along = (face === "north" || face === "south") ? x : z;
  const pillar = along % 4 === 0;
  const paneProps = (face === "north" || face === "south")
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  const pane = () => put(x, 0, z, 0, "glass_pane"); // placeholder never used

  const setPane = (y) => put(x, y, z, gy, "glass_pane", paneProps);
  const setPillar = (y) => put(x, y, z, gy, "white_concrete");

  // Base course on the foundation.
  put(x, gy, z, gy, "stone_bricks");

  const isDoor = key(x, z) === doorKey;
  if (isDoor) {
    const dProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
    put(x, gy, z, gy, "dark_oak_door", dProps("lower"));
    put(x, gy + 1, z, gy, "dark_oak_door", dProps("upper"));
    put(x, gy + 2, z, gy, "white_concrete");
    put(x, gy + 3, z, gy, "white_concrete");
  } else {
    // Ground-floor shopfront: glass bays between pillars.
    for (let y = gy + 1; y <= 3; y++) {
      if (pillar) setPillar(y); else setPane(y);
    }
  }

  // Ground-floor lintel and belt course.
  put(x, 4, z, gy, "white_concrete");
  put(x, FLOOR2, z, gy, "white_concrete");

  // Second floor: sill, glazing, lintel.
  if (pillar) {
    setPillar(6);
  } else {
    put(x, 6, z, gy, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  for (const y of [7, 8]) { if (pillar) setPillar(y); else setPane(y); }
  put(x, 9, z, gy, "white_concrete");

  // Cornice and parapet.
  put(x, CEIL, z, gy, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  put(x, ROOF, z, gy, "white_concrete");

  // Warm lanterns hung from the ceiling behind some windows.
  if (!pillar && !isDoor) {
    const [ix, iz] = inwardOf(face, x, z);
    if (inside(ix, iz) && outward(ix, iz).length === 0 && along % 8 === 2) {
      put(ix, 9, iz, ground.get(key(ix, iz)), "lantern", { hanging: "true", waterlogged: "false" });
    }
    if (inside(ix, iz) && outward(ix, iz).length === 0 && along % 8 === 6) {
      put(ix, 4, iz, ground.get(key(ix, iz)), "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

// Roof equipment: water tank on a 3x3 plinth at the centre, with a cap.
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz + 1; z++) {
    if (!inside(x, z)) continue;
    const gy = ground.get(key(x, z));
    put(x, 11, z, gy, "iron_block");
    put(x, 12, z, gy, "iron_block");
    put(x, 13, z, gy, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Two small condenser units near the south-west corner of the roof.
for (const [x, z] of [[minX + 2, maxZ - 2], [minX + 3, maxZ - 2]]) {
  if (inside(x, z)) put(x, 11, z, ground.get(key(x, z)), "iron_block");
}

g.save(`${SRC}.nbt`);
