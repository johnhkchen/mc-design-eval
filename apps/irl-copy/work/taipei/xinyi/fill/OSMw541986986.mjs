import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey shophouse block, Xinyi, c. 1980s-90s.
// Read as: pale concrete walls with quartz piers and bands, stone-brick plinth
// and parapet, glass shopfront and office bays, a dark-oak entrance on the north
// face, and a small brick stair/mechanical housing with AC units on the roof.
// Storeys are 5 blocks; roof is 11 blocks above the cell's ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986986";
const W = 14, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Bounds-checked setter; props optional
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces of a perimeter cell (W/E/N/S), empty for interior cells
const faces = (x, z) => {
  const f = [];
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  return f;
};

// Inward step from a perimeter cell through its face
const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

// Pane connection states: panes run along the wall they sit in
const paneStates = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle non-corner cell on the north face (lowest z)
const northCells = cells
  .filter(([x, z]) => faces(x, z).length === 1 && faces(x, z)[0] === "N")
  .sort((a, b) => a[0] - b[0]);
const doorCell = northCells.length ? northCells[Math.floor(northCells.length / 2)] : null;
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;

// ---- Main build ----
for (const [x, z, base] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone");

  const fc = faces(x, z);
  const perim = fc.length > 0;
  const corner = fc.length >= 2;

  // Floor slabs at each storey line and the roof deck
  put(x, base, z, perim ? "stone_bricks" : "smooth_stone");
  put(x, base + 5, z, perim ? "smooth_quartz" : "smooth_stone");
  put(x, base + 10, z, perim ? "stone_bricks" : "gray_concrete");

  if (!perim) continue; // interior stays air (no interiors)

  // Perimeter wall, storey 1 (base+1..base+4) and storey 2 (base+6..base+9)
  const face = fc[0];
  const along = face === "N" || face === "S" ? x - minX : z - minZ;
  const isPier = corner || along % 3 === 0;
  const isDoor = `${x},${z}` === doorKey;

  // Plinth and parapet
  // (base is the plinth, base+10 parapet already placed as roof deck)

  // Spandrels and belt course
  put(x, base + 4, z, isPier ? "smooth_quartz" : "white_concrete");
  put(x, base + 5, z, "smooth_quartz");
  put(x, base + 9, z, isPier ? "smooth_quartz" : "white_concrete");

  for (const storey of [0, 1]) {
    const b = base + storey * 5;
    for (let dy = 1; dy <= 3; dy++) {
      const y = b + dy;
      if (isPier) {
        put(x, y, z, "smooth_quartz");
      } else if (isDoor && storey === 0 && dy <= 2) {
        // door handled below
        continue;
      } else {
        put(x, y, z, "glass_pane", paneStates(face));
      }
    }
  }

  if (!isPier) {
    // Warm light behind some windows, in the air gap inside the cell
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && faces(ix, iz).length === 0 && (along % 2 === 0)) {
      put(ix, base + 2, iz, "glowstone");
      put(ix, base + 7, iz, "glowstone");
    }
  }

  // Entrance door and hanging lantern
  if (isDoor) {
    const b = base;
    put(x, b + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, b + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, b + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- Roof: parapet is already on the perimeter; add mechanical housing and AC ----
const interiorCell = (x, z) => inside(x, z) && faces(x, z).length === 0;

// Brick stair/mechanical housing, central, two blocks high with a slab cap
for (let x = minX + 4; x <= maxX - 4; x++) {
  for (let z = minZ + 7; z <= maxZ - 7; z++) {
    if (!interiorCell(x, z)) continue;
    const base = ground.get(`${x},${z}`);
    put(x, base + 11, z, "bricks");
    put(x, base + 12, z, "bricks");
    put(x, base + 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Two AC condenser units near the north-west roof edge
const acSpots = [[minX + 2, minZ + 3], [minX + 3, minZ + 3]];
for (const [x, z] of acSpots) {
  if (!interiorCell(x, z)) continue;
  const base = ground.get(`${x},${z}`);
  put(x, base + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
