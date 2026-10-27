// The Wiltshire on Victoria: a 1980s speculative office tower on a three-storey podium, in pale precast concrete and
// blue-tinted glass, read from the lidar: the roof runs 71 to 79 blocks above y 0 (about 59 to 66 m). The footprint's
// smoothed roof (a 5x5 median, so the lidar's noise becomes flat tiers) rounds to whole storeys of 4 blocks: a 18-storey
// shoulder at the edges and a 19-storey core in the middle, which steps up to a plant crown at 79. Every storey's floor
// slab sits on the one below, and every cell is filled from y 0 to its ground (stone on the slope), so nothing floats.
// Only the exposed skin is built: a cell gets glass or a pier on a storey where a side is open to the sky or to a lower
// neighbour; behind it the cell is air, with a glowstone in about one pane in five. The street face is the one with the
// most ground-level exposure: a shopfront with a dark fascia, and two entrances on its thirds, each with a lantern in
// the air behind the door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_24238728.cells.json", "utf8"));
const W = 20, D = 26, H = 92, STOREY = 4, MAX_STOREYS = 19, PODIUM = 3;

const ground = Array.from({ length: W }, () => Array(D).fill(-1));
const roof = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z, gr, r] of cells) { ground[x][z] = gr; roof[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ground[x][z] >= 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const key = ([dx, dz]) => `${dx},${dz}`;

// depth: 1 on the outline, 2 one cell in, and so on (a breadth-first walk in from outside the footprint)
const depth = Array.from({ length: W }, () => Array(D).fill(0));
let frontier = [];
for (const [x, z] of cells) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { depth[x][z] = 1; frontier.push([x, z]); }
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of DIRS) {
    const a = x + dx, b = z + dz;
    if (inside(a, b) && !depth[a][b]) { depth[a][b] = d + 1; next.push([a, b]); }
  }
  frontier = next;
}

// smoothed roof (5x5 median of the footprint's lidar roof) and whole storeys under it
const median = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const rs = Array.from({ length: W }, () => Array(D).fill(0));
const N = Array.from({ length: W }, () => Array(D).fill(-1));
for (const [x, z] of cells) {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(roof[x + dx][z + dz]);
  rs[x][z] = median(v);
  N[x][z] = Math.min(MAX_STOREYS, Math.max(PODIUM, Math.round(rs[x][z] / STOREY)));
}
// the lowest storeys are the podium everywhere, so every cell has a full podium on it

// a face of cell (x, z) at storey k is exposed when the neighbour across it is outside or has no storey k
const exposedDirs = (x, z, k) => DIRS.filter(([dx, dz]) => {
  const a = x + dx, b = z + dz;
  return !inside(a, b) || N[a][b] <= k;
});
const alongOf = ([dx]) => (dx !== 0 ? "z" : "x");
const alongCoord = (x, z, dir) => (alongOf(dir) === "z" ? z : x);

// the street face: the outward side with the most exposed ground-level faces
const faceCount = {};
for (const [x, z] of cells) for (const d of exposedDirs(x, z, 0)) faceCount[key(d)] = (faceCount[key(d)] || 0) + 1;
const [streetKey] = Object.entries(faceCount).sort((p, q) => q[1] - p[1])[0];
const street = DIRS.find((d) => key(d) === streetKey);
const streetCells = cells
  .filter(([x, z]) => exposedDirs(x, z, 0).some((d) => key(d) === streetKey))
  .map(([x, z]) => [x, z])
  .sort((p, q) => alongCoord(p[0], p[1], street) - alongCoord(q[0], q[1], street));
const doorAt = new Set([
  streetCells[Math.floor(streetCells.length / 3)].join(","),
  streetCells[Math.floor((2 * streetCells.length) / 3)].join(","),
]);

const PIER = { podium: "polished_andesite", tower: "white_concrete" };
const GLASS = "light_blue_stained_glass", SLAB = "light_gray_concrete", CORNICE = "polished_andesite";
const FASCIA = "polished_blackstone", CROWN = "gray_concrete";

const g = new Voxels([W, H, D]);
const storeyKind = (k) => (k < PODIUM ? "podium" : "tower");

// slabs: a floor line at every storey's base, over every cell that has the storey; the top slab is the roof
for (const [x, z, gr] of cells) {
  const n = N[x][z];
  for (let k = 0; k <= n; k++) {
    const y = STOREY * k;
    if (k === 0) g.set(x, y, z, gr === 1 ? "stone" : "polished_andesite");     // y 0: foundation on the slope, plinth on the flat
    else if (k === PODIUM && depth[x][z] === 1) g.set(x, y, z, CORNICE);        // the podium's cornice
    else g.set(x, y, z, SLAB);
  }
}

// the skin: a storey's glass or piers on each exposed cell; interiors stay air behind it
for (const [x, z] of cells) {
  const n = N[x][z];
  for (let k = 0; k < n; k++) {
    const exp = exposedDirs(x, z, k);
    if (!exp.length) continue;
    const pd = exp[0], along = alongCoord(x, z, pd), pier = ((along % 3) + 3) % 3 === 0;
    const kind = storeyKind(k), b = STOREY * k;
    const onStreet = exp.some((d) => key(d) === streetKey);
    for (let y = b + 1; y <= b + 3; y++) {
      let m;
      if (k === 0 && onStreet) m = y === b + 3 ? FASCIA : (pier ? "polished_andesite" : "glass");
      else m = pier ? PIER[kind] : GLASS;
      g.set(x, y, z, m);
    }
    // doors: the entrance cell on the street face, with a lantern hanging in the air behind it
    if (k === 0 && onStreet && doorAt.has(`${x},${z}`) && key(pd) === streetKey) {
      const facing = FACING[streetKey];
      g.set(x, b + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, b + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      const ix = x - pd[0], iz = z - pd[1];
      if (inside(ix, iz)) g.set(ix, b + 3, iz, "lantern", { hanging: "true" });
    }
    // warm glass: a glowstone in the air behind about one pane in five, where that cell is interior
    if (!pier) {
      const ix = x - pd[0], iz = z - pd[1];
      if (inside(ix, iz) && N[ix][iz] > k && !exposedDirs(ix, iz, k).length && (x * 3 + z * 5 + k * 7) % 5 === 0)
        g.set(ix, b + 2, iz, "glowstone");
    }
  }
}

// the roof: a plant crown on the core where the lidar reaches 78 and the cell is well inside; roof boxes on the
// shoulder's inner roof; a parapet on its outer edge
for (const [x, z] of cells) {
  const n = N[x][z], top = STOREY * n + 1;   // the roof's top surface
  if (n === MAX_STOREYS && rs[x][z] >= 78 && depth[x][z] >= 3) {
    for (let y = top; y < top + 2; y++) g.set(x, y, z, CROWN);
  } else if (n < MAX_STOREYS && depth[x][z] === 1) {
    g.set(x, top, z, SLAB);
  } else if (n < MAX_STOREYS && depth[x][z] >= 2 && (2 * x + z) % 5 === 0) {
    g.set(x, top, z, CROWN);
  }
}

console.log(g.save(DIR + "way_24238728.nbt"));
