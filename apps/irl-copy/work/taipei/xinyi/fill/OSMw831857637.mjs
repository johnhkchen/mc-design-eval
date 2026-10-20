import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const raw = JSON.parse(readFileSync(`${dir}/OSMw831857637.cells.json`, "utf8"));

const W = 22, H = 23, D = 19;
const ROOF = 11;          // roof about 11 blocks above lowest ground
const SHOP_TOP = 4;       // ground storey: y 0..4 (shopfront, transom at 4)
const BELT = 5;           // storey line between the two storeys
const CORNICE = 10;       // stone brick cornice course
const PARAPET = 11;       // solid parapet ring, roof deck behind it

const g = new Voxels([W, H, D]);

// ground map: "x,z" -> ground y
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const cells = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr };
});

const inside = (x, z) => ground.has(`${x},${z}`);
const edge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const pillarAt = (x, z) => x % 4 === 0 || z % 4 === 0;

const SLAB = (type) => ({ type, waterlogged: "false" });
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// 1. foundations, floors, and facade shell
for (const { x, z, gr } of cells) {
  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge(x, z)) {
    // interior: floor slabs per storey and roof deck, air between
    g.set(x, gr, z, "smooth_stone");
    if (BELT > gr) g.set(x, BELT, z, "smooth_stone");
    if (ROOF > gr) g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  // perimeter facade: pillars every 4 blocks, cream tile spandrels, glazed bays
  const pillar = pillarAt(x, z);
  const body = pillar ? "smooth_quartz" : "white_terracotta";

  for (let y = gr; y <= PARAPET; y++) {
    let id, props;
    if (y === PARAPET) {
      id = "smooth_quartz";                       // parapet
    } else if (y === CORNICE) {
      id = "stone_brick_slab"; props = SLAB("bottom");
    } else if (y === BELT) {
      id = "smooth_quartz";                       // storey line
    } else if (y <= 3) {
      // shopfront: glazing between pillars
      if (pillar) id = "smooth_quartz";
      else { id = "glass_pane"; props = PANE; }
    } else if (y === SHOP_TOP) {
      id = "smooth_quartz";                       // transom band
    } else if (y <= 8) {
      // upper storey window bays
      if (pillar) id = "smooth_quartz";
      else { id = "light_blue_stained_glass_pane"; props = PANE; }
    } else {
      id = body;                                  // y 9 spandrel
    }
    g.set(x, y, z, id, props);
  }
}

// 2. warm light behind some upper-storey windows (in the air gap, one step in)
for (const { x, z, gr } of cells) {
  if (!edge(x, z) || pillarAt(x, z) || gr > 6) continue;
  if (((x * 5 + z * 3) % 7) !== 0) continue;
  for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]]) {
    if (inside(nx, nz) && !edge(nx, nz)) {
      g.set(nx, 7, nz, "glowstone");
      break;
    }
  }
}

// 3. entrance on the front (lowest z) facade, centred among those cells
const perim = cells.filter(({ x, z }) => edge(x, z));
const minZ = Math.min(...perim.map((c) => c.z));
const front = perim.filter((c) => c.z === minZ).sort((a, b) => a.x - b.x);
if (front.length) {
  const door = front[Math.floor(front.length / 2)];
  const { x, z, gr } = door;
  g.set(x, gr, z, "air");
  g.set(x, gr + 1, z, "air");
  g.set(x, gr + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  // canopy lintel over the door opening, on the footprint cell itself
  g.set(x, gr + 3, z, "smooth_quartz");
  // flank the door with pillars so it reads as an entrance bay
  for (const dx of [-1, 1]) {
    if (inside(x + dx, z) && edge(x + dx, z)) {
      g.set(x + dx, gr, z, "smooth_quartz");
    }
  }
}

// 4. roof equipment: two condenser plant blocks on the roof deck
const interiorCells = new Set(
  cells.filter(({ x, z, gr }) => !edge(x, z) && gr < ROOF).map(({ x, z }) => `${x},${z}`)
);
const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
const cz = cells.reduce((s, c) => s + c.z, 0) / cells.length;
const origins = [];
for (const k of interiorCells) {
  const [x, z] = k.split(",").map(Number);
  if (interiorCells.has(`${x + 1},${z}`) && interiorCells.has(`${x},${z + 1}`) && interiorCells.has(`${x + 1},${z + 1}`)) {
    origins.push({ x, z, d: Math.hypot(x - cx, z - cz) });
  }
}
origins.sort((a, b) => a.d - b.d);
const picks = [];
for (const o of origins) {
  if (picks.every((p) => Math.abs(p.x - o.x) >= 3 || Math.abs(p.z - o.z) >= 3)) picks.push(o);
  if (picks.length === 2) break;
}
for (const { x, z } of picks) {
  for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    g.set(x + dx, ROOF + 1, z + dz, "light_gray_concrete");
  }
}

g.save(`${dir}/OSMw831857637.nbt`);
