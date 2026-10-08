// Taj Mahal generator. `node build.mjs 1` -> round-1.nbt, `node build.mjs 2` -> round-2.nbt.
// Coordinates inside this file are PLINTH coordinates (spec: origin = plinth front-left corner); O shifts them
// into the grid so the 1-block brick apron fits around the 41x41 plinth.
import { Grid, B, dome, cylinder, minaret, ring } from "../../../../../minecraft-design/tools/src/build.mjs";

const ROUND = Number(process.argv[2] ?? 1);
const OUT = new URL(`./round-${ROUND}.nbt`, import.meta.url).pathname;
const O = 1, N = 41, C = 20; // plinth size, centre
const R2 = ROUND >= 2;
const g = new Grid([43, 42, 43]);

const S = (x, y, z, block, state) => g.set(x + O, y, z + O, block, state);
const SB = (x, y, z, pair) => g.set(x + O, y, z + O, ...pair);
const F = (a, b, block) => g.fill([a[0] + O, a[1], a[2] + O], [b[0] + O, b[1], b[2] + O], block);
const has = (x, y, z) => !!g.get(x + O, y, z + O);
const air = (x, y, z) => g.unset(x + O, y, z + O);

// ---- materials (spec MATERIAL MAP) ----
const M = { wall: "calcite", dome: "smooth_quartz", q: "quartz_block", cream: "smooth_sandstone", shadow: "andesite",
  black: "polished_blackstone", bars: "iron_bars", gold: "gold_block", brick: "bricks", rail: "diorite_wall" };

// footprint of the mausoleum: 25x25 at 8..32, corners chamfered
const FP0 = 8, FP1 = 32;
const CHAMFER = ROUND >= 2 ? [[0, 0]] : [[0, 0]]; // cells (dx,dz) from each corner removed
const inFoot = (x, z) => {
  if (x < FP0 || x > FP1 || z < FP0 || z > FP1) return false;
  const dx = Math.min(x - FP0, FP1 - x), dz = Math.min(z - FP0, FP1 - z);
  return !CHAMFER.some(([a, b]) => a === dx && b === dz);
};

// four faces share one local frame: u along the face, d depth in from the front plane. north: x=u,z=d.
const FACES = {
  north: { xz: (u, d) => [u, d], out: "north", in: "south", up: "east", um: "west" },
  south: { xz: (u, d) => [u, N - 1 - d], out: "south", in: "north", up: "east", um: "west" },
  east: { xz: (u, d) => [N - 1 - d, u], out: "east", in: "west", up: "south", um: "north" },
  west: { xz: (u, d) => [d, u], out: "west", in: "east", up: "south", um: "north" },
};
const MIR = (u) => 2 * C - u;

// ---- 1. apron, plinth, terrace, plinth parapet ----
g.fill([0, 0, 0], [42, 0, 42], M.brick);
F([0, 1, 0], [N - 1, 4, N - 1], M.wall);
F([0, 1, 0], [N - 1, 1, N - 1], M.brick); // base course (inner shows nothing, edges show brick)
F([1, 1, 1], [N - 2, 1, N - 2], M.wall);
for (let i = 0; i < N; i++) for (const f of Object.values(FACES)) {
  const [x, z] = f.xz(i, 0);
  const panel = i % 4 !== 0 && i > 1 && i < N - 2;
  if (panel) { air(x, 2, z); air(x, 3, z); } // recessed panel, carved by exclusion; backed by solid plinth
  S(x, 5, z, M.wall);
  if (R2) { if (i % 8 === 0) { S(x, 6, z, M.q); SB(x, 7, z, B.slab("quartz", "bottom")); } else SB(x, 6, z, B.slab("quartz", "bottom")); }
  else if (i % 4 === 0) { S(x, 6, z, M.q); } else SB(x, 6, z, B.slab("quartz", "bottom"));
}
for (const [x, z] of [[0, 0], [N - 1, 0], [0, N - 1], [N - 1, N - 1]]) { // corner piers
  F([x, 5, z], [x, 7, z], M.q); SB(x, 8, z, B.slab("quartz", "bottom"));
}

// ---- 2. mausoleum body (solid) ----
for (let x = FP0; x <= FP1; x++) for (let z = FP0; z <= FP1; z++) if (inFoot(x, z)) for (let y = 5; y <= 18; y++) S(x, y, z, M.wall);

// ---- 3. facade bay, applied on all four faces ----
const HALF = 3; // pishtaq recess half width
const hw0 = (y) => (y < 14 ? 3 : y < 16 ? 2 : y < 17 ? 1 : y === 17 ? 0 : -1);
const hwK = (k, y) => (y < 12 ? (k === 2 ? 2 : 3) : hw0(y) - k);
function facade(name) {
  const f = FACES[name], P = (u, d) => f.xz(u, d);
  const set = (u, y, d, block, state) => { const [x, z] = P(u, d); S(x, y, z, block, state); };
  const setP = (u, y, d, pair) => { const [x, z] = P(u, d); SB(x, y, z, pair); };
  const clear = (u, y, d) => { const [x, z] = P(u, d); air(x, y, z); };
  const solid = (u, y, d) => { const [x, z] = P(u, d); return has(x, y, z); };

  // skirting course + cream piers proud by 1
  for (let u = 8; u <= 32; u++) if ((u < 15 || u > 25) && solid(u, 5, 8)) set(u, 5, 8, M.cream);
  for (const u of [11, 29]) { for (let y = 5; y <= 18; y++) { set(u, y, 8, M.cream); set(u, y, 7, M.cream); } }
  if (R2) for (const y of [10, 15]) for (let u = 8; u <= 32; u++) if ((u < 15 || u > 25) && solid(u, y, 8)) setP(u, y, 7, B.slab("quartz", "bottom"));
  // frieze: a black calligraphy line
  for (let u = 8; u <= 32; u++) if ((u < 15 || u > 25) && solid(u, 17, 8)) set(u, 17, 8, M.black);
  // niches, 2 wide x 4 high, carved by not placing the wall, backed with shadow grey
  for (const u0 of [9, 12]) for (const side of [0, 1]) {
    const ua = side ? MIR(u0 + 1) : u0; // niche cells ua, ua+1
    for (const y0 of [6, 11]) for (let i = 0; i < 2; i++) {
      const u = ua + i, outer = i === 0 ? f.um : f.up;
      if (!solid(u, y0, 8)) continue;
      for (let y = y0; y <= y0 + 2; y++) { clear(u, y, 8); set(u, y, 9, M.shadow); }
      clear(u, y0 + 3, 8); setP(u, y0 + 3, 8, B.stairs("andesite", outer, "top")); set(u, y0 + 3, 9, M.shadow);
      set(u, y0 - 1 >= 6 ? y0 - 1 : y0 - 1, 8, M.wall); // sill stays wall
      if (y0 === 6) set(u, 5, 8, M.cream);
    }
  }
  // pishtaq: slab proud by 1 across u15..25, rising to y21
  for (let u = 15; u <= 25; u++) for (let y = 5; y <= (u === 15 || u === 25 ? 20 : 21); y++) set(u, y, 7, M.wall);
  for (const u of [16, 24]) for (let y = 6; y <= 19; y++) set(u, y, 7, M.black);
  for (let u = 16; u <= 24; u++) set(u, 19, 7, M.black);
  // iwan cut 3 deep with stepped pointed arch; each deeper layer is narrower
  for (let k = 0; k < 3; k++) for (const d of k === 0 ? [7, 8] : [7 + k + 1]) {
    for (let y = 5; y <= 17; y++) { const hw = hwK(k, y); for (let u = C - hw; u <= C + hw && hw >= 0; u++) clear(u, y, d); }
  }
  // shadow: the d10 step ring and the back wall in andesite
  for (let y = 5; y <= 17; y++) for (let u = 17; u <= 23; u++) {
    const inL1 = Math.abs(u - C) <= hwK(1, y) && hwK(1, y) >= 0, inL2 = Math.abs(u - C) <= hwK(2, y) && hwK(2, y) >= 0;
    if (inL1 && !inL2) set(u, y, 10, M.shadow);
    if (inL2) set(u, y, 11, M.shadow);
  }
  // door with black U-frame, jali above (iron bars over a dark back)
  for (let y = 5; y <= 8; y++) for (let u = 19; u <= 21; u++) { clear(u, y, 11); set(u, y, 12, M.shadow); }
  for (let y = 5; y <= 9; y++) { set(18, y, 11, M.black); set(22, y, 11, M.black); }
  for (let u = 18; u <= 22; u++) set(u, 9, 11, M.black);
  for (let y = 10; y <= 14; y++) for (let u = 19; u <= 21; u++) { set(u, y, 11, M.bars); set(u, y, 12, M.shadow); }
}
for (const n of Object.keys(FACES)) facade(n);

// ---- 4. cornice lip (upside-down stairs) around everything at y18 ----
const lips = [];
for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) if (has(x, 18, z)) for (const [dir, dx, dz] of [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]]) {
  const nx = x + dx, nz = z + dz;
  if (nx < 0 || nz < 0 || nx >= N || nz >= N || has(nx, 18, nz)) continue;
  const into = { north: "south", south: "north", west: "east", east: "west" }[dir]; // lip backs onto the wall
  lips.push([nx, 18, nz, B.stairs("quartz", into, "top")]);
}
for (const [x, y, z, p] of lips) SB(x, y, z, p);

// ---- 5. roof balustrade (y19 slab, y20 wall) + kiosks over the piers ----
const wallCells = new Set();
const pishtaqCell = (x, z) => FACES && Object.values(FACES).some((f) => { for (let u = 15; u <= 25; u++) { const [px, pz] = f.xz(u, 8); if (px === x && pz === z) return true; } return false; });
for (let x = FP0; x <= FP1; x++) for (let z = FP0; z <= FP1; z++) {
  if (!inFoot(x, z) || (inFoot(x - 1, z) && inFoot(x + 1, z) && inFoot(x, z - 1) && inFoot(x, z + 1))) continue;
  if (pishtaqCell(x, z)) continue;
  SB(x, 19, z, B.slab("quartz", "bottom")); wallCells.add(`${x},${z}`);
}
for (const k of wallCells) { const [x, z] = k.split(",").map(Number); const w = (a, b) => wallCells.has(`${a},${b}`) ? "low" : "none";
  S(x, 20, z, M.rail, { north: w(x, z - 1), south: w(x, z + 1), east: w(x + 1, z), west: w(x - 1, z), up: "true", waterlogged: "false" }); }
for (const n of Object.keys(FACES)) for (const u of [9, 11, 14, 26, 29, 31]) {
  const [x, z] = FACES[n].xz(u, 8); if (!inFoot(x, z)) continue;
  for (let y = 19; y <= 21; y++) S(x, y, z, M.cream);
  SB(x, 22, z, B.slab("quartz", "bottom"));
}

// ---- 6. drum, dome, finial (brushes) ----
const cx = C + O, cz = C + O;
cylinder(g, { base: [cx, 19, cz], radius: 6, height: 8, block: M.dome });
ring(g, { center: [cx, 22, cz], radius: 6, block: M.black });
ring(g, { center: [cx, 24, cz], radius: 6, block: M.black });
const T = R2 ? [0, 0.1, 0.25, 0.45, 0.6, 0.72, 0.84, 0.93, 1] : [0, 0.2, 0.3, 0.45, 0.6, 0.75, 0.88, 1];
const RR = R2 ? [0.8, 0.94, 1.0, 1.0, 0.93, 0.78, 0.52, 0.32, 0.2] : [0.8, 0.97, 1.0, 0.95, 0.8, 0.55, 0.33, 0.2];
const onion = (t) => { for (let i = 1; i < T.length; i++) if (t <= T[i]) return RR[i - 1] + (RR[i] - RR[i - 1]) * (t - T[i - 1]) / (T[i] - T[i - 1]); return RR.at(-1); };
const domeRes = dome(g, { center: [cx, 27, cz], radius: 7, height: 11, profile: onion, block: M.dome,
  finial: { blocks: [M.gold, M.gold, "end_rod"] } });
console.log("dome", domeRes.refused?.length, domeRes.top, domeRes.layers?.map((l) => `${l.y}:${l.radius}`).join(" "));

// ---- 6b. dome detail (round 2): ring highlights, cream lancet panels, lotus ring ----
const retex = (x, y, z, to) => { // keep shape/state, swap the material family
  const c = g.get(x, y, z); if (!c) return false;
  const m = c.block.match(/^minecraft:smooth_quartz(_stairs|_slab)?$/); if (!m) return false;
  g.set(x, y, z, m[1] ? to + m[1] : (to === "quartz" ? "quartz_block" : to), c.state); return true;
};
if (R2) {
  for (const y of [28, 33]) for (let x = 0; x < 43; x++) for (let z = 0; z < 43; z++) retex(x, y, z, "quartz");
  const hw = (y) => { const dy = Math.abs(y - 32.5) / 4.3; return dy > 1 ? 0 : 2.6 * (1 - dy ** 1.6); };
  for (let y = 28; y <= 37; y++) for (let u = -4; u <= 4; u++) {
    if (Math.abs(u) > hw(y)) continue;
    for (const [fx, fz, ax] of [[0, 1, "x"], [0, -1, "x"], [1, 0, "z"], [-1, 0, "z"]]) {
      for (let d = 12; d >= 0; d--) { // walk inward from outside until the dome shell is hit
        const x = cx + (ax === "x" ? u : fx * d), z = cz + (ax === "x" ? fz * d : u);
        if (retex(x, y, z, "smooth_sandstone")) break;
      }
    }
  }
  for (let x = 0; x < 43; x++) for (let z = 0; z < 43; z++) {
    if (!g.get(x, 35, z) || g.get(x, 36, z)) continue;
    const dx = x - cx, dz = z - cz;
    const facing = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? "west" : "east") : (dz > 0 ? "north" : "south");
    if (Math.abs(dx) + Math.abs(dz) === 0) continue;
    SB(x - O, 36, z - O, B.stairs("quartz", facing, "bottom"));
  }
}

// ---- 7. chhatris (5x5, y19-27) ----
for (const [px, pz] of [[12, 12], [28, 12], [12, 28], [28, 28]]) {
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) for (let y = 19; y <= 21; y++) S(px + dx, y, pz + dz, M.cream);
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { if (R2) SB(px + dx, 22, pz + dz, B.slab("quartz", "top")); else S(px + dx, 22, pz + dz, M.q); }
  dome(g, { center: [px + O, 23, pz + O], radius: R2 ? 1 : 2, height: 4, profile: "bulb", block: M.dome, finial: { block: M.gold, height: 1 } });
}

// ---- 8. minarets (brush shaft + balconies + pavilion cap) ----
for (const [mx, mz] of [[2, 2], [38, 2], [2, 38], [38, 38]]) {
  F([mx - 2, 5, mz - 2], [mx + 2, 6, mz + 2], M.wall);
  F([mx - 2, 7, mz - 2], [mx + 2, 7, mz + 2], M.cream);
  const r = minaret(g, { base: [mx + O, 8, mz + O], height: 18, radius: 1, block: M.dome, postBlock: M.cream, capBlock: M.dome,
    balconies: [{ y: 4, block: M.cream, railing: M.rail }, { y: 11, block: M.cream, railing: M.rail }],
    cap: "chhatri", capHeight: 4, finial: { block: M.gold, height: 1 } });
  if (R2) { // lantern stays; swap the tall cap for a 2-high quartz-stair dome + gold tip so the tip lands on y34
    for (let y = 32; y <= 37; y++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) air(mx + dx, y, mz + dz);
    dome(g, { center: [mx + O, 32, mz + O], radius: 1, height: 2, profile: "bulb", block: M.dome, finial: { block: M.gold, height: 1 } });
  }
  if (mx === 2 && mz === 2) console.log("minaret top", r.top, "refused", r.refused?.length);
}

g.save(OUT);
let maxY = 0; for (const c of g.cells.values()) maxY = Math.max(maxY, c.pos[1]);
console.log(JSON.stringify({ saved: OUT, round: ROUND, cells: g.cells.size, maxY }));
