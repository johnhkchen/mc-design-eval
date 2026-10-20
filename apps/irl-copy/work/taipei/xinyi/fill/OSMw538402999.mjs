import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402999";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

// Bounds-checked setter; props optional
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Edge / corner / face helpers
const faces = (x, z) => ({
  N: !has(x, z - 1), // north face (missing z-1)
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isEdge = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };
const isCorner = (x, z) => { const f = faces(x, z); return (f.N || f.S) && (f.W || f.E); };

// Choose one entrance on the north face, nearest the middle
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const f = faces(x, z);
    if (!f.N || isCorner(x, z)) continue;
    const d = Math.abs(x - 12.5);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

// Pass 1: foundation, floors, walls, roof, plant
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const edge = f.N || f.S || f.W || f.E;
  const corner = isCorner(x, z);

  // Foundation up to ground line, then ground floor surface slab
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "light_gray_concrete");

  if (!edge) {
    // Interior: storey slabs at +5 and roof deck at +10, air elsewhere
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    // Roof plant box on the roof deck
    if (x >= 9 && x <= 13 && z >= 7 && z <= 11) {
      put(x, gr + 11, z, "stone_bricks");
      put(x, gr + 12, z, "stone_bricks");
    }
    continue;
  }

  // Edge walls. Facade index runs along the face: x on N/S faces, z on W/E faces.
  const alongX = f.N || f.S;
  const idx = alongX ? x : z;
  const pier = corner || idx % 4 === 0;
  const isDoor = `${x},${z}` === doorKey;

  for (let k = 1; k <= 11; k++) {
    const y = gr + k;
    let b = null, p = null;

    switch (k) {
      case 1: b = "polished_andesite"; break;                 // base course
      case 2: case 3:                                           // shopfront
      case 7: case 8:                                           // upper windows
        b = pier ? "white_concrete" : "glass_pane";
        if (b === "glass_pane") {
          p = alongX
            ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
            : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        }
        break;
      case 4: case 5: case 10: b = "smooth_quartz"; break;     // storey lines and cornice
      case 6: case 9: case 11: b = "light_gray_concrete"; break; // spandrels and parapet
    }

    // Entrance: door on k=1..2, lintel at k=3
    if (isDoor && f.N) {
      if (k === 1) { b = "oak_door"; p = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
      if (k === 2) { b = "oak_door"; p = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
      if (k === 3) { b = "smooth_quartz"; p = null; }
    }

    if (b) put(x, y, z, b, p);
  }
}

// Pass 2: warm lights set behind glass, in the interior air next to the facade
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z) || isCorner(x, z)) continue;
  const f = faces(x, z);
  const key = `${x},${z}`;
  if (key === doorKey) continue;

  // Inward offset from the facade
  let dx = 0, dz = 0;
  if (f.N) dz = 1; else if (f.S) dz = -1; else if (f.W) dx = 1; else if (f.E) dx = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const ig = G.get(`${ix},${iz}`);

  const idx = (f.N || f.S) ? x : z;
  // Upper-floor glowstone behind some windows
  if (idx % 8 === 2) put(ix, ig + 7, iz, "glowstone");
  // Ground-floor shroomlight behind some shopfront glass
  if (idx % 6 === 1) put(ix, ig + 2, iz, "shroomlight");
}

g.save(`${DIR}/${ID}.nbt`);
