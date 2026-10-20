import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Jay Street transit/utility substation: one storey of brick on a stone plinth,
// stone cornice, glass bays with stone sills, a steel service door with a
// stone lintel on the street end, and a small rooftop ventilation plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395524";
const W = 7, H = 15, D = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr, ro] of cells) foot.set(key(x, z), { x, z, gr: Math.round(gr), ro: Math.round(ro) });
const has = (x, z) => foot.has(key(x, z));

// Flat, clean roof tier: median lidar roof, but never lower than 4 blocks over the highest ground.
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)];
const maxGr = Math.max(...cells.map(c => Math.round(c[2])));
const R = Math.min(12, Math.max(med, maxGr + 4));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Door cell: street-end perimeter cell nearest the middle of the frontage.
let doorCell = null;
{
  let best = Infinity;
  for (const c of foot.values()) {
    if (!has(c.x, c.z + 1) && Math.abs(c.x - 3) < best) { best = Math.abs(c.x - 3); doorCell = { ...c, facing: "south" }; }
  }
  if (!doorCell) {
    for (const c of foot.values()) {
      if (!has(c.x, c.z - 1) && Math.abs(c.x - 3) < best) { best = Math.abs(c.x - 3); doorCell = { ...c, facing: "north" }; }
    }
  }
}

const zs = cells.map(c => c[1]);
const zc = (Math.min(...zs) + Math.max(...zs)) / 2;

for (const c of foot.values()) {
  const { x, z, gr } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  put(x, gr, z, "stone_bricks");

  const missing = [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)];
  const nMissing = missing.filter(Boolean).length;
  const perim = nMissing > 0;
  const corner = nMissing >= 2;

  if (!perim) {
    put(x, R - 1, z, "stone_bricks");
    continue;
  }

  // Position along the facade drives the bay rhythm.
  const along = (missing[0] || missing[1]) ? z : x;

  const topRow = R - gr - 1; // cornice row
  for (let r = 1; r <= topRow; r++) {
    const y = gr + r;
    if (r === topRow) { put(x, y, z, "smooth_stone"); continue; }

    const isDoorCell = doorCell && doorCell.x === x && doorCell.z === z;
    if (isDoorCell && r <= 2) {
      const props = { facing: doorCell.facing, hinge: "left", open: "false", powered: "false" };
      put(x, y, z, "iron_door", { ...props, half: r === 1 ? "lower" : "upper" });
      continue;
    }
    if (isDoorCell && r === 3 && topRow > 3) {
      // Stone lintel over the service door.
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    const windowRow = r <= topRow - 1;
    const bay = !corner && along % 3 !== 0;
    if (bay && windowRow) {
      if (r === 1) { put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; } // sill
      // Warm light in roughly one bay in seven, glass everywhere else.
      const lit = ((x * 5 + z * 3 + r) % 7) === 0 && r === 2;
      put(x, y, z, lit ? "glowstone" : "glass_pane");
      continue;
    }
    // Piers and wall between bays: a stone-brick pilaster on corners, brick elsewhere.
    put(x, y, z, corner ? "stone_bricks" : "bricks");
  }
}

// Compact rooftop ventilation plant on the interior roof: a 2x2 plinth,
// a grille stack and a short chain-less vent. Stands on the roof deck.
for (const c of foot.values()) {
  const { x, z } = c;
  const interior = [!has(x - 1, z), !has(x + 1, z), !has(x, z - 1), !has(x, z + 1)].every(v => !v);
  if (!interior) continue;
  if ((x === 2 || x === 3) && (z === Math.floor(zc) || z === Math.floor(zc) + 1)) {
    put(x, R, z, "stone_bricks");
    if (x === 2 && z === Math.floor(zc)) {
      put(x, R + 1, z, "iron_bars");
      put(x, R + 2, z, "iron_bars");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
