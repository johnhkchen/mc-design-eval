import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1076147141";
const W = 26, H = 38, D = 16;
const ROOF_Y = 26;   // roof level above lowest ground
const DECK_Y = 25;   // cornice / roof deck level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) foot.set(key(x, z), Math.round(gr));
}

const FACES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces missing a neighbour in the footprint.
function facesOf(x, z) {
  return Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !foot.has(key(x + dx, z + dz));
  });
}

// Assign each facade cell one face (first missing).
const faceOf = new Map();
const faceCount = { north: [], south: [], east: [], west: [] };
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  if (fs.length) {
    faceOf.set(k, fs[0]);
    const f = fs[0];
    const t = f === "north" || f === "south" ? x : z;
    faceCount[f].push({ x, z, t });
  }
}

// Front face = the one with most facade cells; door at its median bay.
let doorFace = "south", best = -1;
for (const f of Object.keys(faceCount)) {
  if (faceCount[f].length > best) { best = faceCount[f].length; doorFace = f; }
}
let doorKey = null;
if (faceCount[doorFace].length) {
  const sorted = [...faceCount[doorFace]].sort((a, b) => a.t - b.t);
  const mid = sorted[Math.floor(sorted.length / 2)];
  doorKey = key(mid.x, mid.z);
}

const STOREY_LINES = [5, 10, 15, 20];

for (const [k, ground] of foot) {
  const [x, z] = k.split(",").map(Number);
  const face = faceOf.get(k);
  const isFacade = face !== undefined;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  // Floor lines for this cell: its ground, then the global storey lines above it.
  const fl = [ground, ...STOREY_LINES.filter((f) => f > ground)];

  for (let i = 0; i < fl.length; i++) {
    const f = fl[i];
    const nf = fl[i + 1] ?? DECK_Y;
    const h = nf - f;
    if (h <= 0) continue;

    if (!isFacade) {
      // Interior: floor slab only, air between slabs (no interiors).
      put(x, f, z, "light_gray_concrete");
      continue;
    }

    const [dx, dz] = FACES[face];
    const t = face === "north" || face === "south" ? x : z;
    const pier = t % 3 === 0;

    for (let r = 0; r < h; r++) {
      const y = f + r;
      let id = null;
      let props;

      if (r === 0) {
        id = i === 0 ? "polished_andesite" : "light_gray_concrete";
      } else if (h < 5) {
        id = "white_concrete";
      } else if (r === h - 1) {
        id = "white_concrete";                 // spandrel band
      } else if (pier) {
        id = "white_concrete";                 // pilaster
      } else if (r === 1) {
        id = "smooth_quartz";                  // sill / frame
      } else {
        id = "light_blue_stained_glass";       // glazing
      }

      // Entrance on the front face, ground storey.
      if (i === 0 && k === doorKey && face === doorFace) {
        if (r === 1) { id = "dark_oak_door"; props = { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (r === 2) { id = "dark_oak_door"; props = { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else if (r === 3) { id = "light_gray_concrete"; }
      }

      put(x, y, z, id, props);
    }

    // Warm light behind some windows: glowstone one bay inside.
    for (let r = 2; r < h - 1; r++) {
      if (pier || r !== 2) continue;
      if ((t * 7 + i * 3) % 5 !== 0) continue;
      const ix = x - dx, iz = z - dz;
      const ik = key(ix, iz);
      if (foot.has(ik) && !faceOf.has(ik)) put(ix, f + r, iz, "glowstone");
    }
  }

  // Cornice and parapet on facade; roof deck inside.
  if (isFacade) {
    put(x, DECK_Y, z, "smooth_quartz");
    put(x, ROOF_Y, z, "white_concrete");
  } else {
    put(x, DECK_Y, z, "light_gray_concrete");
  }
}

// Rooftop plant on interior cells.
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  if (faceOf.has(k)) continue;
  // Water tank block in the middle of the roof.
  if (x >= 17 && x <= 20 && z >= 3 && z <= 6) {
    for (let y = ROOF_Y; y <= ROOF_Y + 2; y++) put(x, y, z, "white_concrete");
    continue;
  }
  // Small AC units spaced on the deck.
  if (x % 4 === 1 && z % 4 === 1) put(x, ROOF_Y, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
