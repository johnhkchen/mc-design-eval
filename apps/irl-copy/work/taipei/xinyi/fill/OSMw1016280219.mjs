import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280219";
const cells = JSON.parse(readFileSync(`${dir}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 18, four storeys of 5 blocks, parapet at y 21: a 1980s Xinyi-style
// commercial block with cream concrete piers, glass bays, a stone plinth and a roof penthouse.
const W = 20, H = 33, D = 18;
const g = new Voxels([W, H, D]);

const FLOORS = [0, 5, 10, 15];
const ROOF = 20;      // roof deck
const PARAPET = 21;   // top of parapet

const minG = Math.min(...cells.map(c => c[2]));
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr - minG);
const has = (x, z) => gm.has(`${x},${z}`);
const gr = (x, z) => gm.get(`${x},${z}`);

function faces(x, z) {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
}
const isEdge = (x, z) => faces(x, z).length > 0;

const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const box = (x0, x1, y0, y1, z0, z1, id) => {
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z))
        for (let y = y0; y <= y1; y++) put(x, y, z, id);
};

// Pass 1: foundations, floor slabs, roof deck, facade
for (const [x, z] of cells) {
  const G = gr(x, z);

  // foundation under the cell up to its ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  // floor slabs per storey (inside the footprint, above the foundation)
  for (const s of FLOORS) if (s >= G) put(x, s, z, "smooth_stone");

  // roof deck
  put(x, ROOF, z, "stone");

  if (!isEdge(x, z)) continue;

  const f = faces(x, z);
  const corner = (f.includes("W") || f.includes("E")) && (f.includes("N") || f.includes("S"));
  const alongZ = f.includes("W") || f.includes("E");
  const along = alongZ ? z : x;

  for (let y = G; y <= 19; y++) {
    const r = y % 5;
    if (r === 0) continue;             // floor slab line
    if (r === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrel band
    // r = 1..3: glass bay or cream pier
    if (corner || along % 3 === 0) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass");
  }

  // cornice and parapet
  put(x, ROOF, z, "smooth_stone");
  put(x, PARAPET, z, "white_concrete");
}

// Pass 2: warm lights behind some glass bays (in the interior air cell)
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const side = f[0];
  const alongZ = side === "W" || side === "E";
  const along = alongZ ? z : x;
  const dx = side === "W" ? 1 : side === "E" ? -1 : 0;
  const dz = side === "N" ? 1 : side === "S" ? -1 : 0;
  const G = gr(x, z);
  for (const s of FLOORS) {
    const y = s + 2;
    if (y < G || y > 19) continue;
    if (along % 3 === 0) continue;
    const ix = x + dx, iz = z + dz;
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    if (y < gr(ix, iz)) continue;
    if ((along + s / 5) % 3 === 1) put(ix, y, iz, "shroomlight");
  }
}

// Pass 3: entrance on the north face, nearest the middle, with canopy lintel
{
  let best = null;
  for (const [x, z] of cells) {
    if (!faces(x, z).includes("N")) continue;
    if (!best || Math.abs(x - 10) < Math.abs(best[0] - 10)) best = [x, z];
  }
  if (best) {
    const [ex, ez] = best;
    const G = gr(ex, ez);
    put(ex, G + 1, ez, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(ex, G + 2, ez, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    for (const dx of [-1, 0, 1]) {
      const cx = ex + dx;
      if (has(cx, ez) && faces(cx, ez).includes("N"))
        put(cx, G + 3, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 4: roof penthouse (inside the footprint) with a stone cap
{
  const x0 = 6, x1 = 13, z0 = 5, z1 = 12;
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      const perim = x === x0 || x === x1 || z === z0 || z === z1;
      if (!perim) continue;
      const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
      for (let y = 21; y <= 23; y++) {
        if (y === 22 && !corner && ((x + z) % 3 !== 0)) put(x, y, z, "light_blue_stained_glass");
        else put(x, y, z, "light_gray_concrete");
      }
    }
  for (let x = x0; x <= x1; x++)
    for (let z = z0; z <= z1; z++)
      if (has(x, z)) put(x, 24, z, "smooth_stone");
  // a warm lamp inside the penthouse, behind glass
  if (has(9, 9)) put(9, 22, 9, "shroomlight");
}

// Pass 5: rooftop air-conditioning plant
box(2, 3, 21, 22, 2, 3, "light_gray_concrete");
box(15, 16, 21, 22, 13, 14, "light_gray_concrete");

g.save(`${dir}/${ID}.nbt`);
