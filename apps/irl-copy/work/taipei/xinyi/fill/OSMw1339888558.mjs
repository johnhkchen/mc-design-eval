import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339888558";
const W = 22, H = 19, D = 13;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

// [face name, dx, dz] where (dx,dz) is the outward normal
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exteriorFaces = (x, z) => DIRS.filter(([, dx, dz]) => !has(x + dx, z + dz));
const tOf = (face, x, z) => (face === "north" || face === "south" ? x : z);

const NORMAL = Object.fromEntries(DIRS.map(([n, dx, dz]) => [n, [dx, dz]]));

// Extent of single-face (non-corner) wall runs per face, for window rhythm
const range = {};
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const f = exteriorFaces(x, z);
  if (f.length !== 1) continue;
  const [name] = f[0];
  const t = tOf(name, x, z);
  if (!range[name]) range[name] = { min: Infinity, max: -Infinity };
  range[name].min = Math.min(range[name].min, t);
  range[name].max = Math.max(range[name].max, t);
}

// Entrance: centre of the south (+z) run
const southR = range.south;
const doorT = southR ? Math.round((southR.min + southR.max) / 2) : null;

const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const paneProps = (name) => (name === "north" || name === "south"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z, gr] of cells) {
  const gg = Math.round(gr);

  // Foundation under the cell
  for (let y = 0; y < gg; y++) set(x, y, z, "stone_bricks");

  const faces = exteriorFaces(x, z);

  if (faces.length === 0) {
    // Interior: ground floor slab, storey slab, roof deck. Air gap otherwise.
    set(x, gg, z, "polished_andesite");
    set(x, gg + 3, z, "smooth_stone");
    set(x, gg + 6, z, "light_gray_concrete");
    continue;
  }

  // Perimeter shell: white concrete from ground to parapet top
  for (let y = gg; y <= gg + 6; y++) set(x, y, z, "white_concrete");
  set(x, gg, z, "polished_andesite");          // base course
  set(x, gg + 3, z, "smooth_quartz");          // storey line / lintel band
  set(x, gg + 5, z, "smooth_quartz");          // cornice
  set(x, gg + 6, z, "white_concrete");         // parapet

  if (faces.length === 1) {
    const [name] = faces[0];
    const t = tOf(name, x, z);
    const r = range[name];
    const isWin = t > r.min && t < r.max && (t - r.min) % 3 !== 0;

    if (isWin) {
      const pp = paneProps(name);
      // Shopfront glass, dark frame head, upper glazing
      set(x, gg + 1, z, "glass_pane", pp);
      set(x, gg + 2, z, "glass_pane", pp);
      set(x, gg + 4, z, "glass_pane", pp);

      // Warm light in the air gap behind some windows (sits on a slab or floor)
      const [dx, dz] = NORMAL[name];
      const ix = x - dx, iz = z - dz;
      if (exteriorFaces(ix, iz).length === 0 && has(ix, iz)) {
        if ((t - r.min) % 6 === 1) set(ix, gg + 1, iz, "glowstone");
        if ((t - r.min) % 6 === 4) set(ix, gg + 4, iz, "shroomlight");
      }
    } else {
      // Mullion: dark frame in the shopfront, white upper
      set(x, gg + 1, z, "dark_oak_planks");
      set(x, gg + 2, z, "dark_oak_planks");
    }
  }
  // 2+ faces: corner pilaster stays white concrete

  // Entrance door on the south run
  if (faces.some(([n]) => n === "south") && tOf("south", x, z) === doorT) {
    set(x, gg + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    set(x, gg + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Rooftop plant: two AC blocks on the interior roof deck
const roofUnits = [[5, 4], [6, 4], [5, 5], [6, 5], [14, 7], [15, 7], [14, 8], [15, 8]];
for (const [x, z] of roofUnits) {
  if (!has(x, z)) continue;
  if (exteriorFaces(x, z).length !== 0) continue;
  const gg = ground.get(`${x},${z}`);
  set(x, gg + 7, z, "smooth_stone");
  set(x, gg + 8, z, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
