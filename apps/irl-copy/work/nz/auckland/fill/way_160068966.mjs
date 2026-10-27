// Way 160068966: a 1980s pale-concrete and blue-glass office block (the CBD edge's standard for its time). Massing from the
// lidar roof in four clean tiers: a 42-block tower set back inside a 36-block main block, a 28-block wing, and a low 8-block
// edge. Floor slabs every 4 blocks on a 4-block plinth, so each storey stands on the one below; piers every 4 blocks, glass
// between, a ground floor of shopfront glass, two entrances under canopies, lamps behind some panes, and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_160068966.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell
const W = 65, D = 82, H = 54;

const F = Array.from({ length: W }, () => Array(D).fill(null));
for (const [x, z, g, r] of cells) F[x][z] = { g, r };
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && F[x][z] !== null;

// 4-neighbour steps and the side each one is on: 0 = +x, 1 = -x, 2 = +z, 3 = -z
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const key = (x, z) => `${x},${z}`;

/** distance from each member cell to the nearest non-member (1 on the edge), by breadth-first search */
function edgeDist(member) {
  const d = Array.from({ length: W }, () => Array(D).fill(0)), q = [];
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
    if (member(x, z) && N4.some(([dx, dz]) => !member(x + dx, z + dz))) { d[x][z] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of N4) {
      const nx = x + dx, nz = z + dz;
      if (member(nx, nz) && !d[nx][nz]) { d[nx][nz] = d[x][z] + 1; q.push([nx, nz]); }
    }
  }
  return d;
}
const dFoot = edgeDist(has);
const dCore = edgeDist((x, z) => has(x, z) && F[x][z].r >= 40);

// Tiers from the lidar roof (clean flat tops, each tier a storey count of 4s with its cap at top - 1)
const TOP = { tower: 42, rim: 36, main: 36, wing: 28, low: 8 };
const CELLS = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!has(x, z)) continue;
  const { r } = F[x][z];
  const kind = r >= 40 ? (dCore[x][z] >= 3 ? "tower" : "rim") : r >= 33 ? "main" : r >= 24 ? "wing" : "low";
  F[x][z].kind = kind; F[x][z].top = TOP[kind];
  CELLS.push({ x, z });
}
const topAt = (x, z) => (has(x, z) ? F[x][z].top : 0);
/** the sides (indices into N4) of cell x, z at height y that face air: outside the footprint or a lower tier */
const sides = (x, z, y) => N4.flatMap(([dx, dz], i) => (topAt(x + dx, z + dz) <= y ? [i] : []));
const LOWER_TIERS = [28, 36];   // a higher tier's storeys stand on these tiers' caps (solid under the setback)

// Entrances: the middle bay of the ground-floor frontage on the two longest faces
const sideOf = (c) => { const s = sides(c.x, c.z, 5); return s.length === 1 ? s[0] : -1; };
const alongOf = (i, x, z) => (i >= 2 ? x : z);   // a +-z face runs along x
const reserved = new Set();
const doors = [], canopy = [], lanterns = [];
const faces = [0, 1, 2, 3].map((i) => CELLS.filter((c) => sideOf(c) === i && F[c.x][c.z].top > 8));
const picks = faces.map((list, i) => ({ i, list })).sort((a, b) => b.list.length - a.list.length).slice(0, 2);
for (const { i, list } of picks) {
  const sorted = list.slice().sort((a, b) => alongOf(i, a.x, a.z) - alongOf(i, b.x, b.z));
  const bay = sorted.filter((c) => alongOf(i, c.x, c.z) % 4 === 2);
  const c = (bay.length ? bay : sorted)[Math.floor((bay.length ? bay : sorted).length / 2)];
  const [nx, nz] = N4[i];
  const inward = [c.x - nx, c.z - nz];
  doors.push({ x: c.x, z: c.z, facing: FACING[`${-nx},${-nz}`] });
  reserved.add(key(...inward));
  lanterns.push({ x: inward[0], z: inward[1] });
  // canopy: the door's bay, one cell either side, over the wall and one cell in
  for (const k of [-1, 0, 1]) {
    const px = c.x + (i >= 2 ? k : 0), pz = c.z + (i >= 2 ? 0 : k);
    if (!has(px, pz)) continue;
    canopy.push([px, pz]);
    if (has(px - nx, pz - nz)) { canopy.push([px - nx, pz - nz]); reserved.add(key(px - nx, pz - nz)); }
  }
}

const B = new Voxels([W, H, D]);
for (const { x, z } of CELLS) {
  const T = F[x][z].top;
  for (let y = 0; y < T; y++) {
    const s = sides(x, z, y);
    const perim = s.length > 0;
    if (y < 4) { B.set(x, y, z, "stone_bricks"); continue; }                       // foundation and plinth
    if (y === T - 1) { B.set(x, y, z, perim ? "white_concrete" : "gray_concrete"); continue; }   // roof cap / cornice
    if (y % 4 === 0) { B.set(x, y, z, "white_concrete"); continue; }                 // floor slab line
    if (LOWER_TIERS.some((t) => y === t - 1 && T > t)) { B.set(x, y, z, perim ? "white_concrete" : "smooth_stone"); continue; }
    if (perim) {
      const alongX = s.some((i) => i >= 2), corner = s.some((i) => i < 2) && alongX;
      const along = alongX ? x : z;
      if (corner || along % 4 === 0) { B.set(x, y, z, "light_gray_concrete"); continue; }   // piers
      if (y % 4 === 3) { B.set(x, y, z, "white_concrete"); continue; }                        // spandrel
      const pane = y < 8 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
      const st = alongX ? { east: "true", west: "true", north: "false", south: "false" }
                        : { north: "true", south: "true", east: "false", west: "false" };
      B.set(x, y, z, pane, { ...st, waterlogged: "false" });
      continue;
    }
    if (x % 4 === 2 && z % 4 === 2 && dFoot[x][z] >= 2 && !reserved.has(key(x, z))) B.set(x, y, z, "light_gray_concrete");   // structural columns
  }
}

// Entrances, canopies and the lobby lantern
for (const d of doors) {
  B.set(d.x, 5, d.z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  B.set(d.x, 6, d.z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
}
for (const [x, z] of canopy) B.set(x, 7, z, "smooth_stone");
for (const l of lanterns) B.set(l.x, 6, l.z, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light behind some panes: a lamp in the air cell inside a lower pane, standing on the floor slab
let lit = 0;
for (const { x, z } of CELLS) {
  for (let y = 5; y < F[x][z].top - 1; y += 4) {
    if (B.get(x, y, z)?.block !== "minecraft:light_blue_stained_glass_pane" && B.get(x, y, z)?.block !== "minecraft:cyan_stained_glass_pane") continue;
    const s = sides(x, z, y); if (s.length !== 1) continue;
    const [nx, nz] = N4[s[0]], ix = x - nx, iz = z - nz;
    if (!has(ix, iz) || dFoot[ix][iz] < 2 || reserved.has(key(ix, iz)) || B.val(ix, y, iz) !== 0) continue;
    const h = (x * 31 + z * 17 + y * 7) % 9;
    if (h === 0) { B.set(ix, y, iz, "glowstone"); lit++; }
    else if (h === 4) { B.set(ix, y, iz, "shroomlight"); lit++; }
  }
}

// Roof plant: two 7 x 5 plant rooms on the main roof, and a lift overrun with a lightning rod on the tower
const boxes = [];
for (let x = 0; x + 7 <= W && boxes.length < 2; x++) for (let z = 0; z + 5 <= D && boxes.length < 2; z++) {
  const ok = [...Array(7)].every((_, i) => [...Array(5)].every((_, j) => has(x + i, z + j) && F[x + i][z + j].kind === "main" && dFoot[x + i][z + j] >= 3));
  if (!ok || boxes.some((b) => Math.abs(b.x - x) < 9 && Math.abs(b.z - z) < 7)) continue;
  boxes.push({ x, z });
}
for (const b of boxes) for (let i = 0; i < 7; i++) for (let j = 0; j < 5; j++) {
  B.set(b.x + i, 36, b.z + j, "light_gray_concrete");
  B.set(b.x + i, 37, b.z + j, "light_gray_concrete");
  B.set(b.x + i, 38, b.z + j, "gray_concrete");
}
const tower = CELLS.filter((c) => F[c.x][c.z].kind === "tower");
const cx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length), cz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
const lift = tower
  .filter((c) => [...Array(4)].every((_, i) => [...Array(4)].every((_, j) => F[c.x + i]?.[c.z + j]?.kind === "tower")))
  .sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz))[0];
if (lift) {
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) for (let y = 42; y < 45; y++) B.set(lift.x + i, y, lift.z + j, "light_gray_concrete");
  B.set(lift.x + 1, 45, lift.z + 1, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

const out = B.save(`${DIR}/way_160068966.nbt`);
console.log(JSON.stringify({ cells: CELLS.length, doors: doors.length, canopy: canopy.length, lit, plantBoxes: boxes.length, lift: !!lift, ...out }));
