// 冠德遠見 (OSMw409723853): Xinyi-district residential/office tower, c. 2010s.
// 44 x 30 footprint. Glazed tower on a 4-storey podium, three setback tiers,
// white-concrete spandrels and mullions, blue glass, lit interiors on some
// floors, a recessed lobby with portal on the south face, and a roof parapet
// at y 153 with a penthouse and a short mast.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 44, H = 165, D = 30;
const ROOF = 153;

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw409723853.cells.json", "utf8")
);

const ground = new Map();
const cellList = [];
for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);
  ground.set(x + "," + z, gg);
  cellList.push([x, z, gg]);
}
const inside = (x, z) => ground.has(x + "," + z);

// Setback tiers: each tier covers rect ∩ footprint from the previous top up to `top`.
const TIERS = [
  { x0: 0,  x1: 43, z0: 0,  z1: 29, top: 20 },  // podium, 4 storeys
  { x0: 4,  x1: 39, z0: 4,  z1: 25, top: 100 }, // tower A
  { x0: 8,  x1: 35, z0: 8,  z1: 21, top: 130 }, // tower B
  { x0: 12, x1: 31, z0: 11, z1: 18, top: 150 }, // tower C
];

const inRect = (t, x, z) => x >= t.x0 && x <= t.x1 && z >= t.z0 && z <= t.z1;
const onEdgeOf = (t, x, z) => x === t.x0 || x === t.x1 || z === t.z0 || z === t.z1;
const isCorner = (t, x, z) => (x === t.x0 || x === t.x1) && (z === t.z0 || z === t.z1);
const tierAt = (y) => {
  for (let i = 0; i < TIERS.length; i++) if (y < TIERS[i].top) return i;
  return -1;
};

const g = new Voxels([W, H, D]);

// 1. Foundation from y 0 up to each cell's ground (lighter stone so the slope reads clean).
for (const [x, z, gg] of cellList) {
  for (let y = 0; y < gg; y++) g.set(x, y, z, "smooth_stone");
}

// 2. Storeys: slab / window band / slab, per tier, on each footprint cell.
for (const [x, z, gg] of cellList) {
  for (let y = gg; y < ROOF; y++) {
    const ti = tierAt(y);
    if (ti < 0) break;
    const t = TIERS[ti];
    if (!inRect(t, x, z)) continue;

    const edge = onEdgeOf(t, x, z);
    const dy = y % 5;
    const s = Math.floor(y / 5);

    // Recessed lobby on the south face of the podium, x 17..25.
    if (ti === 0 && s === 0 && edge && z === t.z1 && x >= 17 && x <= 25 && y - gg <= 3) {
      // Portal columns at the lobby edges; door centred on x 21.
      if (x === 17 || x === 25) {
        g.set(x, y, z, "smooth_quartz");
      } else if (x === 21 && y - gg <= 1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south",
          half: y === gg ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (dy === 4 || y - gg === 3) {
        // Canopy band over the lobby.
        g.set(x, y, z, "light_gray_concrete");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }

    // Floor slabs at dy 0 and dy 4 (interior slabs carry the storey above).
    if (dy === 0 || dy === 4) {
      g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    // Window band dy 1..3: glass with white mullions, lit through the air gap.
    if (edge) {
      const idx = (z === t.z0 || z === t.z1) ? x - t.x0 : z - t.z0;
      const mullion = idx % 3 === 0;
      const corner = isCorner(t, x, z);
      // Corners and mullions are full white columns; glass sits behind them.
      g.set(x, y, z, (mullion || corner) ? "white_concrete" : "light_blue_stained_glass");

      if (dy === 2 && !mullion && !corner && ((x * 7 + z * 3 + s * 5) % 4 === 0)) {
        const dx = x === t.x0 ? 1 : (x === t.x1 ? -1 : 0);
        const dz = z === t.z0 ? 1 : (z === t.z1 ? -1 : 0);
        const ix = x + dx, iz = z + dz;
        if ((dx || dz) && inRect(t, ix, iz) && inside(ix, iz)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
    // Interior of the window band stays air (no interiors).
  }
}

// 3. Terrace caps on the rings left by each setback.
for (let i = 0; i < TIERS.length - 1; i++) {
  const a = TIERS[i], b = TIERS[i + 1];
  for (const [x, z, gg] of cellList) {
    if (inRect(a, x, z) && !inRect(b, x, z) && gg <= a.top) {
      g.set(x, a.top, z, "light_gray_concrete");
    }
  }
}

// 4. Roof of the top tier: parapet to y 152 on the edge, roof deck inside.
const t3 = TIERS[3];
for (const [x, z] of cellList.map(([x, z]) => [x, z])) {
  if (!inRect(t3, x, z)) continue;
  if (onEdgeOf(t3, x, z)) {
    for (let y = 150; y <= 152; y++) g.set(x, y, z, "white_concrete");
  } else {
    g.set(x, 150, z, "light_gray_concrete");
  }
}

// 5. Roof penthouse, lit corners, and a short mast topped by a lightning rod.
for (let x = 16; x <= 27; x++) {
  for (let z = 12; z <= 17; z++) {
    if (!inside(x, z) || !inRect(t3, x, z)) continue;
    const rim = x === 16 || x === 27 || z === 12 || z === 17;
    g.set(x, 151, z, rim ? "white_concrete" : "light_gray_concrete");
    g.set(x, 152, z, rim ? "white_concrete" : "light_gray_concrete");
  }
}
for (const [x, z] of [[16, 12], [27, 12], [16, 17], [27, 17]]) {
  if (inside(x, z)) g.set(x, 153, z, "shroomlight");
}
for (let y = 153; y <= 160; y++) {
  for (const x of [21, 22]) for (const z of [14, 15]) g.set(x, y, z, "white_concrete");
}
g.set(21, 161, 14, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw409723853.nbt");
