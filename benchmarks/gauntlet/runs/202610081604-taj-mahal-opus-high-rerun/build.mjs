// Taj Mahal — generator. Spec coords (spec.md): plinth x0..40, z0..40, centre (20,20); grid = spec + 1 (apron ring).
// Usage: node build.mjs <out.nbt> [round]
import { Grid, B, face } from "../../../../../minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "../../../../../minecraft-design/tools/src/structure.mjs";
import { dome, minaret } from "../../../../../minecraft-design/tools/src/shapes-curved.mjs";

const OUT = process.argv[2] ?? "round-1.nbt";
const ROUND = Number(process.argv[3] ?? 1);
const g = new Grid([43, 42, 43], { dataVersion: DATA_VERSIONS["26.3"] });
const R2 = ROUND >= 2;                         // round-2 fixes (round 1 stays reproducible)
const O = 1;                                   // spec -> grid offset
const C = 20;                                  // centre (spec)

// palette by role (spec MATERIAL MAP — binding)
const M = {
  wall: "calcite", shell: "smooth_quartz", hi: "quartz_block", trim: "smooth_sandstone",
  shadow: "andesite", black: "polished_blackstone", jali: "iron_bars", gold: "gold_block",
  brick: "bricks", rail: "diorite_wall",
};

// ---- placement in spec coords, with 4-fold rotation about (20,20) and mirror across x = 20 -------------------------
const P = (x, y, z, b, st) => g.set(x + O, y, z + O, b, st);
const rotXZ = (x, z, r) => { for (let i = 0; i < r; i++) [x, z] = [2 * C - z, x]; return [x, z]; };
const rotFacing = (f, r) => { for (let i = 0; i < r; i++) f = face.cw(f); return f; };
const rotState = (st, r) => {
  if (!st) return st;
  const s = { ...st };
  if (s.facing && s.facing !== "up" && s.facing !== "down") s.facing = rotFacing(s.facing, r);
  if (s.axis && r % 2) s.axis = s.axis === "x" ? "z" : s.axis === "z" ? "x" : s.axis;
  return s;
};
/** put for side r (0 = north face, 1 = east, 2 = south, 3 = west), mirrored across the face's centre line. */
const side = (r) => (x, y, z, b, st) => {
  for (const [xx, s] of [[x, st], [2 * C - x, st && st.facing ? { ...st, facing: face.mirrorX(st.facing) } : st]]) {
    const [X, Z] = rotXZ(xx, z, r);
    P(X, y, Z, b, rotState(s, r));
  }
};
const air = "minecraft:air";
const fill = (put, x0, y0, z0, x1, y1, z1, b, st) => {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) put(x, y, z, b, st);
};

// ---- 1. base: apron, plinth, terrace -------------------------------------------------------------------------------
fill(P, -1, 0, -1, 41, 0, 41, M.brick);
fill(P, 0, 1, 0, 40, 4, 40, M.wall);
for (let r = 0; r < 4; r++) {
  const s = side(r);
  // plinth face: panel recesses (3 wide, every 4) carved by not placing the face block; brick base course at y1
  for (let x = 0; x <= 20; x++) {
    s(x, 1, 0, M.brick);
    if (x % 4 !== 0 && x > 0 && x < 40) fill(s, x, 2, 0, x, 3, 0, air);
    else fill(s, x, 2, 0, x, 3, 0, M.trim);          // cream pier strips between panels
    s(x, 4, 0, M.hi);                                 // plinth cap course
  }
  // terrace parapet y5–6 between the minaret bases, posts every 4
  for (let x = 5; x <= 20; x++) {
    if (x % 4 === 0) { s(x, 5, 0, M.hi); s(x, 6, 0, M.hi); s(x, 7, 0, ...B.slab("quartz")); }
    else if (R2) { s(x, 5, 0, M.wall); s(x, 6, 0, M.wall); }   // R2: continuous low wall, posts carry the caps
    else { s(x, 5, 0, M.wall); s(x, 6, 0, ...B.slab("quartz")); }
  }
}

// ---- 2. mausoleum mass x8..32, z8..32, solid to y18; the roof deck is y18 ----------------------------------------
fill(P, 8, 5, 8, 32, 18, 32, M.wall);

function mausoleumFace(r) {
  const s = side(r);
  // chamfered corner: drop (8,8),(9,8),(8,9) — diagonal face (10,8),(9,9),(8,10)
  fill(s, 8, 5, 8, 9, 20, 8, air); fill(s, 8, 5, 9, 8, 20, 9, air);
  // skirting y5 (cream), cornice line etc. on the flat face x10..14 (mirrored to 26..30)
  for (let x = 10; x <= 14; x++) s(x, 5, 8, M.trim);
  s(9, 5, 9, M.trim);
  // pier x11: cream pilaster y5..18
  fill(s, 11, 5, 8, 11, 18, 8, M.trim);
  // niche bay x12..14: lower niche y6..9, upper y11..14, 1 deep (carved by not placing), andesite back
  for (const [y0, y1] of [[6, 9], [11, 14]]) {
    fill(s, 12, y0, 8, 14, y1, 8, air);
    fill(s, 12, y0, 9, 14, y1, 9, M.shadow);
    s(12, y1, 8, ...B.stairs("quartz", "west", "top"));   // inverted-stair pointed head
    s(14, y1, 8, ...B.stairs("quartz", "east", "top"));
  }
  fill(s, 13, 6, 9, 13, 7, 9, M.jali); s(13, 6, 10, M.shadow); s(13, 7, 10, M.shadow);    // small jali in the lower niche
  // diagonal niches on the chamfer (cell 9,9), backed by andesite
  for (const [y0, y1] of [[6, 9], [11, 14]]) {
    fill(s, 9, y0, 9, 9, y1, 9, air);
    fill(s, 10, y0, 9, 10, y1, 10, M.shadow); fill(s, 9, y0, 10, 9, y1, 10, M.shadow);
  }
  // frieze y16..18: one black line at y17 across the flat face and chamfer
  for (let x = 10; x <= 14; x++) s(x, 17, 8, M.black);
  s(9, 17, 9, M.black);
  // cornice y19 (upside-down quartz stairs, overhang 1) + balustrade parapet y19..20
  for (let x = 10; x <= 14; x++) { s(x, 19, 7, ...B.stairs("quartz", "south", "top")); s(x, 19, 8, M.hi); s(x, 20, 8, M.rail); }
  s(9, 19, 8, ...B.slab("quartz", "top")); s(8, 19, 9, ...B.slab("quartz", "top"));
  s(9, 19, 9, M.hi); s(9, 20, 9, M.rail);
  // small pillar kiosks over the piers and the chamfer edge (y19..22)
  for (const [x, z] of [[11, 8], [10, 8]]) { fill(s, x, 19, z, x, 21, z, M.trim); s(x, 22, z, ...B.slab("quartz")); }

  // ---- pishtaq x15..25, proud at z7, rising to y21 ----
  fill(s, 15, 5, 7, 20, 21, 7, M.wall);
  fill(s, 15, 19, 8, 20, 21, 8, M.wall);                 // back it above the roof line
  fill(s, 15, 5, 7, 15, 21, 7, M.trim);                  // flanking cream pilaster
  fill(s, 15, 22, 7, 15, 23, 7, M.trim); s(15, 24, 7, ...B.slab("quartz"));   // pinnacle
  for (let x = 16; x <= 20; x++) s(x, 22, 7, ...B.slab("quartz"));             // coping
  fill(s, 16, 6, 7, 16, 19, 7, M.black);                 // black frame band
  fill(s, 16, 19, 7, 20, 19, 7, M.black);
  // iwan: 3 deep (z8..10) with andesite side walls/vault and back wall at z11
  if (R2) fill(s, 17, 5, 11, 20, 17, 11, M.shadow);       // R2: only the back wall is shadow grey; vault + sides stay white
  else fill(s, 16, 5, 8, 20, 18, 11, M.shadow);
}
for (let r = 0; r < 4; r++) mausoleumFace(r);

// iwan arch: stair-stepped pointed arch, springing y12, peak y17, carved (x17..23, z7..10). Not mirrorable (spans x),
// so draw per side with the rotation applied to an explicit profile.
function iwan(r) {
  const p = (x, y, z, b, st) => { const [X, Z] = rotXZ(x, z, r); P(X, y, Z, b, rotState(st, r)); };
  // half-widths of the opening per row above springing: y13..17
  const open = { 13: 3, 14: 2, 15: 2, 16: 1, 17: 0 };
  for (let z = 7; z <= 10; z++) {
    for (let y = 5; y <= 17; y++) {
      const hw = y <= 12 ? 3 : open[y];
      for (let dx = -hw; dx <= hw; dx++) p(C + dx, y, z, air);
      if (y > 12 && hw < 3 && (open[y - 1] ?? 3) > hw) {     // a step: inverted stairs on the new shoulder
        p(C - hw - 1, y, z, ...B.stairs("quartz", "west", "top"));
        p(C + hw + 1, y, z, ...B.stairs("quartz", "east", "top"));
      }
    }
  }
  // back wall z11: andesite with door + jali inside a black frame
  for (let x = 17; x <= 23; x++) for (let y = 5; y <= 17; y++) p(x, y, 11, M.shadow);
  const fTop = R2 ? 10 : 15;
  for (let y = 5; y <= fTop; y++) { p(18, y, 11, M.black); p(22, y, 11, M.black); }
  for (let x = 18; x <= 22; x++) p(x, fTop, 11, M.black);
  for (let x = 19; x <= 21; x++) {
    for (let y = 5; y <= 9; y++) { p(x, y, 11, M.jali); p(x, y, 12, M.black); }      // door (dark behind)
    for (let y = R2 ? 11 : 10; y <= 14; y++) { p(x, y, 11, M.jali); p(x, y, 12, M.shadow); }   // jali window
  }
  if (R2) { p(19, 15, 11, ...B.stairs("quartz", "west", "top")); p(21, 15, 11, ...B.stairs("quartz", "east", "top")); }  // jali arched head
}
for (let r = 0; r < 4; r++) iwan(r);

// R2 onion: edge radius (blocks) at height h above y27 — flares past the drum, full bulge y29..31, concave pinch to 3 wide
const ONION_PTS = [[0, 6.3], [1, 6.9], [2.5, 7.45], [4.5, 7.45], [5.5, 7.3], [6.5, 6.9], [7.5, 6.0], [8.5, 4.6], [9.5, 2.8], [10.5, 1.5], [11, 1.0]];
function ONION(t) {
  const h = t * 11;
  for (let i = 1; i < ONION_PTS.length; i++) {
    const [h0, r0] = ONION_PTS[i - 1], [h1, r1] = ONION_PTS[i];
    if (h <= h1) return (r0 + (r1 - r0) * ((h - h0) / (h1 - h0))) / 7.5;
  }
  return 1.2 / 7.5;
}
// ---- 3. drum + onion dome at the centre ------------------------------------------------------------------------
const d = dome(g, {
  center: [C + O, 19, C + O], radius: 7, height: 11, profile: R2 ? ONION : "onion", block: M.shell,
  stairsBlock: "quartz_stairs", slabBlock: "quartz_slab",
  drum: { height: 8, radius: 6, block: M.shell },
  finial: { blocks: [M.gold, M.gold, "end_rod"] },
});
for (const y of [22, 24]) for (let x = 0; x < 43; x++) for (let z = 0; z < 43; z++) {
  const c = g.get(x, y, z);
  if (c && /smooth_quartz$/.test(c.block) && Math.hypot(x - C - O, z - C - O) < 8) g.set(x, y, z, M.black);
}

// R2: cream pointed-oval lancet panels (outline) on the four faces of the dome, y28..35
if (R2) for (let r = 0; r < 4; r++) for (let y = 28; y <= 35; y++) for (let dx = -3; dx <= 3; dx++) {
  const e = Math.hypot(dx / 3.2, (y - 31) / 3.6) + (y > 31 ? Math.abs(dx) * 0.08 * (y - 31) : 0);   // pointed top
  if (e > 1.05 || e < 0.72) continue;
  for (let dz = -9; dz <= 0; dz++) {                    // outermost solid cell toward the face
    const [X, Z] = rotXZ(C + dx, C + dz, r);
    const c = g.get(X + O, y, Z + O);
    if (!c || /air$/.test(c.block)) continue;
    if (/smooth_quartz$/.test(c.block)) P(X, y, Z, M.trim);
    else if (/stairs$/.test(c.block)) P(X, y, Z, "smooth_sandstone_stairs", c.state);
    else if (/slab$/.test(c.block)) P(X, y, Z, "smooth_sandstone_slab", c.state);
    break;
  }
}

// ---- 4. chhatris (5x5, y19..27) at (12,12) and rotations ------------------------------------------------------
for (let r = 0; r < 4; r++) {
  const [cx, cz] = rotXZ(12, 12, r);
  for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) fill(P, cx + dx, 19, cz + dz, cx + dx, 21, cz + dz, M.trim);
  fill(P, cx - 2, 22, cz - 2, cx + 2, 22, cz + 2, M.hi);
  for (let i = -3; i <= 3; i++) {                        // chhajja: upside-down stair eave
    P(cx + i, 22, cz - 3, ...B.stairs("quartz", "south", "top")); P(cx + i, 22, cz + 3, ...B.stairs("quartz", "north", "top"));
    if (Math.abs(i) < 3) { P(cx - 3, 22, cz + i, ...B.stairs("quartz", "east", "top")); P(cx + 3, 22, cz + i, ...B.stairs("quartz", "west", "top")); }
  }
  dome(g, { center: [cx + O, 23, cz + O], radius: 2, height: 4, profile: "bulb", block: M.shell,
    stairsBlock: "quartz_stairs", slabBlock: "quartz_slab", finial: { block: M.gold, height: 1 } });
}

// ---- 5. minarets at (2,2) and rotations ------------------------------------------------------------------------
for (let r = 0; r < 4; r++) {
  const [cx, cz] = rotXZ(2, 2, r);
  fill(P, cx - 2, 5, cz - 2, cx + 2, 6, cz + 2, M.shell);
  fill(P, cx - 2, 7, cz - 2, cx + 2, 7, cz + 2, M.trim);
  minaret(g, { base: [cx + O, 8, cz + O], height: 18, radius: 1, block: M.shell,
    balconies: [{ y: 4, block: M.trim, railing: M.rail }, { y: 11, block: M.trim, railing: M.rail }],
    cap: "chhatri", capBlock: M.shell, postBlock: M.trim, capHeight: 4,
    stairsBlock: "quartz_stairs", slabBlock: "quartz_slab", finial: { block: M.gold, height: 1 } });
  if (R2) {
    // spec lantern: 5x5 cream gallery y26, pillared 5x5 lantern y27..31, quartz-stair dome y32..33, gold tip y34
    fill(P, cx - 3, 26, cz - 3, cx + 3, 36, cz + 3, air);
    fill(P, cx - 2, 26, cz - 2, cx + 2, 26, cz + 2, M.trim);
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) fill(P, cx + dx, 27, cz + dz, cx + dx, 30, cz + dz, M.trim);
    fill(P, cx, 27, cz, cx, 30, cz, M.shell);                                    // core column inside the open lantern
    fill(P, cx - 1, 31, cz - 1, cx + 1, 31, cz + 1, M.hi);
    for (let i = -2; i <= 2; i++) {                                              // eave lip within the 5x5
      P(cx + i, 31, cz - 2, ...B.stairs("quartz", "south", "top")); P(cx + i, 31, cz + 2, ...B.stairs("quartz", "north", "top"));
      if (Math.abs(i) < 2) { P(cx - 2, 31, cz + i, ...B.stairs("quartz", "east", "top")); P(cx + 2, 31, cz + i, ...B.stairs("quartz", "west", "top")); }
    }
    for (let i = -2; i <= 2; i++) {                                              // stair dome y32
      const corner = Math.abs(i) === 2;
      if (corner) continue;
      P(cx + i, 32, cz - 2, ...B.stairs("quartz", "south")); P(cx + i, 32, cz + 2, ...B.stairs("quartz", "north"));
      P(cx - 2, 32, cz + i, ...B.stairs("quartz", "east")); P(cx + 2, 32, cz + i, ...B.stairs("quartz", "west"));
    }
    for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) P(cx + dx, 32, cz + dz, ...B.slab("quartz"));
    fill(P, cx - 1, 32, cz - 1, cx + 1, 32, cz + 1, M.shell);
    P(cx, 33, cz - 1, ...B.stairs("quartz", "south")); P(cx, 33, cz + 1, ...B.stairs("quartz", "north"));
    P(cx - 1, 33, cz, ...B.stairs("quartz", "east")); P(cx + 1, 33, cz, ...B.stairs("quartz", "west"));
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P(cx + dx, 33, cz + dz, ...B.slab("quartz"));
    P(cx, 33, cz, M.shell); P(cx, 34, cz, M.gold);
  }
}

console.log(JSON.stringify({ saved: g.save(OUT), domeTop: d.top, layers: d.layers?.map((l) => `${l.y}:${l.radius}`).join(" ") }));
