import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC63517";
const W = 20, H = 27, D = 7;

// Chesapeake & Potomac Telephone Co. "Old Main": early-20th-century Classical/Beaux-Arts
// commercial office. Light limestone (calcite) walls with pilasters, a polished granite
// base, stone-brick string courses and cornice, four storeys of ~4 blocks each, flat roof
// with parapet. Recessed entrance bay on the street (min-z) face.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const K = (x, z) => `${x},${z}`;
const C = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  C.set(K(x, z), { x, z, gr, roof });
}

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const c of C.values()) {
  minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
  minZ = Math.min(minZ, c.z); maxZ = Math.max(maxZ, c.z);
}

// Smooth lidar roof into clean tiers: main mass sits at the median roof,
// lower wings keep their (rounded) height, and everything is at least 5 blocks tall.
const roofVals = [...C.values()].map((c) => c.roof).sort((a, b) => a - b);
const med = roofVals[roofVals.length >> 1];
for (const c of C.values()) {
  const t = c.roof >= med - 2 ? med : Math.round(c.roof);
  c.top = Math.min(H - 1, Math.max(t, c.gr + 5)); // solid up to top-1; top = roof surface
}

const faces = (x, z) => {
  const f = {
    n: !C.has(K(x, z - 1)),
    s: !C.has(K(x, z + 1)),
    w: !C.has(K(x - 1, z)),
    e: !C.has(K(x + 1, z)),
  };
  f.any = f.n || f.s || f.w || f.e;
  return f;
};

// Entrance cell: central cell on the street (min-z) face.
const midX = Math.floor((minX + maxX) / 2);
let door = null;
for (const c of C.values()) {
  if (c.z !== minZ) continue;
  if (!door || Math.abs(c.x - midX) < Math.abs(door.x - midX)) door = c;
}

for (const c of C.values()) {
  const { x, z, gr, top } = c;
  const f = faces(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Interior cells: air gap, floor slabs per storey, roof deck.
  if (!f.any) {
    for (let y = gr; y < top; y++) {
      const local = y - gr;
      if (local > 0 && local % 4 === 0) g.set(x, y, z, "smooth_stone");
    }
    g.set(x, top - 1, z, "smooth_stone");
    continue;
  }

  const corner = (f.n || f.s) && (f.w || f.e);
  const axisNS = f.n || f.s; // facade runs along x
  const pos = axisNS ? x - minX : z - minZ;
  const lastCol = axisNS ? x === maxX : z === maxZ;
  const pilaster = corner || pos % 3 === 0 || lastCol;
  const paneProps = axisNS
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  // Inward neighbour (for shroomlight glow behind some windows).
  let ix = null, iz = null;
  if (f.n) { ix = x; iz = z + 1; }
  else if (f.s) { ix = x; iz = z - 1; }
  else if (f.w) { ix = x + 1; iz = z; }
  else if (f.e) { ix = x - 1; iz = z; }
  const inwardOk = ix !== null && C.has(K(ix, iz)) && !faces(ix, iz).any;

  for (let y = gr; y < top; y++) {
    const local = y - gr;
    const st = Math.floor(local / 4);
    const row = local % 4;

    if (y === top - 1) {
      g.set(x, y, z, "smooth_stone");                  // parapet cap
    } else if (y === top - 2) {
      g.set(x, y, z, "stone_bricks");                  // cornice band
    } else if (st === 0 && row === 0) {
      g.set(x, y, z, "polished_granite");              // base course
    } else if (row === 3 && st < 3) {
      g.set(x, y, z, "stone_brick_slab", { type: "top" }); // string course above each storey
    } else if (row === 0 || row === 3) {
      g.set(x, y, z, "calcite");                       // floor band / spandrel
    } else if (pilaster) {
      g.set(x, y, z, "calcite");                       // pilaster column
    } else {
      g.set(x, y, z, "glass_pane", paneProps);         // window
      if (row === 1 && inwardOk && (x + z + st) % 3 === 0) {
        g.set(ix, y, iz, "shroomlight");               // warm light behind glass
      }
    }
  }

  // Corner lanterns on the parapet.
  if (corner) g.set(x, top, z, "lantern", { hanging: "false" });
}

// Entrance bay: recessed door flanked by pilasters, stone-brick arch above.
if (door) {
  const { x, gr } = door;
  const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
  // Flanking pilasters on the street face, one cell each side of the door.
  for (const dx of [-1, 1]) {
    const nx = x + dx;
    if (C.has(K(nx, minZ))) {
      for (let y = gr; y < gr + 3; y++) g.set(nx, y, minZ, "polished_granite");
      g.set(nx, gr + 3, minZ, "calcite");
    }
  }
  // Door, two halves.
  g.set(x, gr, minZ, "iron_door", { ...dp, half: "lower" });
  g.set(x, gr + 1, minZ, "iron_door", { ...dp, half: "upper" });
  // Transom and stone-brick arch over the door.
  g.set(x, gr + 2, minZ, "calcite");
  g.set(x, gr + 3, minZ, "stone_bricks");
  // Hanging lantern inside the entrance bay, under a ceiling block.
  if (C.has(K(x, minZ + 1))) {
    g.set(x, gr + 3, minZ + 1, "smooth_stone");
    g.set(x, gr + 2, minZ + 1, "lantern", { hanging: "true" });
  }
}

// Rooftop penthouse / mechanical block on a central interior roof cell, if present.
{
  const midZ = Math.floor((minZ + maxZ) / 2);
  const mc = C.get(K(midX, midZ));
  if (mc && !faces(midX, midZ).any) {
    g.set(midX, mc.top, midZ, "iron_block");
    if (mc.top + 1 < H) g.set(midX, mc.top + 1, midZ, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
