// QuBA (way 160068964): a 1980s Auckland mid-rise office block, seven storeys of white concrete and blue glass over a
// stone plinth, on a stepped massing: a podium and wings from the lidar's median-smoothed roof height, quantised to
// 4-block storeys, with the tallest tier (cyan glass) and a plant room on its roof. Every column is solid from y 0 to its
// ground, then stacked storeys from one above the ground: a floor slab per storey and a roof slab on top, the shell
// solid where a face meets air (outside the footprint, or a shorter neighbour), hollow inside behind the glass. Doors
// sit at the middle of the two longest street faces; some windows have lanterns or glowstone behind them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_160068964.cells.json", "utf8"));
const W = 76, D = 95, H = 36;
const at = (x, z) => z * W + x;
const inFP = new Uint8Array(W * D), G = new Int32Array(W * D), R = new Int32Array(W * D);
for (const [x, z, g, r] of cells) { inFP[at(x, z)] = 1; G[at(x, z)] = g; R[at(x, z)] = r; }
const has = (x, z) => x >= 0 && z >= 0 && x < W && z < D && inFP[at(x, z)] === 1;

// Floor level B = ground + 1; storeys n from the 5x5 median of the roof (lidar noise out), rounded to whole storeys.
const B = new Int32Array(W * D), T = new Int32Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!has(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (has(x + dx, z + dz)) vals.push(R[at(x + dx, z + dz)]);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const b = G[at(x, z)] + 1, n = Math.max(1, Math.round((med - b) / 4));
  B[at(x, z)] = b; T[at(x, z)] = b + 4 * n;
}
const Tmax = Math.max(...cells.map(([x, z]) => T[at(x, z)]));
const DIRS = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];

// the outward faces at height y: a neighbour outside the footprint, or one whose top is below y (a setback's air)
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz) || T[at(x + dx, z + dz)] <= y);

// The entrances: the middle of the two longest street faces at ground storey, off the piers.
const faces = {};
for (const [x, z] of cells) {
  const e = exposed(x, z, B[at(x, z)] + 1);
  if (e.length !== 1) continue;
  const [dx, dz, name] = e[0];
  (faces[name] ??= []).push({ x, z, along: dx ? z : x });
}
const doors = new Map();
for (const name of Object.keys(faces).sort((a, b) => faces[b].length - faces[a].length).slice(0, 2)) {
  const list = faces[name].filter((c) => faces[name].length && c.along % 3 !== 0).sort((a, b) => a.along - b.along);
  if (list.length < 6) continue;
  const m = list[Math.floor(list.length / 2)];
  doors.set(`${m.x},${m.z}`, name);
}

const g = new Voxels([W, H, D]);
const glassFor = (x, z) => (T[at(x, z)] >= 25 ? "cyan_stained_glass" : "light_blue_stained_glass");
const shell = (x, z, y) => exposed(x, z, y).length > 0;

for (const [x, z] of cells) {
  const gr = G[at(x, z)], b = B[at(x, z)], t = T[at(x, z)];
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");            // foundation to the ground line
  for (let y = b; y < t; y++) {
    const s = Math.floor((y - b) / 4), r = (y - b) % 4;
    const e = exposed(x, z, y), isShell = e.length > 0;
    if (y === t - 1) { g.set(x, y, z, isShell ? "smooth_stone" : "light_gray_concrete"); continue; }  // coping / roof slab
    if (!isShell) { if (r === 0) g.set(x, y, z, "light_gray_concrete"); continue; }                  // slab; air between
    const xFace = e.find((d) => d[0] !== 0), zFace = e.find((d) => d[1] !== 0);
    const corner = xFace && zFace, along = xFace ? z : x;
    const pier = corner || along % 3 === 0;
    const door = s === 0 && r === 1 && doors.get(`${x},${z}`);
    if (s === 0 && r === 0) { g.set(x, y, z, "stone_bricks"); continue; }      // plinth
    if (r === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }          // string course
    if (door) {                                                                 // the entrance: an iron door, two high
      const facing = door;
      g.set(x, y, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, y + 1, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (doors.get(`${x},${z}`) && r === 2) continue;                           // the door's upper half, already set
    if (pier) { g.set(x, y, z, s === 0 ? "stone_bricks" : "smooth_quartz"); continue; }
    if (r === 3) { g.set(x, y, z, "white_concrete"); continue; }              // head spandrel
    g.set(x, y, z, s === 0 ? "light_blue_stained_glass" : glassFor(x, z));    // the window band
    if (r === 1) {                                                             // a lamp behind some panes
      const [dx, dz] = xFace || zFace, ix = x - dx, iz = z - dz;
      const h = (x * 31 + z * 17 + s * 7) % 13;
      if (has(ix, iz) && !shell(ix, iz, y)) {
        if (h % 5 === 0) g.set(ix, y, iz, "lantern", { hanging: "false" });
        else if (h === 7) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Plant room on the tallest tier: the largest 10 x 7 patch of its roof, walls to y Tmax+2, a grille band, a roof on top.
const top = (x, z) => has(x, z) && T[at(x, z)] === Tmax;
let best = null;
for (let z0 = 0; z0 < D; z0++) for (let x0 = 0; x0 < W; x0++) for (const [w, h] of [[10, 7], [7, 10]]) {
  let ok = true;
  for (let dz = 0; dz < h && ok; dz++) for (let dx = 0; dx < w && ok; dx++) ok = top(x0 + dx, z0 + dz);
  if (ok) { best = { x0, z0, w, h }; break; }
}
if (best) {
  const { x0, z0, w, h } = best;
  for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) {
    const x = x0 + dx, z = z0 + dz, edge = dx === 0 || dz === 0 || dx === w - 1 || dz === h - 1;
    for (let y = Tmax; y <= Tmax + 2; y++) {
      if (y === Tmax + 2) g.set(x, y, z, "smooth_stone");
      else if (edge) g.set(x, y, z, y === Tmax + 1 && (dz === 0 || dz === h - 1) && dx % 3 === 1 ? "iron_bars" : "light_gray_concrete");
    }
  }
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_160068964.nbt");
console.log(`QuBA: ${cells.length} cells, top y ${Tmax}, doors ${[...doors.values()].join("/")}, plant room ${best ? `${best.w}x${best.h}` : "none"}; ${info.blocks} blocks, ${info.palette} palette`);
