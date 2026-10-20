import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Xinyi-district commercial block, c. 1980s: smooth quartz-clad
// walls, shopfront glazing with red fascia on the ground floor, a belt course,
// upper-storey window bays, a stone cornice and a flat roof with rooftop plant.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865178";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 26;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const minZ = Math.min(...cells.map((c) => c[1]));
const frontRow = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontRow[Math.floor(frontRow.length / 2)];

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// [face, outward dx, outward dz, axis along the face]
const FACES = [
  ["north", 0, -1, "x"],
  ["south", 0, 1, "x"],
  ["west", -1, 0, "z"],
  ["east", 1, 0, "z"],
];
const exposed = (x, z) =>
  FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz))
    .map(([face, dx, dz, ax]) => ({ face, dx, dz, u: ax === "x" ? x : z }));

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

function applyFace(x, z, gr, f) {
  const { face, dx, dz, u } = f;
  const isFront = face === "north" && z === minZ;

  // Ground storey: shopfront glazing with piers, red fascia at gr+4.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isFront && u === doorX) continue; // door handled after the loop
    if (u % 4 === 0) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "light_blue_stained_glass");
  }
  put(x, gr + 4, z, "red_terracotta");

  // Upper storey: window bays with sill and head, piers on u%3==0.
  if (u % 3 !== 0) {
    put(x, gr + 6, z, "smooth_quartz");
    put(x, gr + 7, z, "light_blue_stained_glass_pane", paneProps(face));
    put(x, gr + 8, z, "light_blue_stained_glass_pane", paneProps(face));
    put(x, gr + 9, z, "smooth_quartz");
  }

  // Warm lights set back one air cell behind the glass (depth 2 inside).
  const ix = x - 2 * dx, iz = z - 2 * dz;
  if (inFp(ix, iz)) {
    if (u % 8 === 2) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else if (u % 9 === 4 && !isFront) put(ix, gr + 6, iz, "shroomlight");
  }
}

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground, then the floor slab.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "polished_andesite");

  const ex = exposed(x, z);
  const perim = ex.length > 0;

  // Storey floor slab / belt course.
  put(x, gr + 5, z, perim ? "smooth_quartz" : "smooth_stone");

  // Cornice on the perimeter, roof deck inside.
  if (perim) put(x, gr + 10, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  else put(x, gr + 10, z, "smooth_stone");

  if (perim) {
    for (const y of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, gr + y, z, "smooth_quartz");
    for (const f of ex) applyFace(x, z, gr, f);
  } else if ((x + z) % 7 === 0) {
    // Rooftop plant on the roof deck.
    put(x, gr + 11, z, "iron_block");
  }
}

// Entrance: double-height door on the street front, lantern above.
const doorCell = cells.find((c) => c[0] === doorX && c[1] === minZ);
if (doorCell) {
  const [x, z, gr] = doorCell;
  put(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${SRC}/${ID}.nbt`);
