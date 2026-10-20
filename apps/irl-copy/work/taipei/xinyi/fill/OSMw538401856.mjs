import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-style 1970s-80s concrete commercial block, two storeys over a street-side arcade.
// Roof deck at y 10, parapet at y 11 (lidar roof ~11 above lowest ground).
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401856";
const W = 30, D = 18, H = 23;
const ROOF = 10;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = (Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw)))
  .map((c) => [c[0] | 0, c[1] | 0, Math.max(0, Math.min(H - 3, Math.round(Number(c[2]) || 0)))])
  .filter(([x, z]) => x >= 0 && x < W && z >= 0 && z < D);

const G = new Map();
for (const [x, z, g] of list) G.set(`${x},${z}`, g);
const has = (x, z) => G.has(`${x},${z}`);

const g3 = new Voxels([W, H, D]);

// Panes on a north/south-facing wall connect east/west, and vice versa.
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

function exposure(x, z) {
  return { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
}
function isEdge(x, z) {
  const e = exposure(x, z);
  return e.n || e.s || e.w || e.e;
}

// Returns [blockId, props] for a perimeter wall cell at height y.
function wall(x, z, y, g, ex, low) {
  const zFace = ex.n || ex.s;
  const xFace = ex.w || ex.e;
  const corner = zFace && xFace;
  if (corner) return ["white_concrete", {}];

  const idx = zFace ? x : z;
  const pane = zFace ? PANE_Z : PANE_X;
  const street = ex.s && !corner;

  if (low && y <= 4) {
    if (street) {
      // Arcade: concrete columns every 4 cells, shopfront glass between, hanging lanterns under the slab.
      if (idx % 4 === 0) return ["white_concrete", {}];
      if (y === 4 && idx % 4 === 2) return ["lantern", { hanging: "true", waterlogged: "false" }];
      return ["glass_pane", pane];
    }
    if (y >= g + 1 && y <= 3 && idx % 3 === 1) return ["glass_pane", pane];
    return ["white_concrete", {}];
  }

  // Upper storey (or single storey on a high cell).
  const spandrel = y === 9 || y === (low ? 6 : g + 1);
  if (spandrel) return ["light_gray_concrete", {}];
  if (idx % 3 === 1) return ["glass_pane", pane];
  return ["white_concrete", {}];
}

for (const [x, z, g] of list) {
  const ex = exposure(x, z);
  const edge = ex.n || ex.s || ex.w || ex.e;
  const low = g <= 4;

  // Foundation up to the cell's ground, then the ground-floor surface.
  for (let y = 0; y < g; y++) g3.set(x, y, z, "stone_bricks", {});
  if (g >= 10) {
    g3.set(x, g, z, "stone_bricks", {});
    if (edge) g3.set(x, g + 1, z, "white_concrete", {});
    continue;
  }
  g3.set(x, g, z, edge ? "stone_bricks" : "smooth_quartz", {});

  // Storey walls, mid floor slab and the street sign band.
  for (let y = g + 1; y <= ROOF - 1; y++) {
    if (low && y === 5) {
      const red = ex.s && edge;
      g3.set(x, y, z, red ? "red_terracotta" : "smooth_quartz", {});
      continue;
    }
    if (!edge) continue; // interior: air, no interior fit-out
    const [b, p] = wall(x, z, y, g, ex, low);
    g3.set(x, y, z, b, p);
  }

  // Roof deck (interior full, perimeter cornice course).
  g3.set(x, ROOF, z, edge ? "stone_bricks" : "smooth_quartz", {});
  // Parapet.
  if (edge) g3.set(x, ROOF + 1, z, "white_concrete", {});
}

// Warm light: glowstone just inside some upper-storey windows.
for (const [x, z, g] of list) {
  if (g > 4) continue;
  const ex = exposure(x, z);
  const edge = ex.n || ex.s || ex.w || ex.e;
  if (!edge) continue;
  const zFace = ex.n || ex.s;
  const xFace = ex.w || ex.e;
  if (zFace && xFace) continue;
  const idx = zFace ? x : z;
  if (idx % 6 !== 1) continue;
  const ix = zFace ? x : (ex.w ? x + 1 : x - 1);
  const iz = zFace ? (ex.s ? z - 1 : z + 1) : z;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  g3.set(ix, 7, iz, "glowstone", {});
}

// Ground-floor entrance on the street front, at the centre column.
{
  const dx = Math.floor(W / 2), dz = D - 1;
  if (has(dx, dz)) {
    const ex = exposure(dx, dz);
    const g = G.get(`${dx},${dz}`);
    if (ex.s && g <= 2) {
      g3.set(dx, g + 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g3.set(dx, g + 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }
}

// Rooftop water tank, a 3x3 block set near the back of the roof.
{
  const cx = 20, cz = 6;
  let ok = true;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (!has(cx + dx, cz + dz) || G.get(`${cx + dx},${cz + dz}`) > 9) ok = false;
  if (ok) {
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        for (let y = ROOF + 1; y <= ROOF + 3; y++)
          g3.set(cx + dx, y, cz + dz, "light_gray_concrete", {});
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        g3.set(cx + dx, ROOF + 4, cz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g3.save(`${DIR}/${ID}.nbt`);
