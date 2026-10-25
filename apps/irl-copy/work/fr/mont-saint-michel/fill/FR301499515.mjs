import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499515";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 25, D = 16;
const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint: [x, z, ground, roof]
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { x, z, gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(`${x},${z}`);
const at = (x, z) => map.get(`${x},${z}`);

const glassN = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glassEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const dmax = Math.floor((D - 1) / 2); // 7
const roofTop = new Map();

// ---- Pass 1: foundation, ceiling slab, pitched roof, every footprint cell ----
for (const c of map.values()) {
  const { x, z, gr } = c;
  const eave = gr + 5;
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");
  put(x, eave, z, "stone_bricks"); // ceiling / floor slab of the single storey

  const R = Math.min(Math.max(c.rf, eave + 3), H - 4);
  const d = Math.min(z, D - 1 - z);
  const k = (R - eave - 1) / dmax;
  const h = eave + 1 + Math.round(Math.min(d, dmax) * k);
  roofTop.set(`${x},${z}`, h);

  for (let y = eave + 1; y <= h - 1; y++) put(x, y, z, "deepslate_tiles");
  if (d === dmax) {
    put(x, h, z, "deepslate_tiles");
  } else {
    put(x, h, z, "deepslate_tile_stairs", {
      facing: z < D / 2 ? "north" : "south",
      half: "bottom",
      shape: "straight",
      waterlogged: "false",
    });
  }
}

// ---- Pass 2: solid wall skin on every perimeter cell (explicit, before openings) ----
for (const c of map.values()) {
  const { x, z, gr } = c;
  const eave = gr + 5;
  const isEdge = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  if (!isEdge) continue;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const body = corner ? "stone_bricks" : "smooth_sandstone";
  for (let y = gr + 1; y <= eave - 1; y++) put(x, y, z, body);
  put(x, gr + 1, z, "stone_bricks"); // base course
  put(x, eave - 1, z, "stone_bricks"); // cornice band under the eave
}

// ---- Pass 3: openings and articulation on top of the solid walls ----
for (const c of map.values()) {
  const { x, z, gr } = c;
  const eave = gr + 5;

  // Street face, z = 0: commercial shopfront
  if (z === 0 && x > 0 && x < W - 1) {
    // pilasters
    if ([1, 7, 9, 15].includes(x)) {
      for (let y = gr + 1; y <= eave - 2; y++) put(x, y, z, "stone_bricks");
    }
    // entrance: centre door with a glazed transom above
    if (x === 8) {
      put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass_pane", glassN);
    }
    // shop windows, two bays
    if ((x >= 2 && x <= 6) || (x >= 10 && x <= 14)) {
      put(x, gr + 1, z, "stone_bricks");
      for (let y = gr + 2; y <= gr + 3; y++) put(x, y, z, "glass_pane", glassN);
    }
    // striped awning band
    if (x >= 1 && x <= 15) {
      put(x, eave - 1, z, x % 2 === 0 ? "red_concrete" : "white_concrete");
    }
  }

  // Rear face, z = D-1: plain windows
  if (z === D - 1 && x > 0 && x < W - 1) {
    if (x % 4 === 2 || x % 4 === 3) {
      for (let y = gr + 2; y <= gr + 3; y++) put(x, y, z, "glass_pane", glassN);
    }
  }

  // Side faces, x = 0 and x = W-1: window grid along z
  if ((x === 0 || x === W - 1) && z > 0 && z < D - 1) {
    if (z % 4 === 1 || z % 4 === 2) {
      for (let y = gr + 2; y <= gr + 3; y++) put(x, y, z, "glass_pane", glassEW);
    }
  }
}

// Warm light behind some glass, inside the air gap
const lightAt = (x, z, dy = 3) => { if (has(x, z)) put(x, at(x, z).gr + dy, z, "glowstone"); };
lightAt(4, 1);
lightAt(12, 1);
lightAt(1, 5);
lightAt(1, 10);
lightAt(6, 14);
lightAt(10, 14);

// Chimney rising from the ridge
if (has(3, 7)) {
  const top = roofTop.get("3,7");
  for (let y = top + 1; y <= top + 3; y++) put(3, y, 7, "stone_bricks");
  put(3, top + 4, 7, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
