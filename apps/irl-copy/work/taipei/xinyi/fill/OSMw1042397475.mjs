import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a 1990s Xinyi office block: 5 storeys of 5 blocks,
// reinforced concrete frame, white-tile piers, blue-tinted glass bands, light-grey
// floor lines, granite base course, parapet, and rooftop plant screens.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397475";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 38, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const STOREY = 5;
const TOP_J = 25; // roof top / parapet level above each cell's ground

for (const [x, z, gc] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone");

  // Face detection from footprint neighbours.
  const Wf = !inside(x - 1, z);
  const Ef = !inside(x + 1, z);
  const Nf = !inside(x, z - 1);
  const Sf = !inside(x, z + 1);
  const edge = Wf || Ef || Nf || Sf;
  const xFace = Wf || Ef;
  const zFace = Nf || Sf;
  const corner = xFace && zFace;
  const a = xFace ? z : x; // along-facade coordinate
  const dx = xFace ? (Wf ? 1 : -1) : 0; // inward direction
  const dz = xFace ? 0 : (Nf ? 1 : -1);

  for (let j = 0; j <= TOP_J; j++) {
    const y = gc + j;

    if (j === TOP_J) {
      // Parapet on the edge; rooftop plant screens inside.
      if (edge) {
        put(x, y, z, "white_concrete");
      } else {
        const plantA = x >= 3 && x <= 6 && z >= 4 && z <= 7;
        const plantB = x >= 16 && x <= 19 && z >= 9 && z <= 12;
        if (plantA || plantB) put(x, y, z, "smooth_stone");
      }
      continue;
    }

    if (j === 24) {
      // Roof slab over the whole footprint.
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (j % STOREY === 0) {
      // Floor slabs (j=0 is the base course on the outside).
      if (edge) {
        put(x, y, z, j === 0 ? "polished_granite" : "light_gray_concrete");
      } else {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // Window rows.
    if (!edge) continue; // air gap behind the glass

    const pier = corner || a % 3 === 0;
    const isEntranceCell = Sf && z === D - 1 && (x === 10 || x === 11);

    if (isEntranceCell && j <= 2) {
      if (x === 10) {
        put(x, y, z, "dark_oak_door", {
          facing: "south", half: j === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
      continue;
    }
    if (isEntranceCell && j === 4) {
      put(x, y, z, "white_concrete"); // entrance lintel
      continue;
    }

    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const glassId = (j % 10 === 2) ? "cyan_stained_glass" : "light_blue_stained_glass";
    put(x, y, z, glassId);

    // Warm lamp deeper inside, sitting on the floor slab below, in some windows.
    const storeyIdx = Math.floor(j / STOREY);
    if (j % STOREY === 1 && storeyIdx % 2 === 1 && a % 6 === 1) {
      const tx = x + dx * 2;
      const tz = z + dz * 2;
      if (inside(tx, tz) && ground.get(`${tx},${tz}`) === gc) {
        put(tx, gc + j, tz, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
