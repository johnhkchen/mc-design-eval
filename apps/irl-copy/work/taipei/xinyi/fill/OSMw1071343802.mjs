import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343802";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Levels (absolute y): ground storey 0-4, upper storey 5-9, cornice 10, roof/parapet 11.
const STOREY_LINE = 5;
const CORNICE = 10;
const ROOF = 11;

const gmap = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, Math.min(10, Math.max(0, Math.round(gr)))]));
const has = (x, z) => gmap.has(`${x},${z}`);
const gnd = (x, z) => gmap.get(`${x},${z}`);

// Entrance: middle of the north (z-min) exterior face.
const northU = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x);
const entU = new Set();
if (northU.length) {
  const mn = Math.min(...northU), mx = Math.max(...northU), mid = (mn + mx) / 2;
  for (const u of northU) if (Math.abs(u - mid) <= 1) entU.add(u);
}

function facade(face, u, y, gr, x) {
  // Cornice and storey line are continuous bands.
  if (y === CORNICE || y === STOREY_LINE) return "smooth_quartz";

  if (y < STOREY_LINE) {
    // Entrance doorway on the north face.
    if (face === "N" && entU.has(x)) {
      if (y <= gr + 2) return null; // open doorway
      if (y === gr + 3) return "smooth_quartz"; // door lintel
    }
    if (y === gr) return "stone_bricks"; // base course
    if (y === 4) return "smooth_quartz"; // fascia / transom
    if (u % 4 === 0) return "smooth_quartz"; // shopfront piers
    if (y === gr + 1 && u % 4 === 2) return "glowstone"; // warm display light
    return "light_blue_stained_glass"; // shopfront glazing
  }

  // Upper storey.
  if (y === 9) return "smooth_quartz"; // lintel band
  if (u % 3 === 0) return "white_concrete"; // piers
  const off = face === "N" ? 0 : 3;
  if (y === 7 && (u + off) % 5 === 1) return "shroomlight"; // lit window
  return "light_blue_stained_glass";
}

for (const [x, z] of cells) {
  const gr = gnd(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");

  if (faces.length) {
    // Exterior shell: facade from ground up to the cornice, then parapet.
    const face = faces[0];
    const u = (face === "N" || face === "S") ? x : z;
    for (let y = gr; y <= CORNICE; y++) {
      const b = facade(face, u, y, gr, x);
      if (b) g.set(x, y, z, b);
    }
    g.set(x, ROOF, z, "smooth_quartz"); // parapet
  } else {
    // Interior cell: floor slabs and roof deck only, no interior modelled.
    for (const y of [gr, STOREY_LINE, CORNICE]) {
      if (y >= gr) g.set(x, y, z, "smooth_stone");
    }
    g.set(x, ROOF, z, "light_gray_concrete"); // roof deck

    // Roof equipment on a few interior cells.
    if (x % 5 === 2 && z % 4 === 1) {
      g.set(x, 12, z, "light_gray_concrete");
      g.set(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
