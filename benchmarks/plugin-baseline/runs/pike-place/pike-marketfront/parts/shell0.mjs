// Part 1, Shell and massing: plot 0 masonry (tiers, plaza deck, housing, M1 and M2 massing, W0 retaining walls).
// Everything is written in site coordinates (plot 0 local x + 81). Openings (shop strips, H windows/doors, M1 windows) stay air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { tierMass, retainingWall, PLOT0, onFootprint, groundAt } from "../vocab.mjs";

const X = PLOT0[0];
const fp = (x, z) => onFootprint(0, x - X, z);
const gr = (x, z) => groundAt(0, x - X, z);
const put = (g, x, y, z, block, state) => { if (g.isAir(x, y, z)) g.set(x, y, z, block, state); };
const DIRS4 = [[-1, 0, "w"], [1, 0, "e"], [0, -1, "n"], [0, 1, "s"]];

// The panel skin of an exposed tier wall: a stripped spruce fin every 5 along the face, light grey panels between,
// every 3rd bay a charcoal (gray_concrete) panel. faces = the open sides of the cell (w/e faces run along z, n/s along x).
function panel(x, z, faces) {
  const u = faces.includes("n") || faces.includes("s") ? x : z;
  if (((u % 5) + 5) % 5 === 0) return ["stripped_spruce_log", { axis: "y" }];
  return [Math.floor(u / 5) % 3 === 2 ? "gray_concrete" : "light_gray_concrete"];
}
// spruce deck strips on the plaza (plan P: local x 80..82, 94..96, 106..108), part of the deck layer at y 28
const WOOD_STRIPS = [[80, 82], [94, 96], [106, 108]];

// One glass tier: mass up to floor deck, a lit air strip (depth) behind the west face from floor+1 to roof-1, solid
// body behind it (light_gray_concrete where exposed, stone_bricks inside), end walls at the ends, roof deck at `roof`.
function tier(g, { x0, x1, z0, z1, floor, roof, depth }) {
  const a = x0 + X, b = x1 + X;
  tierMass(g, { x0: a, x1: b, z0, z1, deck: floor, ground: gr, inside: fp });
  const inBox = (x, z) => x >= a && x <= b && z >= z0 && z <= z1 && fp(x, z);
  for (let z = z0; z <= z1; z++) {
    let xmin = null;
    for (let x = a; x <= b; x++) if (inBox(x, z)) { xmin = x; break; }
    if (xmin === null) continue;
    for (let x = a; x <= b; x++) {
      if (!inBox(x, z)) continue;
      const strip = x < xmin + depth, end = !inBox(x, z - 1) || !inBox(x, z + 1);
      const outer = DIRS4.some(([dx, dz]) => !inBox(x + dx, z + dz));
      const skin = outer ? panel(x, z, DIRS4.filter(([dx, dz]) => !inBox(x + dx, z + dz)).map((d) => d[2])) : null;
      for (let y = floor + 1; y < roof; y++) {
        if (strip && !end) continue;
        if (!outer) { put(g, x, y, z, "stone_bricks"); continue; }
        if (y === roof - 1 && skin[0] !== "stripped_spruce_log") put(g, x, y, z, "gray_concrete");   // charcoal fascia under the deck
        else put(g, x, y, z, ...skin);
      }
      put(g, x, roof, z, roof === 28 && WOOD_STRIPS.some(([p, q]) => x - X >= p && x - X <= q) ? "spruce_planks" : "smooth_stone");
    }
  }
}

function w0(g) {
  // retaining faces on the west edge of each z row, stepping in two courses: top y4 on x 0..6, y6 on x 7..20
  const xw = (z) => { for (let x = 0; x <= 20; x++) if (onFootprint(0, x, z)) return x; return null; };
  const runs = [];
  for (let z = 147; z <= 244; z++) {
    const x = xw(z);
    if (x === null) continue;
    const last = runs[runs.length - 1];
    if (last && last.x === x && last.z1 === z - 1) last.z1 = z; else runs.push({ x, z0: z, z1: z });
  }
  const over = ["dirt", "grass_block"];
  for (const r of runs) {
    retainingWall(g, { x: X + r.x, z0: r.z0, z1: r.z1, top: r.x <= 6 ? 4 : 6, face: "west", over, cap: "block" });
    if (r.x <= 6) for (let z = r.z0; z <= r.z1; z++) if (onFootprint(0, 7, z) && onFootprint(0, 8, z))
      retainingWall(g, { x: X + 7, z0: z, z1: z, top: 6, base: 3, face: "west", over, cap: "block" });
  }
  tierMass(g, { x0: X, x1: X + 6, z0: 147, z1: 244, deck: 4, ground: gr, inside: fp });
  tierMass(g, { x0: X + 7, x1: X + 20, z0: 147, z1: 244, deck: 6, ground: gr, inside: fp });
}

function housing(g) {
  const a = X + 42, b = X + 62, z0 = 70, z1 = 132;
  const inH = (x, z) => x >= a && x <= b && z >= z0 && z <= z1 && fp(x, z);
  const air = new Set();
  for (const F of [20, 27, 34]) for (let k = 0; k < 9; k++) {
    const bz = z0 + 7 * k;
    for (const y of [F + 1, F + 2]) air.add(`${y},${bz + 1}`);               // balcony door
    for (const y of [F + 2, F + 3]) for (let z = bz + 2; z <= bz + 4; z++) air.add(`${y},${z}`);   // window
  }
  for (let x = a; x <= b; x++) for (let z = z0; z <= z1; z++) {
    if (!inH(x, z)) continue;
    const outer = DIRS4.some(([dx, dz]) => !inH(x + dx, z + dz));
    const west = x === a, strip = x <= a + 4 && z > z0 && z < z1;
    // north, south and east faces: a timber fin every 7 and a 3 x 2 lit window per bay per storey (plan FACADES, H)
    const open = DIRS4.filter(([dx, dz]) => !inH(x + dx, z + dz)).map((d) => d[2]);
    const side = !west && open.length === 1 ? open[0] : null;
    const u = side === "e" ? z - z0 : x - a, k7 = ((u % 7) + 7) % 7;
    for (let y = 21; y <= 40; y++) {
      if (y === 27 || y === 34) { put(g, x, y, z, "smooth_stone"); continue; }
      if (strip && !west) continue;
      if (west && air.has(`${y},${z}`)) continue;
      if (side && k7 === 0) { put(g, x, y, z, "stripped_spruce_log", { axis: "y" }); continue; }
      const F = y < 27 ? 20 : y < 34 ? 27 : 34;
      if (side && k7 >= 2 && k7 <= 4 && (y === F + 2 || y === F + 3)) {
        const along = side === "e" ? { north: "true", south: "true" } : { east: "true", west: "true" };
        put(g, x, y, z, "glass_pane", along);
        const [ix, iz] = side === "e" ? [x - 1, z] : side === "n" ? [x, z + 1] : [x, z - 1];
        g.set(ix, y, iz, y === F + 3 ? "ochre_froglight" : "spruce_planks");   // warm room glow behind the glass
        continue;
      }
      put(g, x, y, z, "white_concrete");
    }
    put(g, x, 41, z, "smooth_stone");
    if (outer) put(g, x, 42, z, "smooth_stone");
  }
}

function m1(g) {
  const inM = (x, z) => fp(x, z) && ((x >= X + 98 && x <= X + 111 && z >= 0 && z <= 27) ||
    (x >= X + 98 && x <= X + 118 && z >= 28 && z <= 41) || (x >= X + 105 && x <= X + 118 && z >= 42 && z <= 69));
  const outs = (x, z) => DIRS4.filter(([dx, dz]) => !inM(x + dx, z + dz)).map((d) => d[2]);
  const depthOf = (x, z) => {
    for (let k = 1; k <= 5; k++) if (DIRS4.some(([dx, dz]) => !inM(x + dx * k, z + dz * k))) return k;
    return 6;
  };
  for (let x = X + 98; x <= X + 118; x++) for (let z = 0; z <= 69; z++) {
    if (!inM(x, z)) continue;
    const d = depthOf(x, z), ring = d === 1, o = outs(x, z);
    const face = ring && o.length === 1 ? o[0] : null;
    const u = face === "w" || face === "e" ? z : x;
    const same = (du) => { const [xx, zz] = face === "w" || face === "e" ? [x, z + du] : [x + du, z]; const q = outs(xx, zz); return q.length === 1 && q[0] === face; };
    const edgeOk = face && same(-2) && same(2) && same(-1) && same(1);
    const win = edgeOk && (((u % 4) + 4) % 4) >= 2;
    const shop = edgeOk && face === "e" && ((u % 6) + 6) % 6 >= 1 && ((u % 6) + 6) % 6 <= 4;
    for (let y = gr(x, z); y <= 33; y++) put(g, x, y, z, "polished_andesite");
    put(g, x, 34, z, ring ? "polished_andesite" : "smooth_stone");
    for (let y = 35; y <= 51; y++) {
      if (y === 40 || y === 46) { put(g, x, y, z, ring ? "smooth_quartz" : "smooth_stone"); continue; }
      if (ring) {
        if (shop && y >= 35 && y <= 38) continue;
        if (win && ((y >= 41 && y <= 43) || (y >= 47 && y <= 49))) continue;
        put(g, x, y, z, "quartz_bricks");
      } else if (d >= 6) put(g, x, y, z, "quartz_bricks");
    }
    put(g, x, 52, z, ring ? "quartz_bricks" : "smooth_stone");
  }
}

function m2(g) {
  const a = X + 119, b = X + 125;
  for (let x = a; x <= b; x++) for (let z = 70; z <= 97; z++) {
    if (!fp(x, z)) continue;
    for (let y = gr(x, z); y <= 30; y++) put(g, x, y, z, "stone_bricks");
    put(g, x, 31, z, "smooth_stone");
    if ((z - 70) % 4 === 0 || z === 97) put(g, x, 36, z, ...B.wood("stripped_spruce", "x"));
    put(g, x, 37, z, "spruce_planks");
  }
}

export function build(g) {
  w0(g);
  tier(g, { x0: 21, x1: 41, z0: 91, z1: 244, floor: 6, roof: 13, depth: 5 });
  tier(g, { x0: 42, x1: 69, z0: 63, z1: 230, floor: 13, roof: 20, depth: 5 });
  tier(g, { x0: 70, x1: 125, z0: 140, z1: 230, floor: 20, roof: 28, depth: 5 });
  tier(g, { x0: 77, x1: 125, z0: 98, z1: 139, floor: 22, roof: 28, depth: 8 });
  housing(g);
  m1(g);
  m2(g);
}
