import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// No record for this footprint, so it is read as a 1980s-90s Xinyi low-rise:
// two storeys of white-tile commercial frontage, a stone base, glass shopfronts,
// a centred entrance under a dark canopy, and a flat roof with a parapet, AC units and a mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612475";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 20;
const ROOF = 11;      // roof deck top, relative to lowest ground
const BAND = 5;       // storey line / first floor slab
const PARAPET = 12;   // parapet course above the roof deck

const g = new Voxels([W, H, D]);
const key = (x, z) => `${x},${z}`;
const fp = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// [dx, dz, facing-name] for the four sides
const OUT = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outward = (x, z) => OUT.filter(([dx, dz]) => !fp.has(key(x + dx, z + dz)));

// Body, foundation, floors and roof, cell by cell
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;

  // foundation up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  // storey line / first floor slab and the roof deck
  if (gr < BAND) put(x, BAND, z, "smooth_stone");
  put(x, ROOF, z, "smooth_stone");

  if (perim) {
    const along = out[0][1] !== 0 ? x : z;
    const pier = corner || along % 3 === 0;

    for (let y = gr + 1; y < ROOF; y++) {
      let id;
      if (y === BAND) {
        id = "smooth_stone";                       // belt course
      } else if (y < BAND) {                       // ground storey: shopfront
        if (pier) id = "polished_andesite";
        else if (y === BAND - 1) id = "white_concrete";   // lintel band
        else id = "light_blue_stained_glass";
      } else {                                     // upper storey
        if (pier || y === ROOF - 1) id = "white_concrete";
        else id = "light_blue_stained_glass";
      }
      put(x, y, z, id);
    }

    // parapet with a cap
    put(x, PARAPET, z, "white_concrete");
    put(x, PARAPET + 1, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
  } else {
    // interior: warm lanterns standing on the first-floor slab, behind the glass
    if (gr < BAND && (x + z) % 4 === 0) {
      put(x, BAND + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
    // rooftop AC units
    if (x % 6 === 3 && z % 5 === 2) {
      put(x, PARAPET, z, "light_gray_concrete");
      put(x, PARAPET + 1, z, "light_gray_concrete");
    }
  }
}

// Roof mast on the interior cell nearest the centre (not an AC unit)
{
  const cands = cells.filter(([x, z]) => outward(x, z).length === 0 && !(x % 6 === 3 && z % 5 === 2));
  cands.sort((a, b) =>
    Math.hypot(a[0] - W / 2, a[1] - D / 2) - Math.hypot(b[0] - W / 2, b[1] - D / 2));
  if (cands.length) {
    const [mx, mz] = cands[0];
    for (let y = PARAPET; y <= PARAPET + 2; y++) {
      put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

// Entrance: centred on the north face where possible, under a dark canopy
{
  const perimCells = cells
    .map(([x, z, gr]) => ({ x, z, gr, out: outward(x, z) }))
    .filter((c) => c.out.length);
  let pool = perimCells.filter((c) => c.out.some(([, dz]) => dz === -1));
  if (!pool.length) pool = perimCells.filter((c) => c.out.length === 1);
  pool.sort((a, b) => a.x - b.x || a.z - b.z);

  if (pool.length) {
    const e = pool[Math.floor(pool.length / 2)];
    const facing = (e.out.find(([, dz]) => dz === -1) ?? e.out[0])[2];

    put(e.x, e.gr + 1, e.z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(e.x, e.gr + 2, e.z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });

    // canopy band over the entrance and its neighbours along the same wall
    for (let nx = e.x - 1; nx <= e.x + 1; nx++) {
      const ngr = fp.get(key(nx, e.z));
      if (ngr === undefined) continue;
      const cy = ngr + 3;
      if (cy <= BAND - 1) put(nx, cy, e.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
