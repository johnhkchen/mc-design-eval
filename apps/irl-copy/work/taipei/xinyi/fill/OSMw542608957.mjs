import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608957";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup and outward directions (dx, dz)
const gm = new Map();
for (const [x, z, gr] of cells) gm.set(`${x},${z}`, gr);
const has = (x, z) => gm.has(`${x},${z}`);
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const minG = Math.min(...cells.map(c => c[2]));

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Facade faces per cell
const faceMap = new Map();
for (const [x, z] of cells) {
  const fs = DIRS.filter(([n, dx, dz]) => !has(x + dx, z + dz)).map(d => d[0]);
  faceMap.set(`${x},${z}`, fs);
}
const facesOf = (x, z) => faceMap.get(`${x},${z}`) || [];

// Glass pane connections follow the facade wall
const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: south-facing edge cell nearest the middle of the facade
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const fs = facesOf(x, z);
    if (fs.length === 1 && fs[0] === "south") {
      const d = Math.abs(x - 6.5);
      if (d < best) { best = d; entrance = [x, z]; }
    }
  }
}

const WIN_ROWS = new Set([1, 2, 3, 6, 7, 8]);

for (const [x, z, gr] of cells) {
  const fs = facesOf(x, z);
  const edge = fs.length > 0;
  const corner = fs.length >= 2;
  const deck = Math.max(minG + 10, gr + 6);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground, storey 2 line, roof deck (full footprint)
  put(x, gr, z, edge ? "polished_andesite" : "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");
  put(x, deck, z, "smooth_stone");

  if (edge) {
    const wf = fs.length === 1 ? fs[0] : null;
    const idx = (wf === "north" || wf === "south") ? x : z;
    const windowBay = !corner && wf !== null && idx % 3 !== 0;

    for (let y = gr + 1; y < deck; y++) {
      const r = y - gr;
      if (r === 5) continue;                       // storey line already a slab
      if (r === 4 || r === 9) { put(x, y, z, "polished_andesite"); continue; }
      const isEntrance = entrance && entrance[0] === x && entrance[1] === z && r <= 3;
      if (isEntrance) continue;                    // set after the loop
      if (WIN_ROWS.has(r) && windowBay) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(wf));
      } else {
        put(x, y, z, "smooth_quartz");
      }
    }

    // Parapet and cap
    put(x, deck + 1, z, "smooth_quartz");
    put(x, deck + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: air, rooftop equipment on the deck
    if (x % 4 === 1 && z % 5 === 2) put(x, deck + 1, z, "gray_concrete");
  }
}

// Entrance door, canopy-line lantern and warm light behind glass
if (entrance) {
  const [ex, ez] = entrance;
  const gr = gm.get(`${ex},${ez}`);
  put(ex, gr + 1, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 2, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, gr + 3, ez, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm lights in interior cells behind some windows
for (const [x, z, gr] of cells) {
  const fs = facesOf(x, z);
  if (fs.length !== 1) continue;
  const wf = fs[0];
  const idx = (wf === "north" || wf === "south") ? x : z;
  if (idx % 3 === 0) continue;
  const [, odx, odz] = DIRS.find(d => d[0] === wf);
  const ix = x - odx, iz = z - odz;
  if (!has(ix, iz) || facesOf(ix, iz).length !== 0) continue;
  if (entrance && entrance[0] === x && entrance[1] === z) continue;
  // storey 2 glowstone behind some windows
  if ((x + z) % 4 === 0) put(ix, gr + 6, iz, "glowstone");
  // ground floor lantern standing on the slab behind some shopfront glass
  else if ((x + z) % 3 === 0) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
