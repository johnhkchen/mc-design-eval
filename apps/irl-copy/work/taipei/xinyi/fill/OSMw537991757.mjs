import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991757";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 17;
const g = new Voxels([W, H, D]);

// ---- helpers -------------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));
const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

function put(x, y, z, id, props) {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward directions. A face exists where the neighbour is outside the footprint.
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const facesOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Along-face index: x for north/south walls, z for east/west walls.
const alongIndex = (d, x, z) => (d.dz !== 0 ? x : z);

// Pane connection props so glass runs continuously along its wall.
const paneProps = (d) => {
  const alongX = d.dz !== 0;
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

// Pick the entrance: middle cell of the longest single-face run.
const groups = {};
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const f = facesOf(x, z);
  if (f.length === 1) (groups[f[0].name] ??= []).push({ x, z, d: f[0] });
}
let entrance = null;
{
  let best = [];
  for (const k of Object.keys(groups)) if (groups[k].length > best.length) best = groups[k];
  if (best.length) {
    best.sort((a, b) => alongIndex(a.d, a.x, a.z) - alongIndex(b.d, b.x, b.z));
    entrance = best[Math.floor(best.length / 2)];
  }
}
const isEntrance = (x, z) => entrance && entrance.x === x && entrance.z === z;

// ---- per-cell massing ----------------------------------------------------
// Storey 1: slab at G, walls G+1..G+4 (shopfront).
// Storey 2: slab at G+5, walls G+6..G+9.
// Roof slab at G+10, parapet at G+11 (roof is 11 above its ground).
for (const [x, z, gr] of cells) {
  const G = gr;
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const single = faces.length === 1 ? faces[0] : null;

  // Foundation
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // Floor and roof slabs across the full footprint (no interiors)
  put(x, G, z, perim ? "stone_bricks" : "smooth_stone");
  put(x, G + 5, z, perim ? "white_concrete" : "smooth_stone");
  put(x, G + 10, z, "light_gray_concrete");

  if (!perim) {
    // Roof equipment on the interior roof
    if ((x * 3 + z * 5) % 7 === 0) put(x, G + 11, z, "light_gray_concrete");
    continue;
  }

  // Corners (two faces) are piers; single-face cells carry the facade.
  const isCorner = faces.length >= 2;

  // ---- storey 1: shopfront ----
  put(x, G + 1, z, "stone_bricks"); // plinth
  if (isEntrance(x, z) && single) {
    const d = single;
    const doorProps = (half) => ({
      facing: d.name,
      half,
      hinge: "left",
      open: "false",
      powered: "false",
    });
    put(x, G + 1, z, "oak_door", doorProps("lower"));
    put(x, G + 2, z, "oak_door", doorProps("upper"));
    put(x, G + 3, z, "glass_pane", paneProps(d));
    put(x, G + 4, z, "white_concrete"); // lintel
  } else if (single && !isCorner) {
    put(x, G + 2, z, "glass_pane", paneProps(single));
    put(x, G + 3, z, "glass_pane", paneProps(single));
    put(x, G + 4, z, "white_concrete"); // lintel
    // warm light behind some shopfront glass
    if ((x + z) % 5 === 0 && single) {
      const ix = x - single.dx, iz = z - single.dz;
      if (has(ix, iz)) put(ix, G + 2, iz, "glowstone");
    }
  } else {
    put(x, G + 2, z, "white_concrete");
    put(x, G + 3, z, "white_concrete");
    put(x, G + 4, z, "white_concrete");
  }

  // ---- spandrel between storeys ----
  put(x, G + 5, z, "white_concrete");
  put(x, G + 6, z, "white_concrete");

  // ---- storey 2: alternating window bays ----
  const bay = single && !isCorner && alongIndex(single, x, z) % 2 === 1;
  if (bay) {
    put(x, G + 7, z, "glass_pane", paneProps(single));
    put(x, G + 8, z, "glass_pane", paneProps(single));
    if ((x + z) % 3 === 0) {
      const ix = x - single.dx, iz = z - single.dz;
      if (has(ix, iz)) put(ix, G + 7, iz, "glowstone");
    }
  } else {
    put(x, G + 7, z, "white_concrete");
    put(x, G + 8, z, "white_concrete");
  }
  put(x, G + 9, z, "white_concrete"); // storey-2 lintel

  // ---- cornice and parapet ----
  put(x, G + 10, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  put(x, G + 11, z, isCorner ? "smooth_quartz" : "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
