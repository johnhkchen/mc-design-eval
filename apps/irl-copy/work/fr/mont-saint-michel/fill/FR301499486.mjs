import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499486";

const W = 15, H = 25, D = 15;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Index footprint and smooth the lidar roof into one flat tier for the whole block.
const cell = new Map();
const roofs = [];
for (const [x, z, gr, roof] of cells) {
  cell.set(`${x},${z}`, { ground: Math.round(gr), roof: Math.round(roof) });
  roofs.push(Math.round(roof));
}
roofs.sort((a, b) => a - b);
const roofG = roofs[Math.floor(roofs.length / 2)];

const has = (x, z) => cell.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: the outer southern cell nearest the centre line (x = 7).
let doorX = null;
{
  let best = Infinity;
  for (const [key] of cell) {
    const [x, z] = key.split(",").map(Number);
    if (z !== maxZ()) continue;
    const d = Math.abs(x - 7);
    if (d < best) { best = d; doorX = x; }
  }
}
function maxZ() {
  let m = -Infinity;
  for (const [key] of cell) m = Math.max(m, Number(key.split(",")[1]));
  return m;
}
const doorZ = maxZ();

// Pass 1: foundations, floor slabs, walls, quoins, cornice, parapet, deck.
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const G = c.ground;
  const top = Math.max(G + 12, roofG);

  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  for (const y of [G, G + 5, G + 10]) put(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    put(x, G, z, "polished_andesite"); // base course
    const quoin = isCorner(x, z);
    for (let y = G + 1; y <= top - 2; y++) {
      // Alternating quoin blocks on corners give the walls relief.
      const alt = quoin && ((y - G) % 2 === 0);
      put(x, y, z, alt ? "polished_andesite" : "stone_bricks");
    }
    put(x, G + 5, z, "chiseled_stone_bricks"); // storey string
    put(x, G + 10, z, "chiseled_stone_bricks");
    put(x, top - 2, z, "chiseled_stone_bricks"); // cornice
    put(x, top - 1, z, "stone_brick_wall");      // parapet
  } else {
    put(x, top - 1, z, "deepslate_tiles");        // roof deck
  }
}

// Pass 2: windows (glass in stone frames with sills), lit rooms behind glass.
for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const G = c.ground;

  const faces = [
    { nx: 0, nz: -1, t: x },
    { nx: 0, nz: 1, t: x },
    { nx: -1, nz: 0, t: z },
    { nx: 1, nz: 0, t: z },
  ];

  for (const f of faces) {
    if (has(x + f.nx, z + f.nz)) continue;
    if (f.t % 3 !== 1) continue;
    if (f.nz === 1 && x === doorX && z === doorZ) continue;
    if (isCorner(x, z)) continue; // keep quoin columns solid

    for (let s = 0; s < 2; s++) {
      const b = G + 5 * s;
      put(x, b + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // sill
      for (let y = b + 2; y <= b + 4; y++) put(x, y, z, "gray_stained_glass_pane");
      put(x, b + 5 > G + 10 ? b + 5 : b + 5, z, "chiseled_stone_bricks"); // lintel band
      if ((f.t + s + G) % 3 === 0) {
        const ix = x - f.nx, iz = z - f.nz;
        if (has(ix, iz) && !isPerim(ix, iz)) put(ix, b + 3, iz, "glowstone");
      }
    }
  }
}

// Pass 3: entrance with door, surround and lintel.
{
  const G = cell.get(`${doorX},${doorZ}`).ground;
  const doorProps = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  // Surround: pillars either side of the door, lintel above.
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, doorZ)) {
      put(doorX + dx, G + 1, doorZ, "polished_andesite");
      put(doorX + dx, G + 2, doorZ, "polished_andesite");
      put(doorX + dx, G + 3, doorZ, "polished_andesite");
    }
  }
  put(doorX, G + 1, doorZ, "oak_door", doorProps("lower"));
  put(doorX, G + 2, doorZ, "oak_door", doorProps("upper"));
  put(doorX, G + 3, doorZ, "chiseled_stone_bricks"); // lintel
  // Lantern over the door, hanging from the lintel block inside.
  if (has(doorX, doorZ - 1) && !isPerim(doorX, doorZ - 1)) {
    put(doorX, G + 2, doorZ - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Pass 4: chimney stack on an interior cell, if present.
if (has(3, 3)) {
  const top = Math.max(cell.get("3,3").ground + 12, roofG);
  for (let y = top - 1; y <= top + 2; y++) put(3, y, 3, "bricks");
  put(3, top + 3, 3, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
