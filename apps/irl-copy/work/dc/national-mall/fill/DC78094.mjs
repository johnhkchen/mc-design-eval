import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC78094.cells.json`, "utf8"));

const W = 18, H = 32, D = 30;
const g = new Voxels([W, H, D]);

// ---- Raw per-cell data ----
const raw = new Map();
let gBase = Infinity;
for (const [x, z, gr, rf] of cells) {
  raw.set(`${x},${z}`, { g: Math.round(gr), rf: Math.round(rf) });
  gBase = Math.min(gBase, Math.round(gr));
}
const inside = (x, z) => raw.has(`${x},${z}`);
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const zEdge = (x, z) => !inside(x, z - 1) || !inside(x, z + 1);   // face runs along x
const xEdge = (x, z) => !inside(x - 1, z) || !inside(x + 1, z);   // face runs along z

// ---- Smooth roof heights: median of 3x3 neighbourhood, then clean 3-block storeys ----
const cell = new Map();
for (const [key, v] of raw) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const n = raw.get(`${x + dx},${z + dz}`);
      if (n) vals.push(n.rf);
    }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let top = Math.round(med / 3) * 3;
  top = Math.max(top, v.g + 6);
  top = Math.min(top, H - 4);
  cell.set(key, { g: v.g, top });
}
const maxTop = Math.max(...[...cell.values()].map(c => c.top));

// ---- Entrance: centre bay of the lowest street-side (min z) face ----
const zmin = Math.min(...cells.map(c => c[1]));
let doorX = Math.floor(W / 2);
for (let off = 0; off < W; off++) {
  const cands = [Math.floor(W / 2) + off, Math.floor(W / 2) - off];
  const hit = cands.find(x => inside(x, zmin) && zEdge(x, zmin));
  if (hit !== undefined) { doorX = hit; break; }
}
const doorZ = zmin;

// ---- Facade ----
function facadeBlock(x, y, z, gr, top) {
  const isDoor = x === doorX && z === doorZ;
  if (isDoor && (y === gr || y === gr + 1)) {
    g.set(x, y, z, "oak_door", {
      facing: "north",
      half: y === gr ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
    return;
  }
  if (y === gr) { g.set(x, y, z, "stone_bricks"); return; }            // base course
  if (y === top - 1) { g.set(x, y, z, "white_concrete"); return; }     // cornice band
  if (y % 3 === 0) { g.set(x, y, z, "smooth_quartz"); return; }        // storey belt
  if (isDoor && y === gr + 2) { g.set(x, y, z, "smooth_quartz"); return; } // door lintel
  const alongX = zEdge(x, z) && !xEdge(x, z);
  const corner = zEdge(x, z) && xEdge(x, z);
  if (corner) { g.set(x, y, z, "smooth_quartz"); return; }            // quoins
  const along = alongX ? x : z;
  if (along % 3 === 0) { g.set(x, y, z, "white_concrete"); return; }  // mullion frames
  g.set(x, y, z, "light_blue_stained_glass_pane", {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  });
}

// ---- Build columns ----
for (const [key, { g: gr, top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const p = perim(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    if (p) facadeBlock(x, y, z, gr, top);
    else if (y === top - 1) g.set(x, y, z, "stone");
    else if (y % 3 === 0) g.set(x, y, z, "smooth_quartz");
  }

  if (p) g.set(x, top, z, "smooth_quartz");   // parapet cap
}

// ---- One clean penthouse on the tallest central cells ----
for (const [key, { top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (perim(x, z) || top !== maxTop) continue;
  if (x < 5 || x > W - 6 || z < 6 || z > D - 7) continue;
  g.set(x, top, z, "light_gray_concrete");
  if (x >= 7 && x <= W - 8 && z >= 9 && z <= D - 10) {
    g.set(x, top + 1, z, "light_gray_concrete");
  }
}

// ---- Warm light behind some windows ----
for (const [key, { g: gr, top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!perim(x, z) || (zEdge(x, z) && xEdge(x, z))) continue;
  for (let y = gr + 1; y < top - 1; y++) {
    if (y % 3 === 0) continue;
    if (x === doorX && z === doorZ) continue;
    const along = zEdge(x, z) ? x : z;
    if (along % 3 === 0) continue;
    if ((x * 7 + y * 5 + z * 3) % 9 !== 0) continue;
    let dx = 0, dz = 0;
    if (!inside(x, z - 1)) dz = 1; else if (!inside(x, z + 1)) dz = -1;
    if (!inside(x - 1, z)) dx = 1; else if (!inside(x + 1, z)) dx = -1;
    const ix = x + dx, iz = z + dz;
    if (inside(ix, iz) && !perim(ix, iz)) g.set(ix, y, iz, "glowstone");
  }
}

// ---- Entrance lanterns flanking the door ----
{
  const dg = cell.get(`${doorX},${doorZ}`);
  if (dg) {
    for (const dxo of [-1, 1]) {
      const lx = doorX + dxo;
      if (inside(lx, doorZ) && perim(lx, doorZ)) {
        const yy = dg.g + 2;
        g.set(lx, yy, doorZ, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/DC78094.nbt`);
