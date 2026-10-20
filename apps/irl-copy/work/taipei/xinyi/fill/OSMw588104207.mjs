import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588104207";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 16, D = 9;
const ROOF = 4;                       // roof level above lowest ground (lidar)
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(key(x, z), gr);
const has = (x, z) => gm.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const minX = Math.min(...cells.map(c => c[0])), maxX = Math.max(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1])), maxZ = Math.max(...cells.map(c => c[1]));

// exposed faces: directions whose neighbour is outside the footprint
const exposed = (x, z) => Object.keys(DIRS).filter(d => {
  const [dx, dz] = DIRS[d];
  return !has(x + dx, z + dz);
});
const isPerimeter = (x, z) => exposed(x, z).length > 0;

// entrance: street side preference south > north > east > west, centre of that face
let entrance = null;
for (const face of ["south", "north", "east", "west"]) {
  const list = cells.filter(([x, z]) => exposed(x, z).includes(face));
  if (list.length === 0) continue;
  const along = face === "north" || face === "south" ? 0 : 1; // along-face axis index
  list.sort((a, b) => a[along] - b[along]);
  const mid = list[Math.floor(list.length / 2)];
  entrance = { x: mid[0], z: mid[1], face };
  break;
}

const doorFacing = entrance ? entrance.face : null;

for (const [x, z, gr] of cells) {
  const top = Math.max(ROOF, gr + 3);   // roof slab level for this cell
  const perim = isPerimeter(x, z);
  const ex = exposed(x, z);
  const corner = ex.includes("north") + ex.includes("south") + ex.includes("east") + ex.includes("west") > 1
    && ((ex.includes("east") || ex.includes("west")) && (ex.includes("north") || ex.includes("south")));

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  // storeys / walls, standing on the foundation
  for (let y = gr + 1; y <= top - 1; y++) {
    if (perim) {
      const isDoor = entrance && x === entrance.x && z === entrance.z && y <= gr + 2;
      if (isDoor) {
        const props = { facing: doorFacing, hinge: "left", open: "false", powered: "false" };
        g.set(x, y, z, "dark_oak_door", { ...props, half: y === gr + 1 ? "lower" : "upper" });
        continue;
      }
      // pillar positions on a 4-block rhythm, plus all corners
      const t = (ex.includes("north") || ex.includes("south")) ? x - minX : z - minZ;
      const pillar = corner || t % 4 === 0;
      if (pillar) {
        g.set(x, y, z, "white_concrete");
      } else if (y === top - 1) {
        g.set(x, y, z, "red_terracotta");           // header / sign band
      } else if (y === gr + 1) {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(ex));
      } else {
        g.set(x, y, z, "gray_stained_glass_pane", paneProps(ex));
      }
    } else {
      // interior: air, with occasional warm light behind the glass
      if (y === gr + 2 && (x + z) % 5 === 0) g.set(x, y, z, "glowstone");
    }
  }

  // roof: cornice on the edge, roof slab inside
  g.set(x, top, z, perim ? "smooth_stone" : "light_gray_concrete");
}

function paneProps(ex) {
  // pane connects along the wall it sits in
  const ns = ex.includes("north") || ex.includes("south");
  return ns
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
}

// roof equipment on the interior roof slab
const roofTop = Math.max(ROOF, 0) ;
for (const [x, z] of [[3, 3], [5, 5]]) {
  if (has(x, z) && !isPerimeter(x, z)) {
    const gr = gm.get(key(x, z));
    const top = Math.max(ROOF, gr + 3);
    g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
