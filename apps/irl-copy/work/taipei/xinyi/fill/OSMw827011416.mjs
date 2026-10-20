import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi mid-rise office block, c. 1990s: five storeys, granite-clad shopfront
// base, white-tiled piers and spandrels, glass ribbon windows, plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011416";
const W = 16, H = 38, D = 22;
const ROOF = 25;          // roof deck top surface at y = 26
const PARAPET_TOP = 28;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(24, Math.round(gr))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const eE = (x, z) => !has(x + 1, z);
const eW = (x, z) => !has(x - 1, z);
const eN = (x, z) => !has(x, z - 1);
const eS = (x, z) => !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const paneFor = (alongZ) =>
  alongZ
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gl = gr;
  const ex = eE(x, z) || eW(x, z);
  const ez = eN(x, z) || eS(x, z);
  const corner = ex && ez;
  const perim = ex || ez;
  const alongZ = ex && !ez;          // face lies on east or west side, wall runs north-south
  const idx = alongZ ? z : x;        // position along the face
  const inPent = x >= 4 && x <= 11 && z >= 6 && z <= 15;
  const pier = corner || idx % 3 === 0;

  // Foundation under the building
  for (let y = 0; y < gl; y++) put(x, y, z, "stone_bricks");

  // Roof deck
  put(x, ROOF, z, "gray_concrete");

  // Storeys
  for (let y = gl; y < ROOF; y++) {
    if (!perim) {
      if (y === gl) put(x, y, z, "smooth_stone");           // ground floor slab
      else if (y % 5 === 0) put(x, y, z, "smooth_quartz");  // storey slabs
      continue;
    }

    const local = y % 5;
    const storey = Math.floor(y / 5);

    if (storey === 0) {
      // Entrance: double doors facing south, centred on the south face
      if (z === 21 && (x === 7 || x === 8) && (y === gl || y === gl + 1) && gl <= 3) {
        const half = y === gl ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: x === 7 ? "left" : "right",
          open: "false", powered: "false",
        });
        continue;
      }
      const entranceZone = z === 21 && x >= 6 && x <= 9;
      if (y <= 2) {
        if (pier || entranceZone) put(x, y, z, "polished_granite");
        else put(x, y, z, "light_blue_stained_glass");       // shopfront glass
      } else if (y === 3) {
        put(x, y, z, "smooth_quartz");                       // shopfront lintel
      } else {
        put(x, y, z, "white_concrete");                      // storey line
      }
      continue;
    }

    if (corner || pier) {
      put(x, y, z, local === 4 ? "white_concrete" : "smooth_quartz");
      continue;
    }
    if (local === 0) {
      put(x, y, z, "smooth_quartz");                         // slab edge band
    } else if (local === 4) {
      put(x, y, z, "white_concrete");                        // spandrel
    } else {
      // Window band; a few panes glow warm
      if (storey % 2 === 1 && idx % 6 === 4 && local === 2) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", paneFor(alongZ));
      }
    }
  }

  // Parapet and cornice cap on the perimeter
  if (perim && !inPent) {
    put(x, 26, z, "smooth_quartz");
    put(x, 27, z, "smooth_quartz");
    put(x, PARAPET_TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Plant penthouse on the roof, centred in the plan
  if (inPent) {
    for (let y = 26; y <= 28; y++) {
      const boundary = x === 4 || x === 11 || z === 6 || z === 15;
      if (!boundary) continue;
      const cornerP = (x === 4 || x === 11) && (z === 6 || z === 15);
      if (cornerP || y !== 27) {
        put(x, y, z, "white_concrete");
      } else {
        const sideZ = x === 4 || x === 11;
        const pidx = sideZ ? z : x;
        if (pidx % 3 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass_pane", paneFor(sideZ));
      }
    }
    put(x, 29, z, "gray_concrete");                          // penthouse roof
  }
}

// Roof plant: two AC units and a short lightning-rod mast on the penthouse
const plant = [[2, 3, 2], [13, 17, 2]];
for (const [x, z, h] of plant) {
  if (!has(x, z)) continue;
  for (let i = 0; i < h; i++) put(x, 26 + i, z, "light_gray_concrete");
}
if (has(7, 10)) {
  put(7, 30, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  put(7, 31, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
