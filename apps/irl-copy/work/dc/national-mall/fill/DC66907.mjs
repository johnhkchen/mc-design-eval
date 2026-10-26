import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66907.cells.json`, "utf8"));

const W = 13, HT = 32, D = 19;
const g = new Voxels([W, HT, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= HT) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, rf] of cells) {
  info.set(key(x, z), { g: Math.max(0, Math.round(gr)), r: rf });
}

// One shared storey datum for the whole building, so floor lines line up on every face.
const G0 = Math.min(...[...info.values()].map((v) => v.g));
const maxGround = Math.max(...[...info.values()].map((v) => v.g));

// Flat, smoothed roof tier from the lidar median.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
let TOP = Math.round(roofs[Math.floor(roofs.length / 2)]);
TOP = Math.max(TOP, maxGround + 8);
TOP = Math.min(TOP, 28);

const faceOf = (x, z) => {
  const f = [];
  if (!info.has(key(x, z - 1))) f.push("north");
  if (!info.has(key(x, z + 1))) f.push("south");
  if (!info.has(key(x + 1, z))) f.push("east");
  if (!info.has(key(x - 1, z))) f.push("west");
  return f;
};

const inward = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// Entrance: a north-facing cell on the lowest ground, nearest the middle of the front.
const midX = (W - 1) / 2;
let entrance = null;
{
  const cands = [];
  for (const [k, v] of info) {
    const [x, z] = k.split(",").map(Number);
    if (faceOf(x, z).includes("north")) cands.push({ x, z, g: v.g });
  }
  cands.sort((a, b) =>
    (a.g - G0) - (b.g - G0) || Math.abs(a.x - midX) - Math.abs(b.x - midX));
  entrance = cands[0] ?? null;
}

for (const [k, v] of info) {
  const [x, z] = k.split(",").map(Number);
  const gr = v.g;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = faceOf(x, z);
  const isEdge = faces.length > 0;
  const face = faces[0];

  if (isEdge) {
    const alongNS = face === "north" || face === "south";
    const a = alongNS ? x : z;
    for (let y = gr; y < TOP; y++) {
      const rel = y - G0;
      if (y === TOP - 1) { put(x, y, z, "smooth_stone"); continue; } // cornice
      if (y === gr) { put(x, y, z, "polished_granite"); continue; }  // base course
      if (rel % 4 === 0) { put(x, y, z, "calcite"); continue; }      // floor line
      const shop = rel < 4; // ground-floor shopfront band
      const isGlass = a % 2 === 1;
      if (isGlass) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, shop ? "polished_andesite" : "calcite");
    }

    if (entrance && x === entrance.x && z === entrance.z) {
      const base = Math.max(gr, G0);
      // Door sits on the floor at the cell's own ground level.
      put(x, gr + 1, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 2, z, "dark_oak_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 3, z, "polished_andesite"); // lintel
      void base;
    }
  } else {
    // Interior: floor slabs on the shared datum and a roof membrane; air between.
    for (let y = gr; y < TOP; y++) {
      if (y === TOP - 1) put(x, y, z, "gray_concrete");
      else if ((y - G0) % 4 === 0) put(x, y, z, "smooth_stone");
    }
  }
}

// Warm lights: a sparse set of glowstone behind some windows, in the air gap.
for (const [k, v] of info) {
  const [x, z] = k.split(",").map(Number);
  const faces = faceOf(x, z);
  if (faces.length === 0) continue;
  const face = faces[0];
  const alongNS = face === "north" || face === "south";
  const a = alongNS ? x : z;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!info.has(key(ix, iz))) continue;
  const gi = info.get(key(ix, iz)).g;
  for (let y = Math.max(v.g, gi) + 1; y < TOP - 2; y++) {
    const rel = y - G0;
    if (rel % 8 === 2 && a % 4 === 1) {
      // only where the inner cell is itself an air gap (not a floor slab)
      if (faceOf(ix, iz).length === 0 && (y - G0) % 4 !== 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// Central mechanical penthouse on the flat roof, with a glazed ring.
for (let x = 4; x <= 8; x++) {
  for (let z = 5; z <= 13; z++) {
    if (!info.has(key(x, z))) continue;
    const ring = x === 4 || x === 8 || z === 5 || z === 13;
    put(x, TOP, z, ring ? "gray_stained_glass" : "light_gray_concrete");
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "smooth_stone");
  }
}

// One rooftop unit, on the roof membrane.
if (info.has(key(10, 15))) put(10, TOP, 15, "iron_block");

g.save(`${DIR}/DC66907.nbt`);
