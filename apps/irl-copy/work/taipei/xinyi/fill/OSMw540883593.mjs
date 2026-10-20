import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883593";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground height (integer)
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.min(...ground.values());                       // lowest ground = base course level
const keys = [...ground.keys()].map(k => k.split(",").map(Number));
const zFront = Math.min(...keys.map(([, z]) => z));           // street face
const frontXs = keys.filter(([, z]) => z === zFront).map(([x]) => x);
const doorX = Math.floor((Math.min(...frontXs) + Math.max(...frontXs)) / 2);

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const put = (x, y, z, blk, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, blk, props); else g.set(x, y, z, blk);
};

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const per = isPerim(x, z);
  const onZFace = !has(x, z - 1) || !has(x, z + 1);   // north/south face cell
  const onXFace = !has(x - 1, z) || !has(x + 1, z);   // east/west face cell
  const front = per && z === zFront;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "stone_bricks");

  // body: from the cell's ground up to the parapet top at B+11
  for (let k = 0; k <= 11; k++) {
    const y = B + k;
    if (y < gr || y >= H) continue;

    if (k === 0) { put(x, y, z, per ? "light_gray_concrete" : "smooth_stone"); continue; }
    if (k === 5) { put(x, y, z, "smooth_stone"); continue; }                  // storey-2 floor slab
    if (k === 10) { put(x, y, z, per ? "smooth_stone" : "gray_concrete"); continue; } // cornice / roof slab
    if (k === 11) {
      if (per) put(x, y, z, "light_gray_concrete");                          // parapet
      else if (x % 5 === 2 && z % 4 === 2) put(x, y, z, "iron_block");       // rooftop AC unit
      continue;
    }

    if (per) {
      // shopfront entrance on the street face
      if (front && x === doorX && (k === 1 || k === 2)) {
        put(x, y, z, "dark_oak_door", doorProps(k === 1 ? "lower" : "upper"));
        continue;
      }
      const win = (k >= 1 && k <= 3) || (k >= 6 && k <= 8);
      const corner = onZFace && onXFace;
      const pier = corner || (onZFace ? x % 3 === 0 : z % 3 === 0);
      if (!win || pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else {
      // interior: air, except a few warm lights set just behind the street glass
      if (z === zFront + 1 && k === 1 && x % 4 === 1) put(x, y, z, "glowstone");
      if (z === zFront + 1 && k === 6 && x % 3 === 1) put(x, y, z, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
