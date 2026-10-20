import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw420981027";
const cells = JSON.parse(readFileSync(BASE + ".cells.json", "utf8"));

// Two-storey post-war commercial block. One flat roof plane shared by the whole
// footprint (lowest ground + 10), walls stepped up from each cell's own ground,
// stone-brick plinth, polished-andesite bands, grey roof with parapet and
// condenser units, central entrance on the street-facing wall.
const W = 11, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(x + "," + z, Math.round(gr || 0));
const has = (x, z) => ground.has(x + "," + z);
const gOf = (x, z) => ground.get(x + "," + z);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isPer = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

let zmin = Infinity;
let B = Infinity;
for (const [x, z, gr] of cells) {
  if (z < zmin) zmin = z;
  const r = Math.round(gr || 0);
  if (r < B) B = r;
}
const roofY = Math.min(B + 10, H - 2);   // shared roof deck level
const band1 = B + 4, band2 = B + 5, band3 = B + 9;

const WALL = "smooth_quartz";
const PLINTH = "stone_bricks";
const BAND = "polished_andesite";
const FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";

// Pick one entrance cell on the street-facing (lowest z) wall, nearest its middle.
const frontCells = [];
for (const [x, z] of cells) {
  const N = has(x, z - 1), S = has(x, z + 1), Wn = has(x - 1, z), E = has(x + 1, z);
  const zFace = !N || !S, xFace = !Wn || !E;
  if (zFace && !xFace && z === zmin) frontCells.push(x);
}
let doorX = null;
if (frontCells.length) {
  const mid = (Math.min(...frontCells) + Math.max(...frontCells)) / 2;
  doorX = frontCells.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
}

for (const [x, z] of cells) {
  const gr = Math.round(gOf(x, z) || 0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, PLINTH);

  const N = has(x, z - 1), S = has(x, z + 1), Wn = has(x - 1, z), E = has(x + 1, z);
  const zFace = !N || !S;   // wall runs along x
  const xFace = !Wn || !E;  // wall runs along z
  const corner = zFace && xFace;
  const per = zFace || xFace;

  if (per) {
    // Wall column from this cell's ground up to the shared roof level.
    const top = Math.max(gr, roofY);
    for (let y = gr; y <= top; y++) {
      let mat = WALL;
      if (y === gr) mat = PLINTH;
      else if (y === band1 || y === band3) mat = BAND;
      else if (y === band2) mat = BAND;
      put(x, y, z, mat);
    }

    if (!corner) {
      const i = zFace ? x : z;
      const paneProps = zFace
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

      const isDoor = zFace && z === zmin && x === doorX;
      const winYs = [B + 1, B + 2, B + 3, B + 6, B + 7, B + 8];

      // Windows on odd indices, both storeys, only where wall is above ground.
      if (i % 2 === 1) {
        for (const y of winYs) {
          if (y > gr && y < roofY) put(x, y, z, "glass_pane", paneProps);
        }
      }

      // Central entrance: door with transom.
      if (isDoor && gr + 3 < roofY) {
        const doorProps = { facing: "north", hinge: "left", open: "false", powered: "false" };
        put(x, gr + 1, z, "oak_door", { ...doorProps, half: "lower" });
        put(x, gr + 2, z, "oak_door", { ...doorProps, half: "upper" });
        put(x, gr + 3, z, "glass_pane", paneProps);
      }

      // Warm lanterns just inside some windows, standing on a floor.
      if (i % 4 === 1 || i % 4 === 3) {
        let dx = 0, dz = 0;
        if (!N) dz = 1; else if (!S) dz = -1;
        if (!Wn) dx = 1; else if (!E) dx = -1;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !isPer(ix, iz)) {
          const igr = Math.round(gOf(ix, iz) || 0);
          if (i % 4 === 3 && !isDoor) {
            // Ground-floor lantern, standing on the interior floor at igr.
            if (igr + 1 < roofY) put(ix, igr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
          } else if (i % 4 === 1 && igr <= B + 5 && B + 6 < roofY) {
            // Upper-floor lantern, standing on the B+5 slab.
            put(ix, B + 6, iz, "lantern", { hanging: "false", waterlogged: "false" });
          }
        }
      }
    }
  } else {
    // Interior: floor slabs per storey and roof deck; air otherwise (no interiors).
    if (gr < roofY) put(x, gr, z, FLOOR);
    if (B + 5 > gr && B + 5 < roofY) put(x, B + 5, z, FLOOR);
    if (gr < roofY) put(x, roofY, z, ROOF);
    // Rooftop condenser units on a regular grid, on the roof deck.
    if (x % 4 === 2 && z % 5 === 2 && gr < roofY) put(x, roofY + 1, z, "iron_block");
  }
}

g.save(BASE + ".nbt");
