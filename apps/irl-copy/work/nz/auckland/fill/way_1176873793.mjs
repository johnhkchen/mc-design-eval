// Quay Regency: a 1980s harbour-edge hotel block on the Viaduct end of the CBD. Concrete frame with a light-blue
// glass curtain wall, dark stone base, a 13-storey wing, a 15-storey mid tier and a 17-storey tower core on top.
// Roof heights from the lidar are quantised to three flat tiers (53, 61, 69), the noisy edges are majority-smoothed,
// and each tier is a hollow shell: full floor slabs every 4 blocks, a one-cell facade ring with an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1176873793.cells.json", "utf8"));
const g = new Voxels([45, 83, 40]);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const TOP = [53, 61, 69];                       // the three roof tiers (53 = 13 storeys, 69 = 17 storeys)
const tierOf = (r) => (r <= 56 ? 0 : r <= 64 ? 1 : 2);

// footprint -> tier, then two majority passes so the lidar's stair-steps and edge noise become clean tiers
const raw = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
let tier = new Map([...raw].map(([k, r]) => [k, tierOf(r)]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [k, t] of tier) {
    const [x, z] = k.split(",").map(Number);
    const counts = [0, 0, 0]; counts[t]++;
    for (const [dx, dz] of DIRS) { const n = tier.get(key(x + dx, z + dz)); if (n !== undefined) counts[n]++; }
    let best = t;
    for (let i = 0; i < 3; i++) if (counts[i] >= 3) best = i;
    next.set(k, best);
  }
  tier = next;
}
const tops = new Map([...tier].map(([k, t]) => [k, TOP[t]]));

const top = (x, z) => tops.get(key(x, z)) ?? -1;                      // -1 outside the footprint
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) <= y);
const facadeAt = (x, z, y) => top(x, z) > y && exposed(x, z, y).length > 0;

// the lowest ground under each cell is y 0; fill from 0 up to the cell's own ground (none here, but it is the rule)
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");
}

// the shell: slabs on every 4th level, facade ring with articulation, air behind the glass
for (const [k, T] of tops) {
  const [x, z] = k.split(",").map(Number);
  for (let y = Math.max(0, ground.get(k) ?? 0); y < T; y++) {
    const ex = exposed(x, z, y);
    if (y % 4 === 0) {                                                  // floor slab (or roof, at T - 1)
      if (y === 0) g.set(x, y, z, ex.length ? "polished_andesite" : "stone_bricks");
      else g.set(x, y, z, ex.length ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (!ex.length) continue;                                           // interior: air
    const zFace = ex.some(([, dz]) => dz !== 0), xFace = ex.some(([dx]) => dx !== 0);
    const along = zFace ? x : z;
    const r = y % 4;
    if (zFace && xFace) { g.set(x, y, z, "white_concrete"); continue; }   // corner pier
    if (r === 3) { g.set(x, y, z, y === 3 ? "black_concrete" : "light_gray_concrete"); continue; }   // fascia / spandrel
    if (along % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }  // mullion
    const conn = (dx, dz) => (facadeAt(x + dx, z + dz, y) ? "true" : "false");
    const state = zFace
      ? { north: "false", south: "false", east: conn(1, 0), west: conn(-1, 0), waterlogged: "false" }
      : { east: "false", west: "false", north: conn(0, -1), south: conn(0, 1), waterlogged: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", state);
    // a warm light in some bays, just inside the glass (the air gap behind it)
    if ((x * 7 + z * 3 + y) % 9 === 0) {
      const [dx, dz] = zFace ? [0, -ex.find(([, e]) => e !== 0)[1]] : [-ex.find(([e]) => e !== 0)[0], 0];
      const ix = x + dx, iz = z + dz;
      if (top(ix, iz) > y && exposed(ix, iz, y).length === 0) g.set(ix, y, iz, "glowstone");
    }
  }
}

// the entrance: a door in the north ring of the wing, framed by piers, under a dark fascia canopy
const wing = [...tops].filter(([k, T]) => T === TOP[0]).map(([k]) => k.split(",").map(Number));
const northDoor = wing.filter(([x, z]) => top(x, z - 1) === -1);
const medX = northDoor.map(([x]) => x).sort((a, b) => a - b)[Math.floor(northDoor.length / 2)];
const [dX, dZ] = northDoor.reduce((best, c) => (Math.abs(c[0] - medX) < Math.abs(best[0] - medX) ? c : best));
for (const x of [dX - 1, dX + 1]) if (top(x, dZ) > 2) { g.set(x, 1, dZ, "white_concrete"); g.set(x, 2, dZ, "white_concrete"); }
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(dX, 1, dZ, "dark_oak_door", { ...door, half: "lower" });
g.set(dX, 2, dZ, "dark_oak_door", { ...door, half: "upper" });
for (let x = dX - 1; x <= dX + 1; x++) if (top(x, dZ) > 3) g.set(x, 3, dZ, "black_concrete");

// cornice / parapet on the outer edge of each roof tier
for (const [k, T] of tops) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z, T).length) g.set(x, T, z, "white_concrete");
}

// roof plant room on the tower: a solid 4 x 3 box two blocks high, with a lightning rod on top
const tower = [...tops].filter(([, T]) => T === TOP[2]).map(([k]) => k.split(",").map(Number));
const cx = Math.round(tower.reduce((s, [x]) => s + x, 0) / tower.length);
const cz = Math.round(tower.reduce((s, [, z]) => s + z, 0) / tower.length);
for (let x = cx - 2; x <= cx + 1; x++) for (let z = cz - 1; z <= cz + 1; z++) {
  if (top(x, z) !== TOP[2]) continue;
  const edge = x === cx - 2 || x === cx + 1 || z === cz - 1 || z === cz + 1;
  for (const y of [69, 70]) g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
}
g.set(cx, 71, cz, "lightning_rod");

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1176873793.nbt");
console.log(`way_1176873793: ${info.blocks} blocks, ${info.palette} palette entries, tiers ${TOP.join("/")}, door at ${dX},${dZ}`);
