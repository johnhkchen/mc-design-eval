import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752139";
const W = 16, H = 23, D = 17;

// Footprint: [x, z, ground] per cell
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 6, Math.round(gr))));
}
const inF = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Outward directions for missing neighbours
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const missingFaces = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));
const isPerim = (x, z) => missingFaces(x, z).length > 0;

// Storey structure (two storeys, flat roof, parapet, rooftop housing)
const ROOF_SLAB = 10;   // roof deck top layer
const PARAPET = 11;     // parapet course
const floorLine = (g) => (g <= 3 ? 5 : Math.min(g + 2, 8)); // 2nd-floor slab

// Choose a front door on the north face closest to the centre
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const f = missingFaces(x, z);
    if (!f.some((d) => d.name === "north")) continue;
    const dist = Math.abs(x - W / 2);
    if (dist < best) { best = dist; doorKey = `${x},${z}`; }
  }
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const PANE = "light_blue_stained_glass_pane";
const PIER = "polished_andesite";
const WALL = "white_concrete";
const BASE = "stone_bricks";

// Pass 1: foundations, floors, walls, roof
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gr = G(x, z);
  const fl = floorLine(gr);

  // Foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const faces = missingFaces(x, z);
  if (faces.length === 0) {
    // Interior cell: 2nd-floor slab and roof deck only
    put(x, fl, z, "light_gray_concrete");
    put(x, ROOF_SLAB, z, "light_gray_concrete");
    continue;
  }

  // Perimeter cell
  const face = faces[0];
  const alongX = face.name === "north" || face.name === "south";
  const u = alongX ? x : z;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const key = `${x},${z}`;
  const isDoor = key === doorKey;

  // Base course
  put(x, gr, z, BASE);

  // Shopfront / ground storey
  for (let y = gr + 1; y <= fl - 1; y++) {
    if (isDoor && y <= gr + 2) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: face.name, half, hinge: "left", open: "false", powered: "false",
      });
    } else if (isDoor && y >= gr + 3) {
      put(x, y, z, PIER);
    } else if (u % 3 === 0) {
      put(x, y, z, PIER);
    } else {
      put(x, y, z, PANE, paneProps);
    }
  }

  // Upper storey: window band fl+1..fl+3, spandrel and piers elsewhere
  for (let y = fl + 1; y <= 9; y++) {
    if (y <= fl + 3 && u % 3 !== 0) put(x, y, z, PANE, paneProps);
    else put(x, y, z, WALL);
  }

  // Storey line, cornice, parapet
  put(x, fl, z, "smooth_quartz");
  put(x, ROOF_SLAB, z, "smooth_quartz");
  put(x, PARAPET, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm lights behind glass on interior cells, rooftop equipment
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (isPerim(x, z)) continue;
  const gr = G(x, z);
  const fl = floorLine(gr);

  // Rooftop AC units on a loose grid
  if (x % 5 === 2 && z % 5 === 2) put(x, PARAPET, z, "smooth_stone");
}

// Lights: look from each perimeter window to its inner neighbour
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerim(x, z)) continue;
  const gr = G(x, z);
  const fl = floorLine(gr);
  const face = missingFaces(x, z)[0];
  const alongX = face.name === "north" || face.name === "south";
  const u = alongX ? x : z;
  const ix = x - face.dx, iz = z - face.dz;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  if (`${x},${z}` === doorKey) continue;

  if (u % 3 === 2) put(ix, gr + 1, iz, "glowstone");           // shopfront
  if (u % 6 === 1) put(ix, fl + 1, iz, "shroomlight");         // upper storey
}

// Stair/lift housing on the roof, centred on the footprint
const hx0 = 6, hx1 = 9, hz0 = 6, hz1 = 9;
let housingOk = true;
for (let x = hx0; x <= hx1; x++) for (let z = hz0; z <= hz1; z++) {
  if (!inF(x, z)) housingOk = false;
}
if (housingOk) {
  for (let x = hx0; x <= hx1; x++) for (let z = hz0; z <= hz1; z++) {
    const edge = x === hx0 || x === hx1 || z === hz0 || z === hz1;
    for (let y = PARAPET; y <= 13; y++) {
      if (edge) put(x, y, z, WALL);
    }
    put(x, 14, z, "smooth_quartz");
  }
  // Small window and lantern on the housing's north face
  put(hx0 + 1, 12, hz0, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
  put(hx0 + 2, 12, hz0, PANE, { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
