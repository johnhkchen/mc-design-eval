import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538403768";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 11, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);

// Plinth / ground-floor level: the highest ground under the footprint, so every
// cell stands on one level and downhill cells are filled up to it.
// Clamped so the roof and rooftop tank stay inside the 23-block column.
const B = Math.min(9, Math.max(...cells.map(c => c[2])));

const inF = (x, z) => ground.has(key(x, z));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const faces = (x, z) => dirs.filter(([dx, dz]) => !inF(x + dx, z + dz));
const isEdge = (x, z) => faces(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (!inF(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = z = 0 side (street side). Door placed on the front edge nearest x = 5.
const frontCells = cells.filter(([x, z]) => faces(x, z).some(([dx, dz]) => dx === 0 && dz === -1));
let doorCell = null;
for (const [x, z] of frontCells) {
  if (!doorCell || Math.abs(x - 5) < Math.abs(doorCell[0] - 5)) doorCell = [x, z];
}

const glassProps = (dx) => dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// 1. Foundation and ground-floor slab, all footprint cells
for (const [x, z] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
  put(x, B, z, "stone_bricks");
}

// 2. Floor slabs at the storey lines and the roof
for (const [x, z] of cells) {
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, "smooth_stone");
}

// 3. Facade: pillars, window panes, shopfront, door, cornice, parapet
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  const corner = f.length >= 2;
  const [fdx, fdz] = f[0];
  const a = fdx !== 0 ? z : x; // position along the facade
  const pillar = corner || a % 3 === 0;
  const isFront = f.some(([dx, dz]) => dx === 0 && dz === -1);
  const isDoor = doorCell && x === doorCell[0] && z === doorCell[1];

  // Base course (B) is already stone_bricks. Storey 1 and 2 windows.
  for (const y of [B + 1, B + 2, B + 3, B + 4, B + 6, B + 7, B + 8, B + 9]) {
    if (y === B + 4 && isFront && !pillar && !isDoor) {
      // Shopfront signage band above ground-floor glass
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (isDoor && (y === B + 1 || y === B + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === B + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoor) {
      // Door cell above the door: lintel glass
      put(x, y, z, "light_blue_stained_glass_pane", glassProps(fdx));
      continue;
    }
    if (pillar) {
      put(x, y, z, "white_concrete");
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", glassProps(fdx));
    }
  }

  // Spandrel band at the storey line and cornice under the parapet
  put(x, B + 5, z, "smooth_stone");
  put(x, B + 10, z, "smooth_stone");
  // Parapet
  put(x, B + 11, z, "white_concrete");
}

// 4. Warm light behind some second-storey windows (glowstone inside the air gap)
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const [dx, dz] = f[0];
  const a = dx !== 0 ? z : x;
  if (a % 6 !== 1) continue;
  const ix = x - dx, iz = z - dz;
  if (inF(ix, iz) && !isEdge(ix, iz)) {
    put(ix, B + 7, iz, "glowstone");
  }
}

// 5. Rooftop: a steel water tank and its lid, standing on the roof slab
const tankCells = [[3, 8], [4, 8], [3, 9], [4, 9]];
for (const [x, z] of tankCells) {
  if (inF(x, z) && !isEdge(x, z)) {
    put(x, B + 11, z, "iron_block");
    put(x, B + 12, z, "iron_block");
    put(x, B + 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
