import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Era read from the record: 2-storey concrete commercial block (Taiwan, c. 1970s-80s).
// Pale concrete facade, grey storey bands, red sign band over glazed shopfronts,
// flat roof with parapet and a small rooftop water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993158";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Set(cells.map(([x, z]) => key(x, z)));
const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Storey levels, absolute y. Roof sits about 11 blocks above the lowest ground.
const base = minG;          // base course / ground floor slab line
const shopTop = minG + 4;   // top of shopfront, red sign band
const slab1 = minG + 5;     // ground/upper floor slab and light band
const slab2 = minG + 10;    // upper floor slab and cornice
const roofY = minG + 11;    // roof deck; parapet sits on it

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell (neighbour missing on that side).
const DIRS = {
  north: { dx: 0, dz: -1, ix: 0, iz: 1 },
  south: { dx: 0, dz: 1, ix: 0, iz: -1 },
  west: { dx: -1, dz: 0, ix: 1, iz: 0 },
  east: { dx: 1, dz: 0, ix: -1, iz: 0 },
};

function exteriorFaces(x, z) {
  const out = [];
  for (const [name, d] of Object.entries(DIRS)) {
    if (!foot.has(key(x + d.dx, z + d.dz))) {
      const idx = d.dz === 0 ? z - minZ : x - minX; // position along the facade
      out.push({ name, ...d, idx });
    }
  }
  return out;
}

// Door sits centred on the south facade.
const doorX = minX + Math.floor((maxX - minX + 1) / 2);

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = exteriorFaces(x, z);
  const corner = ext.length >= 2;
  const face = ext.length === 1 ? ext[0] : null;

  for (let y = gr; y < roofY; y++) {
    if (ext.length === 0) {
      // Interior: floor slabs only, the rest is air.
      if (y === gr || y === slab1 || y === slab2) put(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior wall: concrete by default.
    let mat = "white_concrete";
    let props;

    if (y === gr) {
      mat = "stone_bricks";                       // base course
    } else if (y === slab1 || y === slab2) {
      mat = "light_gray_concrete";                // storey lines / cornice
    } else if (y === shopTop) {
      mat = "red_concrete";                       // shopfront sign band
    }

    const shopZone = y >= base + 1 && y <= shopTop - 1;
    const upperZone = y >= slab1 + 1 && y <= slab2 - 2;
    const pier = corner || (face && face.idx % 3 === 0);

    if (face && !pier) {
      const isDoorCell =
        face.name === "south" && x === doorX && shopZone;

      if (shopZone) {
        if (isDoorCell) {
          if (y === base + 1) { mat = "dark_oak_door"; props = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }; }
          else if (y === base + 2) { mat = "dark_oak_door"; props = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }; }
          else mat = "glass_pane";                // transom
        } else {
          mat = "glass_pane";
        }
      } else if (upperZone) {
        mat = "glass_pane";
      }

      // Warm light behind some glass, leaving an air gap.
      const lightRow =
        (shopZone && y === base + 2 && face.idx % 6 === 4) ||
        (upperZone && y === slab1 + 2 && face.idx % 6 === 1);
      if (lightRow && !isDoorCell) {
        const lx = x + 2 * face.ix, lz = z + 2 * face.iz;
        if (foot.has(key(lx, lz))) put(lx, y, lz, "glowstone");
      }
    }

    put(x, y, z, mat, props);
  }

  // Roof deck: parapet on the exterior ring, smooth deck inside.
  if (ext.length) put(x, roofY, z, "stone_brick_wall");
  else put(x, roofY, z, "smooth_stone");
}

// Rooftop water tank, 2x2, on the roof near the centre.
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((Math.min(...cells.map((c) => c[1])) + Math.max(...cells.map((c) => c[1]))) / 2);
const tankCells = [[cx - 1, cz - 1], [cx, cz - 1], [cx - 1, cz], [cx, cz]];
if (tankCells.every(([x, z]) => foot.has(key(x, z)))) {
  for (const [x, z] of tankCells) {
    put(x, roofY + 1, z, "stone_bricks");
    put(x, roofY + 2, z, "stone_bricks");
    if (roofY + 3 < H) put(x, roofY + 3, z, "stone_brick_slab", { type: "top" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
