import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1052970234";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 68, H = 23, D = 34;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: name and horizontal offset
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const outs = FACES.filter((f) => !has(x + f.dx, z + f.dz));
  const edge = outs.length > 0;
  const face = edge ? outs[0] : null;

  // Floor slabs, storey lines, roof deck
  put(x, gr, z, edge ? "polished_granite" : "light_gray_concrete");
  put(x, gr + 5, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, gr + 10, z, edge ? "smooth_quartz" : "light_gray_concrete");
  put(x, gr + 11, z, edge ? "smooth_quartz" : "light_gray_concrete");

  if (edge) {
    // Parapet
    put(x, gr + 12, z, "smooth_quartz");

    const isNS = face.name === "north" || face.name === "south";
    const idx = isNS ? x : z;
    const pier = idx % 4 === 0;
    const paneProps = isNS ? paneNS : paneEW;

    for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
      let id;
      if (pier) id = "white_concrete";
      else if (y === gr + 3) id = "smooth_stone";      // shopfront sign band
      else if (y === gr + 6) id = "white_concrete";     // sill course
      else id = "glass_pane";

      if (id === "glass_pane") put(x, y, z, id, paneProps);
      else put(x, y, z, id);
    }

    // Main entrance on the south frontage, centre bay
    if (face.name === "south" && x === 34 && !pier) {
      const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
      put(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
    }

    // Warm lights behind some windows (air gap inside, one block behind the glass)
    if (!pier && idx % 8 === 2) {
      const ix = x - face.dx;
      const iz = z - face.dz;
      if (has(ix, iz)) {
        put(ix, gr + 2, iz, "glowstone");
        put(ix, gr + 8, iz, "shroomlight");
      }
    }
  } else {
    // Rooftop plant units on the interior roof
    if (x % 10 === 5 && z % 8 === 4) {
      put(x, gr + 12, z, "iron_block");
      put(x, gr + 13, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
