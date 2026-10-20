import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009196";
const W = 31, H = 23, D = 14;

// Two-storey (about 11 block) Xinyi-era commercial block: pale tiled walls,
// pale-framed glazing, stone plinth, cornice, flat roof with plant boxes.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(key(x, z), gr);
const has = (x, z) => cellMap.has(key(x, z));
const isEdge = (x, z) => has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

const minG = Math.min(...cells.map((c) => c[2]));
const T0 = minG + 11; // roof about 11 blocks above lowest ground

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr] of cells) {
  const edgeN = !has(x, z - 1);
  const edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z);
  const edgeE = !has(x + 1, z);
  const edge = edgeN || edgeS || edgeW || edgeE;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);
  const Tc = Math.min(Math.max(T0, gr + 6), H - 2);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground deck / plinth
  put(x, gr, z, edge ? "stone_bricks" : "smooth_quartz");

  // Storeys: deck every 5 blocks, walls between
  for (let f = gr; f < Tc - 1; f += 5) {
    if (f > gr) put(x, f, z, "smooth_quartz");
    const top = Math.min(f + 4, Tc - 1);
    for (let y = f + 1; y <= top; y++) {
      if (!edge) continue; // interior: air behind the glass
      const ground = f === gr;

      // Index along the facade and facing direction
      let k, inX, inZ;
      if (edgeN || edgeS) {
        k = x;
        inX = x;
        inZ = edgeN ? z + 1 : z - 1;
      } else {
        k = z;
        inX = edgeW ? x + 1 : x - 1;
        inZ = z;
      }

      let id;
      let glass = false;
      if (corner) id = "light_gray_concrete";
      else if (y === f + 4) id = "light_gray_concrete"; // lintel
      else if (!ground && y === f + 1) id = "light_gray_concrete"; // sill
      else if (k % 3 === 1) { id = "light_blue_stained_glass"; glass = true; }
      else id = ground ? "light_gray_concrete" : "white_concrete";

      put(x, y, z, id);

      // Warm light one block behind some glazed bays
      if (glass && y === f + 3 && k % 6 === 4 && has(inX, inZ) && !isEdge(inX, inZ)) {
        put(inX, y, inZ, "glowstone");
      }
    }
  }

  // Roof slab over every cell
  put(x, Tc, z, "gray_concrete");

  if (edge) {
    // Cornice course just under the roof, parapet above
    put(x, Tc - 1, z, "smooth_quartz");
    put(x, Tc + 1, z, "white_concrete");
  } else {
    // Roof plant: small AC boxes and a taller unit
    if (x % 7 === 3 && z % 5 === 2) put(x, Tc + 1, z, "light_gray_concrete");
    if (x % 11 === 5 && z % 4 === 1) {
      put(x, Tc + 1, z, "iron_block");
      if (Tc + 2 < H) put(x, Tc + 2, z, "light_gray_concrete");
    }
  }
}

// Centred entrance on the north (z = 0) street frontage
const cx = Math.floor(W / 2);
const frontGround = cells.find(([x, z]) => x === cx && z === 0)?.[2];
if (frontGround !== undefined) {
  const gr = frontGround;
  put(cx, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(cx, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy band over the entrance
  for (let x = cx - 2; x <= cx + 2; x++) {
    if (has(x, 0)) put(x, gr + 4, 0, "dark_oak_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
