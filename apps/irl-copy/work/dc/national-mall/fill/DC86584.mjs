import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 905 16th St NW: 1960s-70s Commercial-Office-Large, ~8 storeys on a granite-based
// stone and glass grid. Roof is ~17 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86584";
const W = 21, H = 29, D = 13;
const MAX_TOP = H - 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  raw.set(key(x, z), {
    x, z,
    gr: Math.max(0, Math.min(H - 6, Math.round(ground))),
    roofRaw: Number(roof),
  });
}
const has = (x, z) => raw.has(key(x, z));
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

// Median of the 3x3 neighbourhood removes single-cell lidar spikes.
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
for (const c of raw.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(c.x + dx, c.z + dz));
    if (o) vals.push(o.roofRaw);
  }
  c.top = Math.min(MAX_TOP, Math.max(c.gr + 6, Math.round(median(vals))));
}
// Second pass: no cell may stand more than 2 blocks above its lowest neighbour
// (stops residual spikes from the median pass).
for (let pass = 0; pass < 2; pass++) {
  for (const c of raw.values()) {
    let lo = Infinity;
    for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const o = raw.get(key(c.x + dx, c.z + dz));
      if (o) lo = Math.min(lo, o.top);
    }
    if (lo !== Infinity && c.top > lo + 2) c.top = lo + 2;
  }
}

const minZ = Math.min(...[...raw.values()].map(c => c.z));
const doorX = Math.floor(W / 2);

const STONE = "polished_andesite";
const SPANDREL = "light_gray_concrete";
const PIER = "white_concrete";
const GLASS = "light_blue_stained_glass";
const FLOOR = "light_gray_concrete";
const ROOF = "gray_concrete";
const CORNICE = "smooth_stone";

// Bay grid: piers every third block along each face, oriented to the face.
// Faces running along x (north/south) use x; faces along z (east/west) use z.
const isPierCell = (x, z, face) => (face === "ns" ? (x % 3 === 0) : (z % 3 === 0));

for (const c of raw.values()) {
  const { x, z, gr, top } = c;
  const perim = isPerim(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, STONE);

  const F = [gr];
  for (let b = gr + 3; b < top; b += 2) F.push(b);

  // Which face does this perimeter cell sit on?
  let face = null, inward = null;
  if (perim) {
    if (!has(x - 1, z)) { face = "ew"; inward = [x + 1, z]; }
    else if (!has(x + 1, z)) { face = "ew"; inward = [x - 1, z]; }
    else if (!has(x, z - 1)) { face = "ns"; inward = [x, z + 1]; }
    else if (!has(x, z + 1)) { face = "ns"; inward = [x, z - 1]; }
  }

  for (let y = gr; y < top; y++) {
    let s = 0;
    for (let i = 0; i < F.length; i++) if (F[i] <= y) s = i;
    const isGroundFloor = s === 0;
    const isFloorLine = F.includes(y);

    if (!perim) {
      if (isFloorLine) g.set(x, y, z, FLOOR);
      if (y === top - 1) g.set(x, y, z, ROOF);
      continue;
    }

    if (y === top - 1) { g.set(x, y, z, CORNICE); continue; }

    if (isFloorLine) {
      g.set(x, y, z, isGroundFloor ? STONE : SPANDREL);
      continue;
    }

    if (isPierCell(x, z, face)) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, GLASS);

    // Entrance: recessed doors on the centre of the front face at grade.
    if (isGroundFloor && z === minZ && x === doorX) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    }
  }

  // Door upper half and stone lintel/canopy over it.
  if (perim && z === minZ && x === doorX && gr + 1 < top) {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
  if (perim && z === minZ && Math.abs(x - doorX) <= 2 && gr + 2 < top) {
    g.set(x, gr + 2, z, CORNICE);
  }

  if (perim) g.set(x, top, z, CORNICE);
  else g.set(x, top - 1, z, ROOF);

  // Warm lamps behind some front windows, in the air gap next to the glass.
  if (perim && inward && has(inward[0], inward[1]) && !isPerim(inward[0], inward[1])) {
    const ic = raw.get(key(inward[0], inward[1]));
    for (const f of F) {
      const row = f + 1;
      if (row >= ic.top - 1) continue;
      if (((x * 7 + f * 3 + z) % 4) === 0) {
        g.set(inward[0], row, inward[1], (f === gr) ? "shroomlight" : "glowstone");
      }
    }
  }
}

// Rooftop mechanical penthouse in the middle of the roof, low and clean.
for (const c of raw.values()) {
  const { x, z, top } = c;
  if (isPerim(x, z)) continue;
  if (x < 8 || x > 12 || z < 4 || z > 8) continue;
  for (let y = top; y <= top + 1 && y < H; y++) {
    g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, top + 2 < H ? top + 2 : top + 1, z, CORNICE);
}

g.save(`${DIR}/${ID}.nbt`);
