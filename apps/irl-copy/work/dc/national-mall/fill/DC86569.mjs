import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86569.cells.json`, "utf8"));

// Four-storey early-20th-century commercial block: red brick walls,
// limestone belt courses, stone base and cornice, centred street door.
const W = 11, H = 31, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  // snap lidar roof to storey lines so the massing reads as clean tiers
  let rq = Math.round(roof / 4) * 4;
  rq = Math.max(gr + 8, Math.min(H - 1, rq));
  map.set(key(x, z), { gr, roof: rq });
}
const has = (x, z) => map.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const DOOR_X = 5; // centre bay on the street (north, z = 0) face

for (const [x, z, , ] of cells) {
  const { gr, roof } = map.get(key(x, z));
  const eN = !has(x, z - 1), eS = !has(x, z + 1);
  const eW = !has(x - 1, z), eE = !has(x + 1, z);
  const perim = eN || eS || eW || eE;
  const cornerCell = (eN || eS) && (eW || eE);
  const along = (eN || eS) ? x : z;
  const inX = eW ? 1 : eE ? -1 : 0;
  const inZ = eN ? 1 : eS ? -1 : 0;
  const inner = (inX || inZ) ? map.get(key(x + inX, z + inZ)) : undefined;
  const top = roof - 1;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < roof; y++) {
    const h = y - gr;

    if (!perim) {
      // interior: floor slab per storey, roof deck on top, air otherwise
      if ((h > 0 && h % 4 === 0 && y < top) || y === top) {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    // entrance bay on the street face
    if (eN && Math.abs(x - DOOR_X) <= 1 && h <= 3) {
      if (x === DOOR_X) {
        if (h === 1) { put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (h === 2) { put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (h === 3) { put(x, y, z, "stone_bricks"); continue; } // lintel
      } else if (h >= 1) {
        put(x, y, z, "smooth_quartz"); // door surround
        continue;
      }
    }
    if (eN && x === DOOR_X - 2 && h === 1) {
      put(x, y, z, "glowstone"); // lamp beside door (on the facade line)
      continue;
    }

    let id;
    if (y === top) id = "stone_bricks";              // parapet cap
    else if (y === top - 1) id = "smooth_quartz";    // cornice
    else if (h === 0) id = "stone_bricks";           // base course
    else if (h % 4 === 0) id = "smooth_quartz";      // belt course
    else if (h % 4 === 3) id = "stone_bricks";       // lintel / sill course over glass
    else if (cornerCell || along % 2 === 0) id = "bricks"; // piers
    else id = "glass_pane";                          // window grid

    put(x, y, z, id);

    // warm light behind some glass, in the room just inside the facade
    if (id === "glass_pane" && h % 4 === 2 && along % 3 === 0 && inner) {
      if (y >= inner.gr && y < inner.roof - 1) {
        put(x + inX, y, z + inZ, "glowstone");
      }
    }
  }
}

g.save(`${DIR}/DC86569.nbt`);
