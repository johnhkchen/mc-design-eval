import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121667";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 17 x 22, roof ~11 blocks above lowest ground.
// Reading: a two-storey post-war commercial block (1960s-80s shophouse/office
// type) in Xinyi: cream concrete walls, light-grey concrete frames and cornice,
// tinted glass shopfronts at street level, and a row of upper-floor windows.
const W = 17, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr);
const has = (x, z) => gm.has(`${x},${z}`);

function S(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Exposed faces: [dx, dz, name of the outward facing]
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// Pre-compute exposure for every cell
const info = cells.map(([x, z, gr]) => {
  const exposed = FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
  return { x, z, gr, exposed, edge: exposed.length > 0 };
});

// 1. Foundations, floors and roof slabs
for (const c of info) {
  const { x, z, gr, edge } = c;
  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");
  // Ground-floor plinth / floor
  S(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  // Upper floor slab (between storeys)
  S(x, gr + 5, z, edge ? "light_gray_concrete" : "smooth_stone");
  // Roof slab with cornice on the edge
  S(x, gr + 10, z, edge ? "light_gray_concrete" : "smooth_stone");
  // Parapet on the edge
  if (edge) S(x, gr + 11, z, "light_gray_concrete");
}

// 2. Walls: two storeys of five blocks each, on exposed cells only
const wallCells = new Map(); // key -> {x,z,gr,face}
for (const c of info) {
  if (!c.edge) continue;
  const { x, z, gr, exposed } = c;
  const corner = exposed.length >= 2;

  for (const [dx, dz, name] of exposed) {
    const t = dx !== 0 ? z : x; // position along the face
    const isWindow = t % 3 === 1;

    for (let y = gr + 1; y <= gr + 9; y++) {
      let block = "white_concrete";
      let props;
      if (corner) {
        block = "white_concrete";
      } else if (y <= gr + 3) {
        // Shopfront band: glass bays between piers
        block = isWindow ? "light_blue_stained_glass" : "white_concrete";
      } else if (y === gr + 4) {
        block = "light_gray_concrete"; // shopfront lintel
      } else if (y === gr + 5) {
        block = "light_gray_concrete"; // storey line
      } else if (y <= gr + 8) {
        block = isWindow ? "light_blue_stained_glass" : "white_concrete";
      } else {
        block = "light_gray_concrete"; // top course under the roof
      }
      // Window frames: concrete round glass on the upper floor
      if (!corner && y >= gr + 6 && y <= gr + 8 && isWindow) block = "light_blue_stained_glass";
      S(x, y, z, block, props);
    }
    wallCells.set(`${x},${z},${name}`, { x, z, gr, name, t, dx, dz });
  }
}

// 3. Entrance on the south face (or any exposed face if none)
let door = null;
for (const [key, w] of wallCells) {
  if (w.name !== "south") continue;
  if (!door || Math.abs(w.t - 8) < Math.abs(door.t - 8)) door = w;
}
if (!door) {
  for (const w of wallCells.values()) door = door || w;
}
if (door) {
  const { x, z, gr } = door;
  S(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  S(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  S(x, gr + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Warm lights behind some upper-floor windows
let lampCount = 0;
for (const w of wallCells.values()) {
  if (w.name === undefined) continue;
  if (w.t % 6 !== 1) continue;
  // Only on the upper storey, every other window
  lampCount++;
  if (lampCount % 2 !== 0) continue;
  const ix = w.x - w.dx;
  const iz = w.z - w.dz;
  if (!has(ix, iz)) continue;
  const inner = info.find((c) => c.x === ix && c.z === iz);
  if (!inner || inner.edge) continue;
  S(ix, w.gr + 7, iz, "glowstone");
}

// 5. Roof equipment: a small plant box near the centre of the roof
const cxAll = info.reduce((s, c) => s + c.x, 0) / info.length;
const czAll = info.reduce((s, c) => s + c.z, 0) / info.length;
for (const c of info) {
  if (c.edge) continue;
  if (Math.abs(c.x - Math.round(cxAll)) <= 1 && Math.abs(c.z - Math.round(czAll)) <= 1) {
    S(c.x, c.gr + 11, c.z, "light_gray_concrete");
  }
}
// Spot lamp on the plant box so it reads at dusk
{
  const c = info.find((c) => !c.edge && c.x === Math.round(cxAll) && c.z === Math.round(czAll));
  if (c) S(c.x, c.gr + 12, c.z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
