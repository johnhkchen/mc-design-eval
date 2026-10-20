import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "TPE105-00997F-2";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 16, H = 47, D = 35;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));
const isPerim = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const minG = Math.min(...[...groundOf.values()]);
// 2016 Xinyi mid-rise: 7 storeys of 5 blocks, level roof at lowest ground + 35
const top = minG + 35;

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, b, p) => {
  if (!inBounds(x, y, z)) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const paneProps = (xFace) => xFace
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const exXm = !has(x - 1, z), exXp = !has(x + 1, z);
  const exZm = !has(x, z - 1), exZp = !has(x, z + 1);
  const exX = exXm || exXp, exZ = exZm || exZp;
  const perim = exX || exZ;
  const corner = exX && exZ;
  const xFace = exX && !exZ;
  const along = xFace ? z : x;
  const pier = corner || along % 3 === 0;
  // entrance recess: three cells wide on the street face, door in the middle
  const entranceZone = exZm && x >= 6 && x <= 8;
  const doorCell = exZm && x === 7;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  for (let y = gr; y < top; y++) {
    const rel = y - minG;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (y === gr) {
      put(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (y === top - 1) {
      put(x, y, z, "smooth_quartz"); // cornice / roof slab
      continue;
    }

    if (perim) {
      if (doorCell && k === 0 && y >= gr + 1 && y <= gr + 2) {
        if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (entranceZone && k === 0 && y === gr + 3) {
        put(x, y, z, "smooth_stone"); // canopy lintel over the recess
        continue;
      }
      if (r === 0) {
        put(x, y, z, k === 0 ? "stone_bricks" : "light_gray_concrete");
      } else if (r === 4) {
        put(x, y, z, "light_gray_concrete");
      } else {
        if (pier) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass_pane", paneProps(xFace));
        }
      }
    } else {
      if (r === 0) {
        put(x, y, z, "light_gray_concrete");
      } else if (k >= 1 && r === 2) {
        const nearWall = isPerim(x - 1, z) || isPerim(x + 1, z) || isPerim(x, z - 1) || isPerim(x, z + 1);
        if (nearWall && (x + z + k) % 5 === 0) put(x, y, z, "glowstone");
      }
    }
  }

  // continuous parapet band one block above the roof on the perimeter
  if (perim) put(x, top, z, "white_concrete");
}

// roof plant room and a lightning rod on the terrace roof
for (let x = 5; x <= 10; x++) {
  for (let z = 12; z <= 22; z++) {
    if (!has(x, z)) continue;
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
  }
}
if (has(8, 17)) put(8, top + 2, 17, "lightning_rod");

g.save(`${dir}/${id}.nbt`);
