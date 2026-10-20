import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540891055";
const W = 19, H = 23, D = 12;

// Materials: two-storey 1990s Taipei commercial block, pale tiled concrete,
// dark stone base, blue-tinted glazing, quartz cornice, warm light behind glass.
const FOUND = "stone_bricks";
const BASE = "polished_andesite";
const WALL = "white_concrete";
const PIER = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const LINE = "light_gray_concrete";
const CORNICE = "quartz_block";
const ROOF = "light_gray_concrete";
const SLAB = "smooth_stone";
const GLOW = "glowstone";
const CANOPY = "smooth_stone";

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};
const OPP = { north: "south", south: "north", west: "east", east: "west" };

// ---- read footprint cells: [x, z, ground] ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}

const key = (x, z) => `${x},${z}`;
const inF = (x, z) => ground.has(key(x, z));
const gAt = (x, z) => ground.get(key(x, z));
const faces = (x, z) =>
  Object.keys(DIRS).filter(([dx, dz]) => false || true)
    .filter((n) => {
      const [dx, dz] = DIRS[n];
      return !inF(x + dx, z + dz);
    });
const along = (x, z, f) => (f === "north" || f === "south" ? x : z);
const isRing = (x, z) => faces(x, z).length > 0;

const g = new Voxels([W, H, D]);
const set = (x, y, z, b) => {
  if (y < 0 || y >= H) return;
  g.set(x, y, z, b);
};

// ---- pass 1: foundations, floors, walls, windows, cornice ----
const glassFaceCell = new Map(); // key -> face name where a glass window sits
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);

  for (let y = 0; y < gr; y++) set(x, y, z, FOUND);

  if (fs.length === 0) {
    // interior: floor slabs, air gap, roof deck
    set(x, gr, z, SLAB);
    if (gr + 5 <= 8) set(x, gr + 5, z, SLAB);
    set(x, 10, z, ROOF);
    continue;
  }

  // exterior ring cell: decide glass vs pier from its exterior faces
  let glassHere = false;
  for (const f of fs) {
    if (along(x, z, f) % 3 !== 0) {
      glassHere = true;
      glassFaceCell.set(k, f);
      break;
    }
  }

  for (let y = gr; y <= 9; y++) {
    const winBand = (y >= gr + 1 && y <= gr + 3) || (y >= gr + 6 && y <= gr + 8);
    if (y === gr) set(x, y, z, BASE);
    else if (y === gr + 5 || y === gr + 9) set(x, y, z, LINE);
    else if (winBand) set(x, y, z, glassHere ? GLASS : PIER);
    else set(x, y, z, WALL);
  }
  set(x, 10, z, CORNICE);
}

// ---- pass 2: entrance on the exterior face with the most cells ----
const faceCount = {};
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (const f of faces(x, z)) faceCount[f] = (faceCount[f] || 0) + 1;
}
const doorFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
if (doorFace) {
  const cells = [];
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (faces(x, z).includes(doorFace)) cells.push([x, z]);
  }
  cells.sort((a, b) => along(a[0], a[1], doorFace) - along(b[0], b[1], doorFace));
  const mid = cells[Math.floor(cells.length / 2)];
  const [mx, mz] = mid;
  const gr = gAt(mx, mz);
  const midAlong = along(mx, mz, doorFace);

  // door, lower and upper halves
  g.set(mx, gr + 1, mz, "dark_oak_door", {
    facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(mx, gr + 2, mz, "dark_oak_door", {
    facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false",
  });

  // canopy over the door (three ring cells at lintel-above level)
  for (const [x, z] of cells) {
    if (Math.abs(along(x, z, doorFace) - midAlong) <= 1) set(x, gr + 3, z, CANOPY);
  }
}

// ---- pass 3: warm lights behind some windows, inside the air gap ----
for (const [k, f] of glassFaceCell) {
  const [x, z] = k.split(",").map(Number);
  const gr = gAt(x, z);
  if (along(x, z, f) % 6 !== 1) continue;
  const [dx, dz] = DIRS[OPP[f]]; // inward step
  const ix = x + dx, iz = z + dz;
  if (!inF(ix, iz) || isRing(ix, iz)) continue;
  set(ix, gr + 2, iz, GLOW);
  if (gr + 7 <= 9) set(ix, gr + 7, iz, GLOW);
}

// ---- pass 4: roof equipment on the interior roof deck ----
const interiorRoof = (x, z) => inF(x, z) && !isRing(x, z);
for (let x = 7; x <= 11; x++) {
  for (let z = 4; z <= 7; z++) {
    if (interiorRoof(x, z)) {
      set(x, 11, z, ROOF);
      set(x, 12, z, ROOF);
    }
  }
}
for (const [x, z] of [[3, 2], [4, 2], [3, 3]]) {
  if (interiorRoof(x, z)) set(x, 11, z, "iron_block");
}
if (interiorRoof(9, 5)) {
  set(9, 13, 5, "lightning_rod");
  set(9, 14, 5, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
