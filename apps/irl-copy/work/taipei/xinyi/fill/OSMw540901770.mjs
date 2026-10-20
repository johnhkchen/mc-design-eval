import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540901770";
const W = 14, H = 23, D = 30;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const G = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const faces = (x, z) => ({
  N: !has(x, z - 1), // outward -z
  S: !has(x, z + 1), // outward +z
  W: !has(x - 1, z), // outward -x
  E: !has(x + 1, z), // outward +x
});
const inside = (x, z) => has(x, z) && !(faces(x, z).N || faces(x, z).S || faces(x, z).W || faces(x, z).E);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Roof level: flat roof slab at absolute y 10, parapet at 11 (about 11 above lowest ground).
// Cells that sit higher than that get their own roof slab just above their ground.
const levels = (gz) => {
  const RS = Math.max(10, gz + 1);
  const slabs = new Set([gz, RS]);
  if (gz + 5 < RS - 1) slabs.add(gz + 5); // storey line between the two storeys
  return { RS, slabs };
};

const pane = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const cellInfo = new Map();
const lights = [];

for (const [x, z, gr0] of cells) {
  const gz = gr0 - minG;
  const { RS, slabs } = levels(gz);
  const parapet = RS + 1;
  const f = faces(x, z);
  const perim = f.N || f.S || f.W || f.E;
  const ns = f.N || f.S;                 // face runs along x
  const corner = ns && (f.W || f.E);
  const bay = ns ? x : z;
  cellInfo.set(`${x},${z}`, { gz, RS, f });

  // Foundation up to the cell's own ground
  for (let y = 0; y < gz; y++) put(x, y, z, "polished_granite");

  // Floor slabs / storey lines / roof
  for (const y of slabs) put(x, y, z, y === RS ? "light_gray_concrete" : "smooth_quartz");

  if (!perim) {
    // Penthouse on the roof, interior cells only
    if (x >= 3 && x <= W - 4 && z >= 8 && z <= D - 9) {
      put(x, RS + 1, z, "light_gray_concrete");
      put(x, RS + 2, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior walls
  for (let y = gz + 1; y <= parapet; y++) {
    if (slabs.has(y)) continue;
    const rel = y - gz;
    if (y === parapet) {
      put(x, y, z, "quartz_block");
    } else if (corner) {
      put(x, y, z, rel === 1 ? "polished_granite" : rel === 4 ? "quartz_block" : "white_concrete");
    } else if (rel === 1) {
      put(x, y, z, "polished_granite"); // base course
    } else if (rel === 2 || rel === 3) {
      // ground storey shopfront: glass bays with white pillars
      if (bay % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(ns));
    } else if (rel === 4) {
      put(x, y, z, "quartz_block"); // frieze
    } else if (y === gz + 6 || y === RS - 1) {
      put(x, y, z, "quartz_block"); // upper spandrels
    } else {
      // upper storey window band
      if (bay % 3 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", pane(ns));
    }
  }

  // Warm light positions (placed after the walls, in the air gap behind glass)
  if (!corner && perim) {
    const dir = f.N ? [0, 1] : f.S ? [0, -1] : f.W ? [1, 0] : [-1, 0];
    const ix = x + dir[0], iz = z + dir[1];
    if (inside(ix, iz)) {
      if (bay % 3 === 1) lights.push({ kind: "lantern", x: ix, y: gz + 1, z: iz });
      if (bay % 6 === 1 && gz + 7 <= RS - 2) lights.push({ kind: "glow", x: ix, y: gz + 7, z: iz });
    }
  }
}

// Place interior lights
for (const l of lights) {
  if (l.kind === "lantern") put(l.x, l.y, l.z, "lantern", { hanging: "false", waterlogged: "false" });
  else put(l.x, l.y, l.z, "glowstone");
}

// Main entrance: street-side (south) face, nearest the middle of the footprint
let best = null;
for (const [x, z, gr0] of cells) {
  const f = faces(x, z);
  if (!f.S) continue;
  const d = Math.abs(x - Math.floor(W / 2));
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  const { gz } = cellInfo.get(`${best.x},${best.z}`);
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false", waterlogged: "false",
  });
  put(best.x, gz + 1, best.z, "dark_oak_door", doorProps("lower"));
  put(best.x, gz + 2, best.z, "dark_oak_door", doorProps("upper"));
  // Lantern above the door, on the frieze line, reads as an entrance light
  put(best.x, gz + 4, best.z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
