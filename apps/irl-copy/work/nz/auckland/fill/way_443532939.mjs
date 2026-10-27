import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Library 27: a 1980s concrete-and-glass civic block (office / library), the typical Auckland CBD-edge build of its age:
// a pale concrete frame with dark bronze-tinted curtain glazing, a stone plinth and a lit lobby on the south face.
// Storeys are 4 blocks (floor slab, two glass rows, a head band); the floor datum sits at y 5 (above the highest ground,
// 5), so the plinth 0-4 is the foundation and the downhill side's extra storeys. Lidar roof tiers are smoothed to flat
// storey counts (56/60/64/68/72). Massing is per cell; a block is shell only if it faces air, so interiors are an air gap.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_443532939.cells.json`, "utf8"));
const [X, Y, Z] = [17, 84, 37];
const FLOOR0 = 5;                                       // the first storey's slab; y 0-4 is the plinth
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];        // N, S, W, E (z-1, z+1, x-1, x+1)

const key = (x, z) => x * 100 + z;
const unkey = (k) => [Math.floor(k / 100), k % 100];

// storeys per cell from the lidar roof: roof = 8 + 4n (the top of a 2-block parapet); then majority-smoothed
let nS = new Map(cells.map(([x, z, , roof]) => [key(x, z), Math.round((roof - 8) / 4)]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, n] of nS) {
    const [x, z] = unkey(k), votes = new Map();
    for (const [a, b] of [[0, 0], ...DIRS]) {
      const m = nS.get(key(x + a, z + b));
      if (m !== undefined) votes.set(m, (votes.get(m) || 0) + 1);
    }
    let best = n, bv = votes.get(n) || 0;
    for (const [v, c] of votes) if (c > bv) { best = v; bv = c; }
    next.set(k, best);
  }
  nS = next;
}
// a lone cell standing a storey or more above all its neighbours is lidar noise, not a tower: drop it to their tier
for (const [k, n] of nS) {
  const [x, z] = unkey(k);
  const nb = DIRS.map(([a, b]) => nS.get(key(x + a, z + b))).filter((v) => v !== undefined);
  if (nb.length && nb.every((v) => v < n)) nS.set(k, Math.max(...nb));
}
const inF = (x, z) => nS.has(key(x, z));
const nOf = (x, z) => nS.get(key(x, z));
// the volume: footprint cells up to their roof deck (y = FLOOR0 + 4n)
const vol = (x, z, y) => { const n = nOf(x, z); return n !== undefined && y <= FLOOR0 + 4 * n; };
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => !vol(x + dx, z + dz, y));
const nMax = Math.max(...nS.values());

const g = new Voxels([X, Y, Z]);
const GLASS = "gray_stained_glass", LOBBY = "light_blue_stained_glass", PIER = "polished_andesite";
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
const SLAB_TOP = { type: "bottom", waterlogged: "false" };

for (const [k, n] of nS) {
  const [x, z] = unkey(k);
  const boundary = DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

  // plinth: solid from y 0 up to the storey datum (the ground under it and the downhill side's extra storeys)
  for (let y = 0; y < FLOOR0; y++) g.set(x, y, z, y === FLOOR0 - 1 && boundary ? "chiseled_stone_bricks" : "stone_bricks");

  // floor slabs, and the roof deck on top; a slab on the outside is a white spandrel, a roof deck is tar-grey
  for (let s = 0; s <= n; s++) {
    const y = FLOOR0 + 4 * s;
    if (s === n) g.set(x, y, z, "gray_concrete");
    else g.set(x, y, z, exposedDirs(x, z, y).length ? "white_concrete" : "light_gray_concrete");
  }

  // the envelope: head bands, glazing with piers, and the parapet on the roof deck; interiors stay air
  for (let s = 0; s <= n; s++) {
    for (let r = 1; r <= (s < n ? 3 : 2); r++) {
      const y = FLOOR0 + 4 * s + r;
      const exp = exposedDirs(x, z, y);
      if (!exp.length) continue;
      const [dx, dz] = exp[0];
      const bay = dz !== 0 ? x : z, maxBay = dz !== 0 ? X - 1 : Z - 1;
      if (s === n) { g.set(x, y, z, r === 1 ? "light_gray_concrete" : "smooth_stone_slab", r === 1 ? undefined : SLAB_TOP); continue; }
      if (r === 3) { g.set(x, y, z, "light_gray_concrete"); continue; }
      const pier = bay === 0 || bay === maxBay || bay % 3 === 0;
      if (pier) { g.set(x, y, z, PIER); continue; }
      const glass = s === 0 || s >= n - 2 ? LOBBY : GLASS;
      g.set(x, y, z, glass);
      // a warm light behind some panes, in the air gap on the inside (not on the lobby)
      if (s >= 1 && s < n - 2 && r === 1 && (x * 5 + z * 3 + s) % 7 === 0) {
        const xi = x - dx, zi = z - dz;
        if (inF(xi, zi) && !exposedDirs(xi, zi, y).length) g.set(xi, y, zi, "glowstone");
      }
    }
  }

  // roof plant room over the top tier's core: two blocks of plant and a slab cap, standing on the roof deck
  if (n === nMax && x >= 11 && x <= 13 && z >= 24 && z <= 26) {
    const y0 = FLOOR0 + 4 * n + 1;
    g.set(x, y0, z, "light_gray_concrete");
    g.set(x, y0 + 1, z, "light_gray_concrete");
    g.set(x, y0 + 2, z, "smooth_stone_slab", SLAB_TOP);
  }
}

// the main entrance: a dark-oak door in the lobby's glazing on the south face, under a stone lintel
const ex = 9, ez = Z - 1;
g.set(ex, FLOOR0, ez, "dark_oak_door", { ...DOOR, half: "lower" });
g.set(ex, FLOOR0 + 1, ez, "dark_oak_door", { ...DOOR, half: "upper" });
g.set(ex, FLOOR0 + 3, ez, "light_gray_concrete");

g.save(`${DIR}/way_443532939.nbt`);
console.log(`way_443532939: ${g.count()} blocks, ${g.palette.length - 1} kinds, storeys ${[...new Set(nS.values())].sort((a, b) => a - b)}`);
