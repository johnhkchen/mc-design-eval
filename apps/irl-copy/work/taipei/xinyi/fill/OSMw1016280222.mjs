import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 23, H = 33, D = 21;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280222.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280222.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> ground y
const G = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) G.set(`${x},${z}`, gr);
}
const inFp = (x, z) => G.has(`${x},${z}`);

// Exposed (perimeter) test: at least one side open to outside the footprint
const exposedFaces = (x, z) => {
  const f = [];
  if (!inFp(x, z - 1)) f.push("N");
  if (!inFp(x, z + 1)) f.push("S");
  if (!inFp(x - 1, z)) f.push("W");
  if (!inFp(x + 1, z)) f.push("E");
  return f;
};
const isWall = (x, z) => inFp(x, z) && exposedFaces(x, z).length > 0;

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Pane connection props toward neighbouring wall cells (same storey)
const paneProps = (x, z) => ({
  north: isWall(x, z - 1) ? "true" : "false",
  south: isWall(x, z + 1) ? "true" : "false",
  west: isWall(x - 1, z) ? "true" : "false",
  east: isWall(x + 1, z) ? "true" : "false",
  waterlogged: "false",
});

// Entrance: exposed north-or-south cell closest to the middle of the width
const MID = Math.floor(W / 2);
let door = null;
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  const f = exposedFaces(x, z);
  if (!(f.includes("N") || f.includes("S"))) continue;
  if (!door || Math.abs(x - MID) < Math.abs(door.x - MID)) door = { x, z, face: f.includes("N") ? "N" : "S" };
}
const doorFacing = door && door.face === "N" ? "north" : "south";

// Pass 1: foundation, floor slabs, walls, parapet
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = G.get(key);
  const faces = exposedFaces(x, z);
  const corner = faces.length > 1;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Floor slabs at each storey base; base course at ground, roof slab at top
  for (let k = 0; k <= 4; k++) {
    const b = gr + 5 * k;
    const slab = k === 0 ? "smooth_stone" : "light_gray_concrete";
    put(x, b, z, slab);
  }

  if (faces.length === 0) continue; // interior cell: air above the slabs

  // Storey walls: four rows per storey (b+1..b+4), concrete slab above at b+5
  for (let k = 0; k < 4; k++) {
    const b = gr + 5 * k;
    for (let row = 1; row <= 4; row++) {
      const y = b + row;
      let block, props;

      // Along-face index for pillar rhythm (use first exposed face)
      const f0 = faces[0];
      const t = (f0 === "N" || f0 === "S") ? x : z;
      const pillar = corner || t % 3 === 0;

      if (row === 4) {
        block = "light_gray_concrete"; // spandrel / cornice band
      } else if (k === 0 && row === 3) {
        block = "stone_bricks"; // shopfront fascia
      } else if (pillar) {
        block = k === 0 ? "light_gray_concrete" : "white_concrete";
      } else if (door && x === door.x && z === door.z && k === 0 && row <= 2) {
        // Entrance door (lower at row 1, upper at row 2)
        const half = row === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      } else {
        block = "light_blue_stained_glass_pane";
        props = paneProps(x, z);
      }

      if (props) put(x, y, z, block, props);
      else put(x, y, z, block);

      // Warm light behind a few upper-storey windows (glowstone on the floor inside)
      if (k > 0 && row === 2 && block === "light_blue_stained_glass_pane") {
        const inward = { N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z] }[f0];
        const litPattern = ((t + k) % 4) === 1;
        if (litPattern && inFp(inward[0], inward[1])) {
          put(inward[0], b + 1, inward[1], "glowstone");
        }
      }
    }
  }

  // Parapet with stone cap, sitting on the roof slab at gr+20
  put(x, gr + 21, z, "stone_bricks");
}

// Pass 2: rooftop plant platform and equipment in the interior
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  const gr = G.get(key);
  if (exposedFaces(x, z).length > 0) continue;
  if (x >= 8 && x <= 14 && z >= 7 && z <= 13) {
    put(x, gr + 21, z, "light_gray_concrete");
    if (x >= 9 && x <= 13 && z >= 8 && z <= 12) {
      put(x, gr + 22, z, "iron_block");
    }
  }
}

g.save(OUT);
