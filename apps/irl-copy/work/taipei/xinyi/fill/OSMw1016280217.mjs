import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280217";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 20, H = 33, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup
const S = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  const k = `${x},${z}`;
  S.add(k);
  ground.set(k, gr);
}
const has = (x, z) => S.has(`${x},${z}`);
const parse = (k) => k.split(",").map(Number);

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const ORDER = ["south", "north", "east", "west"];
const exposed = (x, z, f) => !has(x + DIRS[f][0], z + DIRS[f][1]);

// Primary exposed face per footprint cell (corners pick one face)
const wallFace = new Map();
for (const k of S) {
  const [x, z] = parse(k);
  const f = ORDER.find((face) => exposed(x, z, face));
  if (f) wallFace.set(k, f);
}

// Front (entrance) face: south if exposed, else first available
const faceSet = new Set(wallFace.values());
const front = ORDER.find((f) => faceSet.has(f)) ?? "south";
const frontTs = [];
for (const [k, f] of wallFace) {
  if (f !== front) continue;
  const [x, z] = parse(k);
  frontTs.push((front === "north" || front === "south") ? x : z);
}
frontTs.sort((a, b) => a - b);
const mid = frontTs.length ? frontTs[Math.floor(frontTs.length / 2)] : -1;

// Storeys: ground storey rows 1..4, upper storeys 6..9, 11..14, 16..19.
// Floor slabs at y = 5, 10, 15, 20 (20 is roof deck), parapet at 21.
for (const k of S) {
  const [x, z] = parse(k);
  const gr = ground.get(k);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "polished_granite");

  for (let y = Math.max(gr, 0); y <= 20; y++) {
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y % 5 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }

    const f = wallFace.get(k);
    if (!f) continue; // interior air behind glass

    const s = y % 5;
    const st = Math.floor(y / 5);
    const [dx, dz] = DIRS[f];
    const t = (f === "north" || f === "south") ? x : z;
    const pillar = t % 3 === 0;
    const isEntr = f === front && t === mid;
    let glass = false;

    if (st === 0) {
      if (s === 1) {
        g.set(x, y, z, "polished_granite");
      } else if (s === 4) {
        g.set(x, y, z, "smooth_quartz");
      } else if (isEntr) {
        g.set(x, y, z, "dark_oak_door", {
          facing: f,
          half: s === 2 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
        glass = true;
      }
      // warm light behind some shopfront glass
      if (glass && (s === 2) && (t % 2 === 0)) {
        const ix = x - dx, iz = z - dz;
        const ik = `${ix},${iz}`;
        if (has(ix, iz) && !wallFace.has(ik)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      if (s === 1) {
        g.set(x, y, z, "white_concrete"); // sill
      } else if (s === 4) {
        g.set(x, y, z, "white_concrete"); // lintel
      } else if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
        glass = true;
      }
      if (glass && s === 2 && ((t + st) % 3 === 0)) {
        const ix = x - dx, iz = z - dz;
        const ik = `${ix},${iz}`;
        if (has(ix, iz) && !wallFace.has(ik)) g.set(ix, y, iz, "shroomlight");
      }
    }
  }

  // Parapet cap on the perimeter
  if (wallFace.has(k) && gr <= 21) {
    g.set(x, 21, z, "smooth_quartz");
  }
}

// Roof plant room in the middle of the footprint
for (const k of S) {
  const [x, z] = parse(k);
  if (wallFace.has(k)) continue;
  if (x >= 6 && x <= 11 && z >= 6 && z <= 11) {
    for (let y = 21; y <= 23; y++) g.set(x, y, z, "light_gray_concrete");
  }
}

// Mast on the plant room
if (has(9, 9) && !wallFace.has("9,9")) {
  g.set(9, 24, 9, "lightning_rod");
  g.set(9, 25, 9, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
