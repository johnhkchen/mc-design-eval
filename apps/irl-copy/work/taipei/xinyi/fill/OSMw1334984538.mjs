import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1334984538";
const W = 14, H = 19, D = 20;
const ROOF_Y = 6;      // roof slab, top of the storey
const PARAPET_Y = 7;   // parapet ring, roof reads ~7 blocks above lowest ground
const CORNICE_Y = 5;   // cornice course closing the storey

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => Math.round(c[2])));
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(H - 1, Math.round(gr) - minG));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!inFp(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// outward directions: name, dx, dz (order = facade priority)
const DIRS = [["S", 0, 1], ["N", 0, -1], ["E", 1, 0], ["W", -1, 0]];
const exposed = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// front entrance: south-facing exposed cell nearest x = 7
const frontCells = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (exposed(x, z).some(d => d[0] === "S")) frontCells.push([x, z]);
}
frontCells.sort((a, b) => Math.abs(a[0] - 7) - Math.abs(b[0] - 7));
const door = frontCells.length ? frontCells[0] : null;

for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const isPer = ex.length > 0;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");
  // storey floor slab on this cell's ground
  put(x, gc, z, "smooth_stone");
  if (gc >= ROOF_Y) continue;

  // roof slab across the footprint
  put(x, ROOF_Y, z, "smooth_stone");

  if (isPer) {
    const [face, dx, dz] = ex[0];
    const onZFace = face === "S" || face === "N";
    const along = onZFace ? x : z;
    const L = onZFace ? W : D;
    const pier = along % 3 === 0 || along === L - 1;
    const isDoor = door && door[0] === x && door[1] === z && face === "S";
    const paneProps = onZFace ? GLASS_NS : GLASS_EW;

    for (let y = gc + 1; y <= CORNICE_Y; y++) {
      const r = y - gc;
      if (isDoor && r === 1) { put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isDoor && r === 2) { put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === CORNICE_Y) { put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }
      if (r === 1) { put(x, y, z, "stone_bricks"); continue; }
      if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }
      // r = 2 or 3: window band
      if (isDoor && r === 3) { put(x, y, z, "glass_pane", GLASS_NS); continue; }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass_pane", paneProps);
    }

    // warm light behind a window glass, in the air gap just inside
    if (!pier && gc + 2 <= CORNICE_Y) {
      const nx = x - dx, nz = z - dz;
      const ngc = gAt(nx, nz);
      if (inFp(nx, nz) && ngc === gc && (along % 6 === 2) && !(isDoor)) {
        put(nx, gc + 2, nz, "glowstone");
      }
    }

    // parapet ring
    put(x, PARAPET_Y, z, "white_concrete");
  }
}

// roof plant boxes on the roof slab (only where roof exists)
for (const [k, gc] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (gc >= ROOF_Y) continue;
  const inBox = (x >= 3 && x <= 5 && z >= 8 && z <= 10) || (x >= 8 && x <= 10 && z >= 8 && z <= 10);
  if (inBox) {
    put(x, PARAPET_Y, z, "light_gray_concrete");
    put(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}

// hanging lanterns in the storey, just inside the front
for (const [lx, lz] of [[4, 16], [9, 16]]) {
  if (inFp(lx, lz) && gAt(lx, lz) <= CORNICE_Y - 1) {
    put(lx, CORNICE_Y, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
