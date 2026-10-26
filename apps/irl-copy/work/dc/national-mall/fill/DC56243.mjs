// 1711 14th St NW (Residential-Apartment-Elevator, c.1910s-20s): a brick flats block on a stone plinth, with a
// 5-block tower bay on the west, a 4-block main body, a C-plan open court to the south and low 1-3 block wings.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC56243.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 20, D = 26, Y = 17;

// lidar roof heights, then a 3x3 median to lose the noise; courtyard (roof 0) stays open; the tower bay is the west
// corner only (x 0-2, z 6-13), every other 5 is a 4 so the main body is one clean tier
const raw = Array.from({ length: D }, () => Array(W).fill(0));
for (const [x, z, , r] of cells) raw[z][x] = r;
const inb = (x, z) => x >= 0 && z >= 0 && x < W && z < D;
const H = Array.from({ length: D }, (_, z) => Array.from({ length: W }, (_, x) => {
  if (!raw[z][x]) return 0;
  const vs = []; for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, z + dz)) vs.push(raw[z + dz][x + dx]);
  vs.sort((a, b) => a - b); const h = Math.max(1, vs[vs.length >> 1]);
  return h >= 4 && x <= 2 && z >= 6 && z <= 13 ? 5 : Math.min(h, 4);
}));
// a lone 1-block lidar speck with no taller neighbour is noise, not a wall: it reads as a stray block, so it goes
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (H[z][x] !== 1) continue;
  let tall = false;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inb(x + dx, z + dz) && H[z + dz][x + dx] >= 2) tall = true;
  if (!tall) H[z][x] = 0;
}
const hAt = (x, z) => (inb(x, z) ? H[z][x] : 0);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a cell at layer y is exterior when a side neighbour has no building that high
const edge = (x, z, y) => y < hAt(x, z) && NB.some(([dx, dz]) => hAt(x + dx, z + dz) <= y);

const g = new Voxels([W, Y, D]);
const WIN = (alongX) => alongX ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const glows = [];

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const h = hAt(x, z); if (!h) continue;
  for (let y = 0; y < h; y++) {
    const ext = edge(x, z, y);
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }                  // plinth and ground floor slab
    if (y === h - 1) { g.set(x, y, z, ext ? "stone_bricks" : "smooth_stone"); continue; }   // cornice band, flat roof
    if (!ext) {
      // inside: an air ring behind the glass (next to a wall), a solid core
      if (NB.some(([dx, dz]) => inb(x + dx, z + dz) && edge(x + dx, z + dz, y))) continue;
      g.set(x, y, z, "smooth_stone"); continue;
    }
    // the facade: the wall runs along x where the z-neighbour is missing, else along z
    const alongX = hAt(x, z - 1) <= y || hAt(x, z + 1) <= y;
    const t = alongX ? x : z;
    if (alongX && z === 6 && (x === 9 || x === 10) && (y === 1 || y === 2)) {   // entrance: double door, north front
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 9 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (alongX && z === 6 && (x === 8 || x === 11) && (y === 1 || y === 2)) { g.set(x, y, z, "stone_bricks"); continue; }   // door surround
    if (t % 3 === 0) { g.set(x, y, z, "bricks"); continue; }                  // piers between the bays
    g.set(x, y, z, "glass_pane", WIN(alongX));
    if ((x * 5 + z * 7 + y * 3) % 11 === 0) glows.push([x, y, z]);               // lit rooms behind some windows
  }
}
// warm lights behind a few windows, in the air ring just inside the glass
for (const [x, y, z] of glows) {
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inb(nx, nz) && hAt(nx, nz) > y && !edge(nx, nz, y)) { g.set(nx, y, nz, "glowstone"); break; }
  }
}
// rooftop bulkhead on the tower bay (on the roof at layer 4, so it stands on what is below)
for (let x = 0; x <= 1; x++) for (let z = 8; z <= 10; z++) for (let y = 5; y <= 6; y++) g.set(x, y, z, "bricks");
for (let x = 0; x <= 1; x++) for (let z = 8; z <= 10; z++) g.set(x, 7, z, "stone_bricks");

const out = g.save(`${dir}/DC56243.nbt`);
console.log(out);
