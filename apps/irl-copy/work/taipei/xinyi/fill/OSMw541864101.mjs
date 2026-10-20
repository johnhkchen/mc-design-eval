import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 7 x 15 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey Taipei shophouse, c. 1970s-80s: white glazed-tile walls,
// red-brown tile cornices, a stone plinth, a shopfront with a timber door on the
// street (north) face, and a small roof tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864101";
const W = 7, H = 23, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gg] of cells) ground.set(`${x},${z}`, Math.round(gg));

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const B = Math.min(...ground.values());          // lowest ground under the footprint

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane connection states so glass reads as a continuous window wall.
const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const cells2 = [...ground.keys()].map(k => k.split(",").map(Number));

for (const [x, z] of cells2) {
  const gr = gAt(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const outs = outward(x, z);

  // Interior cells: floor slabs and deck only; air elsewhere.
  if (outs.length === 0) {
    put(x, gr, z, "smooth_stone");
    if (B + 5 > gr) put(x, B + 5, z, "smooth_stone");
    if (B + 10 >= gr) put(x, B + 10, z, "smooth_stone");
    continue;
  }

  // Perimeter walls, gr up to the parapet at B+11.
  const corner = outs.length > 1;
  const wall = corner ? "quartz_pillar" : "white_terracotta";
  for (let y = gr; y <= B + 11; y++) {
    let id = wall;
    if (y === gr) id = "stone_bricks";                          // plinth / base course
    else if (y === B + 4 || y === B + 10 || y === B + 11) id = "red_terracotta"; // cornices, parapet cap
    else if (y === B + 5) id = "smooth_stone";                  // storey sill band
    put(x, y, z, id, id === "quartz_pillar" ? { axis: "y" } : undefined);
  }

  if (corner) continue;

  // Windows on single-face wall cells.
  const face = outs[0];
  const isNS = face === "north" || face === "south";
  const along = isNS ? x : z;
  const len = isNS ? W : D;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;                               // inward neighbour
  const isFront = face === "north";
  const pp = paneProps(face);
  const innerFree = has(ix, iz) && outward(ix, iz).length === 0;

  if (along > 0 && along < len - 1) {
    // Ground storey: shopfront across the street face, plain windows elsewhere.
    const groundPane = isFront ? (along >= 1 && along <= 5) : along % 2 === 1;
    if (groundPane) {
      for (let y = B + 1; y <= B + 3; y++) {
        if (y < gr) continue;
        if (isFront && along === 3) {
          if (y <= B + 2) {
            const h = y === B + 1 ? "lower" : "upper";
            put(x, y, z, "dark_oak_door", { facing: "north", half: h, hinge: "left", open: "false", powered: "false" });
          } else {
            put(x, y, z, "glass_pane", pp);                     // transom
          }
        } else {
          put(x, y, z, "glass_pane", pp);
        }
      }
    }

    // Upper storey windows.
    if (along % 2 === 1) {
      for (let y = B + 6; y <= B + 9; y++) put(x, y, z, "glass_pane", pp);
      if (innerFree && along % 4 === 1) put(ix, B + 7, iz, "shroomlight");
    }

    // Warm light behind some ground-floor glass.
    if (innerFree && groundPane && !(isFront && along === 3)) {
      if ((isFront && (along === 1 || along === 5)) || (!isFront && along % 4 === 3)) {
        if (B + 2 >= gr) put(ix, B + 2, iz, "glowstone");
      }
    }
  }
}

// Roof: a small water tank and a lightning rod, both on the B+10 deck.
const tank = [[4, 2], [5, 2], [4, 3], [5, 3]];
if (tank.every(([x, z]) => has(x, z) && outward(x, z).length === 0)) {
  for (const [x, z] of tank) {
    put(x, B + 11, z, "light_gray_concrete");
    put(x, B + 12, z, "light_gray_concrete");
    put(x, B + 13, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(3, 7) && outward(3, 7).length === 0) {
  put(3, B + 11, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
