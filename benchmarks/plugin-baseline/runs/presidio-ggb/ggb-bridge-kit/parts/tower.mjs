// Plot 0 tower (v2, from the owner's comment): fender, pier, fluted stepped legs, 2-thick X brace, tie, lower strut,
// four portal struts with nested recessed frames and stepped haunches, stepped crowns over the cable saddles.
// The tower is composed cell by cell in a map (west leg drawn, east leg mirrored x' = 46 - x) and flushed at the end,
// so recesses are made by never placing the front cell (no carving, nothing left for later parts to trip on).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { fenderRing, STEEL, BACK, HIGHLIGHT, SLAB, SIDEWALK, PIER_TOP, SHROOM, GLOW, WARNING_GLASS, TIE, LOWER_STRUT } from "../vocab.mjs";

const M = 46; // tower mirror: x' = 46 - x
const FLIP = { east: "west", west: "east", north: "north", south: "south" };

// Leg stages (west frame): narrowing by 1 on the outer sides at y 52 (z), 70 (x, west face), 88 (z); inner face x 18
// never moves. ribs/channels: the 1-wide recessed channels per face (x on north/south faces, z on west/east faces).
const STAGES = [
  { y: [6, 51], x: [14, 18], z: [8, 15], nsCh: [15, 17], sideCh: [10, 13] },
  { y: [52, 69], x: [14, 18], z: [9, 14], nsCh: [15, 17], sideCh: [10, 13] },
  { y: [70, 87], x: [15, 18], z: [9, 14], nsCh: [16], sideCh: [10, 13] },
  { y: [88, 111], x: [15, 18], z: [10, 13], nsCh: [16], sideCh: [11, 12] },
];
// solid orange_concrete band courses (channels stop at them); y 34..39 stays solid where the deck and walkways meet
const BANDS = [6, 7, 50, 51, 68, 69, 86, 87, 110, 111];
const SOLID_Y = (y) => BANDS.includes(y) || (y >= 34 && y <= 39);

// portal struts: x 19..27; 6 deep where the legs are (stages 2-3), 4 deep above y 88
const STRUTS = [
  { y: [55, 60], z: [9, 14] },
  { y: [72, 77], z: [9, 14] },
  { y: [90, 95], z: [10, 13] },
  { y: [106, 112], z: [10, 13], light: 114 },
];

export function build(g) {
  fenderRing(g, 23, 11.5);
  g.fill([11, 1, 5], [35, 4, 18], SIDEWALK);
  g.fill([11, 5, 5], [35, 5, 18], PIER_TOP);

  const cells = new Map(); // "x,y,z" -> [block, state]
  const key = (x, y, z) => `${x},${y},${z}`;
  const put = (x, y, z, block, state) => cells.set(key(x, y, z), [block, state]);
  const del = (x, y, z) => cells.delete(key(x, y, z));
  const has = (x, y, z) => cells.has(key(x, y, z));
  // west-frame writer for one leg-side element: draws it and its mirror (facings flipped)
  const both = (x, y, z, block, state) => {
    put(x, y, z, block, state);
    const s = state && state.facing ? { ...state, facing: FLIP[state.facing] } : state;
    put(M - x, y, z, block, s);
  };
  const box = (x0, y0, z0, x1, y1, z1, block) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, block);
  };

  // ---- legs: solid steel, bands
  for (const s of STAGES)
    for (let y = s.y[0]; y <= s.y[1]; y++)
      for (let x = s.x[0]; x <= s.x[1]; x++)
        for (let z = s.z[0]; z <= s.z[1]; z++) both(x, y, z, BANDS.includes(y) ? HIGHLIGHT : STEEL);

  // ---- below the deck: tie, 2-thick X brace (y 8..27, 4 deep), lower strut carrying the deck
  box(TIE.x[0], TIE.y[0], TIE.z[0], TIE.x[1], TIE.y[1], TIE.z[1], STEEL);
  let prev = null;
  for (let y = 8; y <= 27; y++) {
    const x = 19 + Math.round(((y - 8) * 7) / 19); // 19..26, the diagonal 2 thick (x and x+1)
    const xs = [x, x + 1];
    if (prev !== null && x - prev > 1) xs.push(x - 1);
    prev = x;
    for (const xx of xs) for (let z = 10; z <= 13; z++) { put(xx, y, z, STEEL); put(M - xx, y, z, STEEL); }
  }
  box(LOWER_STRUT.x[0], LOWER_STRUT.y[0], LOWER_STRUT.z[0], LOWER_STRUT.x[1], LOWER_STRUT.y[1], LOWER_STRUT.z[1], STEEL);

  // ---- portal struts with nested recessed frames, stepped haunches under each, shroomlight on top
  for (const st of STRUTS) {
    const [b, t] = st.y, [z0, z1] = st.z;
    box(19, b, z0, 27, t, z1, STEEL);
    const deep = z1 - z0 >= 5;
    for (const [face, dz] of [[z0, 1], [z1, -1]]) {
      for (let x = 20; x <= 26; x++)
        for (let y = b + 1; y <= t - 1; y++) {
          const inner = x >= 21 && x <= 25 && y >= b + 2 && y <= t - 2;
          if (deep) {
            // frame flush, ring recessed 1, centre recessed 2 (3 nested steps)
            del(x, y, face);
            if (inner) { del(x, y, face + dz); put(x, y, face + 2 * dz, BACK); }
            else put(x, y, face + dz, BACK);
          } else {
            // 4 deep: frame flush, ring recessed 1, raised orange panel inside it
            const panel = x >= 22 && x <= 24 && inner;
            if (panel) put(x, y, face, HIGHLIGHT);
            else { del(x, y, face); put(x, y, face + dz, BACK); }
          }
        }
    }
    const ly = st.light ?? t;
    put(23, ly, 11, SHROOM); put(23, ly, 12, SHROOM);
    // stepped/chamfered top corners of the opening below: 3 steps of steel + upside-down stairs
    for (let z = z0; z <= z1; z++)
      for (let i = 1; i <= 3; i++) {
        const y = b - i, n = 3 - i; // solid cells from the leg, then one stair
        for (let k = 0; k < n; k++) both(19 + k, y, z, STEEL);
        both(19 + n, y, z, ...B.stairs("smooth_red_sandstone", "west", "top"));
      }
  }
  // top strut crown
  box(19, 113, 10, 27, 113, 13, STEEL);
  box(21, 114, 11, 25, 114, 12, STEEL);
  put(23, 114, 11, SHROOM); put(23, 114, 12, SHROOM);

  // ---- fluting by exclusion: channel front cell left out, red_terracotta behind it; faces stay solid where something
  // abuts them (struts, haunches, brace, deck level)
  for (const s of STAGES)
    for (let y = s.y[0]; y <= s.y[1]; y++) {
      if (SOLID_Y(y)) continue;
      const faces = [];
      for (const x of s.nsCh) faces.push([x, s.z[0], 0, 1], [x, s.z[1], 0, -1]); // north / south faces
      for (const z of s.sideCh) faces.push([s.x[0], z, 1, 0], [s.x[1], z, -1, 0]); // west / inner faces
      for (const [x, z, dx, dz] of faces) {
        if (has(x - dx, y, z - dz)) continue; // something built against the face
        both(x + dx, y, z + dz, BACK);
        del(x, y, z); del(M - x, y, z);
      }
    }
  // lamp panels in the inner faces over the portal roadway
  for (const z of [11, 12]) for (const y of [40, 41]) both(18, y, z, SHROOM);

  // ---- setback ledges: stairs on the lower stage's exposed top course, back against the leg
  for (let x = 14; x <= 18; x++) { both(x, 52, 8, ...B.stairs("smooth_red_sandstone", "south")); both(x, 52, 15, ...B.stairs("smooth_red_sandstone", "north")); }
  for (let z = 9; z <= 14; z++) both(14, 70, z, ...B.stairs("smooth_red_sandstone", "east"));
  for (let x = 15; x <= 18; x++) { both(x, 88, 9, ...B.stairs("smooth_red_sandstone", "south")); both(x, 88, 14, ...B.stairs("smooth_red_sandstone", "north")); }

  // ---- crown: saddle housing (y 112..113, the cable groove x 16 open), stepped tiers to the warning light at y 116
  for (let y = 112; y <= 113; y++)
    for (const x of [15, 17, 18]) for (let z = 10; z <= 13; z++) both(x, y, z, y === 113 ? HIGHLIGHT : STEEL);
  // tier 1 (y 114): the housing roof x 15..18 z 11..12 with stair skirts on the z 10 / z 13 rows
  for (let x = 15; x <= 18; x++) {
    both(x, 114, 11, STEEL); both(x, 114, 12, STEEL);
    both(x, 114, 10, ...B.stairs("smooth_red_sandstone", "south")); both(x, 114, 13, ...B.stairs("smooth_red_sandstone", "north"));
  }
  // tier 2 (y 115): glowstone core x 16..17 z 11..12 with slabs on its ends; tier 3 (y 116): red warning glass
  for (const z of [11, 12]) {
    both(15, 115, z, SLAB, { type: "bottom" }); both(18, 115, z, SLAB, { type: "bottom" });
    both(16, 115, z, GLOW); both(17, 115, z, GLOW);
    both(16, 116, z, WARNING_GLASS); both(17, 116, z, WARNING_GLASS);
  }

  for (const [k, [block, state]] of cells) {
    const [x, y, z] = k.split(",").map(Number);
    g.set(x, y, z, block, state);
  }
}
