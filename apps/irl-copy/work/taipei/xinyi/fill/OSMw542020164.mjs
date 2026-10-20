import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Shophouse-era mid-rise: two storeys over a shopfront, cream tiled walls,
// grey concrete bands, red fascia over the street-side shops, flat roof with a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020164";
const W = 9, H = 23, D = 18;
const TOP = 10;      // cornice / roof deck level (absolute)
const PARAPET = 11;  // parapet course on the roof edge

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground (clamped so the building fits under the roof line)
const base = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  base.set(`${x},${z}`, Math.max(0, Math.min(TOP, Math.floor(gr))));
}
const has = (x, z) => base.has(`${x},${z}`);
const isPerim = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));
const isInterior = (x, z) => has(x, z) && !isPerim(x, z);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Faces: outward normal and the axis the facade runs along.
const FACES = [
  { name: "E", dx: 1, dz: 0, glass: GLASS_EW, along: "z" },
  { name: "W", dx: -1, dz: 0, glass: GLASS_EW, along: "z" },
  { name: "N", dx: 0, dz: -1, glass: GLASS_NS, along: "x" },
  { name: "S", dx: 0, dz: 1, glass: GLASS_NS, along: "x" },
];

// 1. Foundation, solid from y 0 up to each cell's ground.
for (const [key, b] of base) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
}

// 2. Shell, floors, roof deck and parapet.
for (const [key, b] of base) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) {
    // wall column from ground to the cornice
    for (let y = b; y <= TOP; y++) put(x, y, z, "white_concrete");
    put(x, b, z, "stone_bricks");                         // base course
    if (b + 4 <= TOP) put(x, b + 4, z, "gray_concrete");   // ground-floor storey line
    if (b + 5 <= TOP) put(x, b + 5, z, "gray_concrete");   // second-floor belt
    put(x, TOP, z, "gray_concrete");                       // cornice
    put(x, PARAPET, z, "white_concrete");                  // parapet
  } else {
    put(x, b, z, "smooth_stone");                          // ground floor slab
    if (b + 5 <= TOP) put(x, b + 5, z, "smooth_stone");    // upper floor slab
    if (b <= TOP) put(x, TOP, z, "smooth_stone");          // roof deck
  }
}

// 3. Facade articulation: window grids, shopfront, entrance and red awning band.
const STREET = "E"; // the Xinyi frontage faces east
const DOOR_Z = 9;

for (const [key, b] of base) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;

  for (const f of FACES) {
    const outside = !has(x + f.dx, z + f.dz);
    if (!outside) continue;
    const t = f.along === "z" ? z : x;
    const street = f.name === STREET;

    if (street) {
      // red fascia over the shopfront (overrides the grey storey line)
      if (b + 4 <= TOP) put(x, b + 4, z, "red_terracotta");
    }

    // ground-floor windows / shopfront glass (rows b+1..b+3)
    if (t % 3 !== 0) {
      for (let y = b + 1; y <= b + 3; y++) put(x, y, z, "glass_pane", f.glass);
    }
    // upper windows (rows b+6..b+8)
    if (t % 3 !== 0 && b + 8 <= TOP) {
      for (let y = b + 6; y <= b + 8; y++) put(x, y, z, "light_blue_stained_glass_pane", f.glass);
    }

    // entrance on the street face
    if (street && z === DOOR_Z) {
      put(x, b, z, "oak_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 1, z, "oak_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "white_concrete"); // pillar beside the door, above the leaf
      put(x, b + 3, z, "white_concrete");
    }
  }
}

// 4. Warm light behind the street-side upper windows (interior glowstone on the floor slab).
for (const [key, b] of base) {
  const [x, z] = key.split(",").map(Number);
  if (x !== W - 2 || !isInterior(x, z)) continue; // interior cell next to the east facade
  if (z % 6 !== 1) continue;
  if (b + 6 < TOP) put(x, b + 6, z, "glowstone");
}

// 5. Roof equipment: a small penthouse on the roof deck, inside the parapet.
for (let x = 3; x <= 5; x++) {
  for (let z = 6; z <= 11; z++) {
    if (!isInterior(x, z)) continue;
    if (!base.has(`${x},${z}`) || base.get(`${x},${z}`) > TOP) continue;
    put(x, TOP + 1, z, "white_concrete");
    put(x, TOP + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
