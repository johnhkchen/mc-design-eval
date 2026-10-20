import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Late-20th-century Taipei commercial/office tower, about 14 storeys of 5 blocks.
// Light grey concrete frame with pilasters, dark spandrels, blue-tinted glass,
// a shopfront with an awning and entrance on the ground floor, two setbacks,
// and a plant/mechanical penthouse with louvres and a lightning-rod mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145095";
const W = 45, H = 81, D = 55;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const vkey = (x, y, z) => `${x},${y},${z}`;

const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), gr);
}
const inFoot = (x, z) => ground.has(key(x, z));

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Edge distance: 1 on the outermost footprint cells, increasing inward.
const edge = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some((d) => !inFoot(x + d.dx, z + d.dz))) {
    edge.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = edge.get(key(x, z));
  for (const dd of DIRS) {
    const nx = x + dd.dx, nz = z + dd.dz, nk = key(nx, nz);
    if (inFoot(nx, nz) && !edge.has(nk)) {
      edge.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
// Outside the footprint counts as 0; unreached cells as deep interior.
const E = (x, z) => (inFoot(x, z) ? edge.get(key(x, z)) ?? 99 : 0);

// Direction toward the exterior of a footprint cell.
function outDir(x, z) {
  const e = E(x, z);
  for (const d of DIRS) if (E(x + d.dx, z + d.dz) < e) return d;
  return null;
}

// Setback tiers: body to 35, setback to 60, upper setback to 69, mech penthouse to 75.
const TIERS = [
  { inset: 0, y0: 0, y1: 35, kind: "office" },
  { inset: 6, y0: 35, y1: 60, kind: "office" },
  { inset: 12, y0: 60, y1: 69, kind: "office" },
  { inset: 18, y0: 69, y1: 75, kind: "mech" },
];

function tierAt(e, y) {
  for (const t of TIERS) if (y >= t.y0 && y < t.y1 && e >= t.inset) return t;
  return null;
}

const paneProps = (dir) => {
  const ew = dir.name === "north" || dir.name === "south"; // wall runs east-west
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
};

// Overrides: entrance, shopfront awning, portal lintel, lit windows, antenna.
const overrides = new Map();

// Entrance: lowest-ground exterior cell nearest the footprint centroid.
const ringCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => E(x, z) === 1 && outDir(x, z));
let mx = 0, mz = 0;
for (const k of ground.keys()) { const [x, z] = k.split(",").map(Number); mx += x; mz += z; }
mx /= ground.size; mz /= ground.size;
ringCells.sort((a, b) => {
  const ga = ground.get(key(a[0], a[1])), gb = ground.get(key(b[0], b[1]));
  if (ga !== gb) return ga - gb;
  return Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz);
});
if (ringCells.length) {
  const [ex, ez] = ringCells[0];
  const dir = outDir(ex, ez);
  const gr = ground.get(key(ex, ez));
  const lat = dir.name === "north" || dir.name === "south" ? { dx: 1, dz: 0 } : { dx: 0, dz: 1 };
  const doorProps = (half) => ({ facing: dir.name, half, hinge: "left", open: "false", powered: "false" });
  overrides.set(vkey(ex, gr, ez), ["dark_oak_door", doorProps("lower")]);
  overrides.set(vkey(ex, gr + 1, ez), ["dark_oak_door", doorProps("upper")]);
  // Portal lintel over the entrance bay and an awning across the shopfront above it.
  for (let l = -2; l <= 2; l++) {
    const lx = ex + l * lat.dx, lz = ez + l * lat.dz;
    if (inFoot(lx, lz) && E(lx, lz) === 1) overrides.set(vkey(lx, gr + 2, lz), ["white_concrete"]);
  }
  for (let l = -3; l <= 3; l++) {
    const lx = ex + l * lat.dx, lz = ez + l * lat.dz;
    if (inFoot(lx, lz) && E(lx, lz) === 1) overrides.set(vkey(lx, gr + 3, lz), ["polished_andesite"]);
  }
}

// Warm lights behind some glass (interior cells one step in from the pane, on the band-2 row).
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const e = E(x, z);
  const dir = outDir(x, z);
  if (!dir) continue;
  for (const t of TIERS) {
    if (t.kind === "mech") continue;
    const ringE = Math.max(t.inset, 1);
    if (e !== ringE) continue;
    const ax = dir.name === "north" || dir.name === "south" ? x : z;
    if (ax % 3 === 0) continue; // mullion or pilaster column
    for (let y = Math.max(t.y0, gr); y < t.y1; y++) {
      if (y % 5 !== 2) continue;
      if ((x * 31 + z * 17 + y * 7) % 13 !== 0) continue;
      const ix = x - dir.dx, iz = z - dir.dz;
      if (inFoot(ix, iz) && E(ix, iz) > ringE) {
        const block = (x + z) % 2 ? "glowstone" : "shroomlight";
        overrides.set(vkey(ix, y, iz), [block]);
      }
    }
  }
}

// Antenna mast on the penthouse centre.
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
if (inFoot(cx, cz) && E(cx, cz) >= 18) {
  for (let y = 76; y <= 80; y++) {
    overrides.set(vkey(cx, y, cz), ["lightning_rod", { facing: "up", powered: "false", waterlogged: "false" }]);
  }
}

// Wall block for an exterior ring cell of a tier.
function wallBlock(dir, x, z, y, t, gr) {
  const ax = dir.name === "north" || dir.name === "south" ? x : z; // index along the wall
  if (t.kind === "mech") {
    if (y === t.y0 || y === t.y1 - 1) return ["light_gray_concrete"];
    if (ax % 2 === 0) {
      const ew = dir.name === "north" || dir.name === "south";
      return ["iron_bars", {
        north: ew ? "false" : "true",
        south: ew ? "false" : "true",
        east: ew ? "true" : "false",
        west: ew ? "true" : "false",
        waterlogged: "false",
      }];
    }
    return ["light_gray_concrete"];
  }
  if (y === t.y1 - 1) return ["white_concrete"];           // tier cornice
  if (y === gr && t.y0 === 0) return ["polished_granite"]; // base course
  if (ax % 6 === 0) return ["white_concrete"];             // full-height pilaster
  if (t.y0 === 0 && y < gr + 3) {                          // shopfront glazing
    if (ax % 3 === 0) return ["white_concrete"];
    return ["light_blue_stained_glass_pane", paneProps(dir)];
  }
  if (y % 5 === 0) return ["gray_concrete"];               // dark spandrel at storey line
  if (y % 5 === 4) return ["white_concrete"];              // storey cornice band
  if (ax % 3 === 0) return ["white_concrete"];             // mullion
  return ["light_blue_stained_glass_pane", paneProps(dir)];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const e = E(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Storeys, setbacks and walls.
  for (let y = gr; y < H; y++) {
    const ov = overrides.get(vkey(x, y, z));
    if (ov) { put(x, y, z, ov[0], ov[1]); continue; }
    const t = tierAt(e, y);
    if (!t) continue;
    const ringE = Math.max(t.inset, 1);
    if (e === ringE) {
      const dir = outDir(x, z);
      if (!dir) continue;
      const [id, props] = wallBlock(dir, x, z, y, t, gr);
      put(x, y, z, id, props);
    } else if (y % 5 === 0 || y === t.y0 || y === gr) {
      put(x, y, z, "light_gray_concrete"); // floor slab per storey
    }
  }

  // Terrace caps and parapets at each setback.
  for (let i = 1; i < TIERS.length; i++) {
    const t = TIERS[i], p = TIERS[i - 1];
    const rim = Math.max(p.inset, 1);
    if (e >= rim && e < t.inset && t.y0 >= gr) put(x, t.y0, z, "gray_concrete");
    if (e === rim && t.y0 + 1 >= gr) put(x, t.y0 + 1, z, "white_concrete");
  }

  // Top roof of the penthouse and its parapet.
  const L = TIERS[TIERS.length - 1];
  if (e >= L.inset && L.y1 >= gr) put(x, L.y1, z, "light_gray_concrete");
  if (e === Math.max(L.inset, 1) && L.y1 + 1 >= gr) put(x, L.y1 + 1, z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
