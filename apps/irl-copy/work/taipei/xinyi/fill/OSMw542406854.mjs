import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 16 x 18 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey 1980s Taipei commercial block: white concrete frame,
// light-grey storey bands and cornice, a shopfront on the street (south) face,
// glazed bays with grey frames, a quartz rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542406854";
const W = 16, H = 23, D = 18;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of raw) cellMap.set(key(c[0], c[1]), Math.round(c[2]));
const has = (x, z) => cellMap.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const ORDER = ["south", "north", "east", "west"];
const openFaces = (x, z) => ORDER.filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glazing as panes, connected along the wall axis.
const paneProps = (face) =>
  (face === "north" || face === "south")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle of the south (street-facing) perimeter cells.
const southCells = [...cellMap.keys()]
  .map(k => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z + 1))
  .sort((a, b) => a[0] - b[0]);
const entrance = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const entranceKey = entrance ? key(entrance[0], entrance[1]) : null;

// Interior cells for the rooftop tank (centred on the footprint).
let sx = 0, sz = 0, n = 0;
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (openFaces(x, z).length === 0) { sx += x; sz += z; n++; }
}
const cx = n ? Math.round(sx / n) : Math.floor(W / 2);
const cz = n ? Math.round(sz / n) : Math.floor(D / 2);

for (const [k, base] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const faces = openFaces(x, z);
  const perim = faces.length > 0;
  const face = faces[0];

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at each storey line and the roof, all footprint cells.
  put(x, base, z, "smooth_stone");
  put(x, base + 5, z, "smooth_stone");
  put(x, base + 10, z, "gray_concrete");

  if (!perim) {
    // Interior: air between slabs (no interiors).
    continue;
  }

  // Base course, storey band, cornice and parapet.
  put(x, base, z, "light_gray_concrete");
  put(x, base + 5, z, "light_gray_concrete");
  put(x, base + 10, z, "light_gray_concrete");
  put(x, base + 11, z, "light_gray_concrete");

  // Wall body for both storeys.
  for (const dy of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, base + dy, z, "white_concrete");

  // Articulation along the primary face: piers every third cell.
  const isNS = face === "north" || face === "south";
  const t = isNS ? x : z;
  const pier = t % 3 === 0;
  const panes = paneProps(face);

  if (!pier) {
    // Storey 1: shopfront glazing with lintel.
    if (k === entranceKey) {
      const doorFace = { facing: "south", hinge: "left", open: "false", powered: "false" };
      put(x, base + 1, z, "dark_oak_door", { ...doorFace, half: "lower" });
      put(x, base + 2, z, "dark_oak_door", { ...doorFace, half: "upper" });
      // Glazing either side of the door is handled by the pier pattern;
      // the entrance cell carries a hanging lantern over the door.
      put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
      put(x, base + 4, z, "gray_concrete");
    } else {
      put(x, base + 1, z, "glass_pane", panes);
      put(x, base + 2, z, "glass_pane", panes);
      put(x, base + 3, z, "glass_pane", panes);
      put(x, base + 4, z, "gray_concrete");
    }
    // Storey 2: sill, two glazed rows, head.
    put(x, base + 6, z, "gray_concrete");
    put(x, base + 7, z, "glass_pane", panes);
    put(x, base + 8, z, "glass_pane", panes);
    put(x, base + 9, z, "gray_concrete");
  }

  // Warm lights behind some glazed bays (interior cell inward).
  if (!pier && k !== entranceKey && face) {
    const ix = x - DIRS[face][0], iz = z - DIRS[face][1];
    if (has(ix, iz) && openFaces(ix, iz).length === 0) {
      if (t % 6 === 4) put(ix, base + 8, iz, "glowstone");
      else if (t % 6 === 1) put(ix, base + 2, iz, "glowstone");
    }
  }
}

// Rooftop water tank: 3 x 3 interior cells, two blocks high.
for (const [k, base] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  if (openFaces(x, z).length) continue;
  if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
    let ok = true;
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      if (!has(cx + dx, cz + dz) || openFaces(cx + dx, cz + dz).length) ok = false;
    }
    if (ok) {
      put(x, base + 11, z, "smooth_quartz");
      put(x, base + 12, z, "smooth_quartz");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
