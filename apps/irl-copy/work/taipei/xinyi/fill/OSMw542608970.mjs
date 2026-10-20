import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608970";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// Footprint 13 x 20, 23 blocks tall. Roof deck at y=11 (about 11 above lowest ground).
// Two storeys of ~5 blocks: storey 1 at y gr..4, floor slab y=5, storey 2 at y 6..9,
// cornice y=10, roof deck y=11, parapet y=11..12. Late-1980s/90s Xinyi mid-rise:
// white tiled concrete, grey base and cornice, blue-green glass, shopfront at street side.
const W = 13, H = 23, D = 20;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const gr = (x, z) => G.get(`${x},${z}`);

// Outward faces: N = -z (street side), S = +z, W = -x, E = +x
const DIRS = {
  N: { dx: 0, dz: -1, facing: "north" },
  S: { dx: 0, dz: 1, facing: "south" },
  W: { dx: -1, dz: 0, facing: "west" },
  E: { dx: 1, dz: 0, facing: "east" },
};
const outward = (x, z) =>
  Object.keys(DIRS).filter((k) => !has(x + DIRS[k].dx, z + DIRS[k].dz));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

// Pass 1: foundation, floor slab, roof deck, and the wall shell.
for (const [x, z, G0] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < G0; y++) put(x, y, z, "stone_bricks");

  // Floor slab between storeys and roof deck (interior and edge alike).
  if (G0 <= 5) put(x, 5, z, "light_gray_concrete");
  if (G0 <= 11) put(x, 11, z, "smooth_stone");

  const out = outward(x, z);
  if (out.length === 0) continue; // interior cell: stays air above floor slabs

  // Ground-floor walls and base course.
  for (let y = G0; y <= 4; y++) put(x, y, z, "white_concrete");
  if (G0 <= 4) put(x, G0, z, "gray_concrete");

  // Storey 2 walls.
  for (let y = 5; y <= 9; y++) put(x, y, z, "white_concrete");

  // Cornice band, then parapet to the roof edge.
  put(x, 10, z, "light_gray_concrete");
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "white_concrete");
}

// Pass 2: windows, shopfront, entrance and interior warm lights.
const midX = Math.floor((minX + maxX) / 2);

for (const [x, z, G0] of cells) {
  const out = outward(x, z);
  if (out.length === 0) continue;

  // Prefer the north/south face for corner cells so facades read consistently.
  const face = out.find((k) => k === "N" || k === "S") ?? out[0];
  const along = face === "N" || face === "S" ? x - minX : z - minZ;
  const span = face === "N" || face === "S" ? maxX - minX : maxZ - minZ;
  const isFront = face === "N" && z === minZ;

  // Storey 1: shopfront on the street face, plain windows elsewhere.
  for (let y = G0 + 1; y <= 3 && y <= 4; y++) {
    if (isFront) {
      if (along !== 0 && along !== span) put(x, y, z, "light_blue_stained_glass");
    } else if (along % 3 === 1) {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
  // Storey 1 lintel above the shopfront/windows.
  if (G0 + 4 <= 4) put(x, G0 + 4, z, "white_concrete");

  // Storey 2 windows with sills and lintels.
  const win2 = along % 3 === 1;
  if (win2) {
    for (let y = 6; y <= 8; y++) put(x, y, z, "light_blue_stained_glass");
    // Warm light just inside some storey-2 windows.
    const d = DIRS[face];
    const ix = x - d.dx, iz = z - d.dz;
    if (has(ix, iz) && outward(ix, iz).length === 0 && along % 6 === 1) {
      put(ix, 7, iz, along % 12 === 1 ? "shroomlight" : "glowstone");
    }
  }
}

// Entrance: iron door centred on the street face, with a lintel band above.
if (has(midX, minZ)) {
  const G0 = gr(midX, minZ);
  if (G0 <= 3) {
    put(midX, G0 + 1, minZ, "iron_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(midX, G0 + 2, minZ, "iron_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(midX, G0 + 3, minZ, "white_concrete");
    put(midX, G0 + 4, minZ, "light_gray_concrete");
  }
}

// Roof equipment: sparse air-conditioning plant on the deck, plus a service block.
for (const [x, z, G0] of cells) {
  if (G0 > 11) continue;
  if (outward(x, z).length > 0) continue;
  if ((x + 2 * z) % 7 === 0) put(x, 12, z, "iron_block");
  const cx = Math.abs(x - Math.floor((minX + maxX) / 2));
  const cz = Math.abs(z - Math.floor((minZ + maxZ) / 2));
  if (cx <= 1 && cz <= 1) put(x, 12, z, "gray_concrete");
}

g.save(`${BASE}.nbt`);
