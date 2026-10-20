import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001653.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001653.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 17, H = 25, D = 6;
const g = new Voxels([W, H, D]);

const k = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(k(x, z), { g: Math.round(gr), r: roof });

// Flat clean tiers: one roof level from the median lidar roof, four storeys of 3 blocks.
const gbase = Math.min(...[...map.values()].map(c => c.g));
const roofs = [...map.values()].map(c => c.r).sort((a, b) => a - b);
const top = Math.min(H - 6, Math.round(roofs[Math.floor(roofs.length / 2)]));
const levels = [gbase, gbase + 3, gbase + 6, gbase + 9].filter(L => L + 2 <= top - 2);

const inRange = y => y >= 0 && y < H;
const set = (x, y, z, id, props) => { if (inRange(y)) g.set(x, y, z, id, props); };
const cellsList = [...map.keys()].map(s => s.split(",").map(Number));

const paneEW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const paneNS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// 1) Foundations, shell walls, floor slabs, cornice and roof deck per cell.
for (const [x, z] of cellsList) {
  const { g: gr } = map.get(k(x, z));
  const N = !map.has(k(x, z - 1)), S = !map.has(k(x, z + 1));
  const Wf = !map.has(k(x - 1, z)), E = !map.has(k(x + 1, z));
  const edge = N || S || Wf || E;

  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");
  if (edge) for (let y = gr; y <= top - 2; y++) set(x, y, z, "bricks");
  for (const L of levels) if (L >= gr) set(x, L, z, edge ? "smooth_stone" : "spruce_planks");
  if (gr <= top - 1) set(x, top - 1, z, edge ? "smooth_stone" : "stone_bricks");
}

// 2) Recessed windows on the street faces: opening in the wall, glass one block in,
//    lit rooms behind some panes.
for (const [x, z] of cellsList) {
  const { g: gr } = map.get(k(x, z));
  const onN = z === 0 && !map.has(k(x, z - 1));
  const onS = z === D - 1 && !map.has(k(x, z + 1));
  if (!(onN || onS)) continue;
  if (x % 2 !== 1 || x <= 0 || x >= W - 1) continue; // piers at even x, corners plain
  const dz = onN ? 1 : -1;      // glass plane one block inside the wall
  const zg = z + dz;
  const zl = z + 2 * dz;        // lamp room behind the glass
  levels.forEach((L, si) => {
    for (const y of [L + 1, L + 2]) {
      if (y < gr || y > top - 2) continue;
      set(x, y, z, "air");
      set(x, y, zg, "glass_pane", paneEW);
    }
    if (si % 2 === 0 && x % 4 === 3 && L + 1 >= gr && L + 1 <= top - 2) {
      set(x, L + 1, zl, "glowstone");
    }
  });
}

// 3) Windows on the party walls (x=0 and x=W-1) at z=2 and z=3, recessed the same way.
for (const [x, z] of cellsList) {
  if (z !== 2 && z !== 3) continue;
  const isW = x === 0 && !map.has(k(x - 1, z));
  const isE = x === W - 1 && !map.has(k(x + 1, z));
  if (!(isW || isE)) continue;
  const { g: gr } = map.get(k(x, z));
  const dx = isW ? 1 : -1;
  const xg = x + dx;
  const xl = x + 2 * dx;
  levels.forEach((L, si) => {
    for (const y of [L + 1, L + 2]) {
      if (y < gr || y > top - 2) continue;
      set(x, y, z, "air");
      set(xg, y, z, "glass_pane", paneNS);
    }
    if (si % 2 === 1 && z === 2 && L + 1 >= gr && L + 1 <= top - 2) {
      set(xl, L + 1, z, "glowstone");
    }
  });
}

// 4) Entrance on the north street face at x=8: recessed oak door, stone lintel.
const door = map.get(k(8, 0));
if (door) {
  const dg = door.g;
  set(8, dg, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  set(8, dg + 1, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  set(8, dg + 2, 0, "smooth_stone");
}

// 5) Roof chimneys on interior roof cells.
for (const [x, z] of [[4, 2], [12, 3]]) {
  if (!map.has(k(x, z))) continue;
  set(x, top, z, "bricks");
  set(x, top + 1, z, "bricks");
  set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(OUT);
