import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167414";
const W = 14, H = 38, D = 25;
const ROOF_Y = 25;     // top floor ceiling / roof slab
const PARAPET_Y = 26;  // parapet course on the perimeter
const TOP_FLOOR_Y = 24;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(24, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Penthouse footprint (interior cells only): x 4..9, z 8..16
const inPenthouse = (x, z) => x >= 4 && x <= 9 && z >= 8 && z <= 16;

for (const [x, z, grRaw] of cells) {
  const gr = ground.get(`${x},${z}`);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const hasN = has(x, z - 1), hasS = has(x, z + 1);
  const hasW = has(x - 1, z), hasE = has(x + 1, z);
  const missing = [!hasN, !hasS, !hasW, !hasE].filter(Boolean).length;
  const edge = missing > 0;
  const corner = missing >= 2;
  // Wall runs along x when its exposed face is north/south
  const alongX = !hasN || !hasS;
  const t = alongX ? x : z;
  const frontFace = !hasN; // entrance on north (z = 0) face

  // Interior cells: storey floor slabs, air otherwise
  if (!edge) {
    for (let k = 0; k < 5; k++) {
      const fy = gr + 5 * k;
      if (fy <= TOP_FLOOR_Y) put(x, fy, z, "light_gray_concrete");
    }
  }

  // Edge cells: facade from ground to top floor
  if (edge) {
    for (let y = gr; y <= TOP_FLOOR_Y; y++) {
      const r = y - gr;
      const k = Math.floor(r / 5);
      const p = r % 5;
      const pillar = corner || t % 3 === 0;
      let mat;
      let props;

      if (p === 0) {
        mat = k === 0 ? "polished_granite" : "white_concrete";
      } else if (p === 4) {
        mat = k === 0 ? "polished_granite" : "light_gray_concrete";
      } else {
        mat = pillar ? "white_concrete" : "light_blue_stained_glass";
      }

      // Entrance on the street face, centred on the wider side
      if (k === 0 && frontFace && x === 6 && (p === 1 || p === 2 || p === 3)) {
        if (p === 1) {
          mat = "iron_door";
          props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
        } else if (p === 2) {
          mat = "iron_door";
          props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
        } else {
          mat = "lantern";
          props = { hanging: "true", waterlogged: "false" };
        }
      }

      put(x, y, z, mat, props);

      // Warm light behind some windows, in the interior cell just inside
      if (p === 2 && mat === "light_blue_stained_glass" && !corner && ((x + z + k) % 3 === 0)) {
        let dx = 0, dz = 0;
        if (!hasW) dx = 1;
        else if (!hasE) dx = -1;
        else if (!hasN) dz = 1;
        else if (!hasS) dz = -1;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz)) put(ix, y, iz, "shroomlight");
      }
    }
  }

  // Roof slab over every footprint cell
  put(x, ROOF_Y, z, edge ? "smooth_quartz" : "light_gray_concrete");

  // Parapet on the perimeter
  if (edge) put(x, PARAPET_Y, z, "white_concrete");
}

// Rooftop mechanical penthouse, standing on the roof slab
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!inPenthouse(x, z)) continue;
  put(x, 26, z, "smooth_quartz");
  put(x, 27, z, "smooth_quartz");
  put(x, 28, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
