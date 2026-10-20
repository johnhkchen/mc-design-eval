import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE95-0030-3F-3: 2006 Xinyi mid-rise office/residential block, 12 storeys,
// white tiled facade with blue-tinted glass bands, polished stone base,
// street-level shopfront with a lintel canopy on the north (z = 0) face,
// and a rooftop mechanical penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE95-0030-3F-3";

const W = 11, D = 22, H = 71;
const ROOF = 59;            // roof surface above lowest ground
const TOP = ROOF - 1;       // parapet course at y 58
const STOREY = 5;
const PH_X0 = 2, PH_X1 = 8, PH_Z0 = 4, PH_Z1 = 17; // penthouse inset
const PH_TOP = 63;          // penthouse cap course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);

const has = (x, z) => gmap.has(`${x},${z}`);
const faces = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};

const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const paneProps = (face) =>
  face === "N" || face === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const inward = {
  N: [0, 1],
  S: [0, -1],
  W: [1, 0],
  E: [-1, 0],
};

// ---- Per-cell construction ----
for (const [x, z, gc] of cells) {
  const f = faces(x, z);
  const edge = f.N || f.S || f.W || f.E;
  const corner = (f.N || f.S) && (f.W || f.E);
  const face = f.N ? "N" : f.S ? "S" : f.W ? "W" : "E";

  // Position along the face, used for pilaster rhythm.
  const u = face === "N" || face === "S" ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: floor slabs at each storey line, roof deck at the top.
    for (let k = 1; k * STOREY <= TOP; k++) {
      const y = k * STOREY;
      if (y > gc) put(x, y, z, "white_concrete");
    }
    put(x, TOP, z, "gray_concrete");
    continue;
  }

  // Edge cell: facade from its ground up to the parapet.
  for (let y = gc; y < TOP; y++) {
    const k = Math.floor(y / STOREY);
    const r = y % STOREY;

    const pilaster =
      corner ||
      ((face === "N" || face === "S")
        ? x % 4 === 0 || x === W - 1
        : z % 4 === 0 || z === D - 1);
    const pier = corner || pilaster || u % 2 === 0;
    const pierBlock = corner || pilaster ? "smooth_quartz" : "white_concrete";

    // Street entrance, centred on the north face at ground level.
    if (k === 0 && face === "N" && !corner && x === 5 && (y === gc || y === gc + 1)) {
      put(x, y, z, "oak_door", {
        facing: "north",
        half: y === gc ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Plinth course at the foot of the wall.
    if (y === gc) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    // Ground-floor shopfront on the street (north) face.
    if (k === 0 && face === "N" && !corner) {
      if (y === gc + 3 && x >= 3 && x <= 7) put(x, y, z, "smooth_quartz");   // entrance canopy
      else if (x === 5 && y === gc + 2) put(x, y, z, "light_gray_concrete"); // transom over door
      else if (y > gc + 3 && x === 5) put(x, y, z, "smooth_quartz");         // head above canopy
      else if (y > gc + 3) put(x, y, z, pierBlock);
      else put(x, y, z, "glass");
      continue;
    }

    // Ground floor on other faces, and all upper storeys.
    if (r === 0) {
      put(x, y, z, "light_gray_concrete");          // storey line
      continue;
    }
    if (r === 4) {
      put(x, y, z, "gray_concrete");                // dark spandrel, adds shadow
      continue;
    }
    if (pier) {
      put(x, y, z, pierBlock);                      // mullion / pilaster
      continue;
    }

    // Glazed bay.
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(face));

    // Warm light just inside some windows.
    if (r === 2 && (x + z + k) % 3 === 0) {
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Parapet course on the edge.
  put(x, TOP, z, "smooth_quartz");
}

// ---- Rooftop mechanical penthouse, standing on the roof deck ----
for (let x = PH_X0; x <= PH_X1; x++) {
  for (let z = PH_Z0; z <= PH_Z1; z++) {
    if (!has(x, z)) continue;
    const rim = x === PH_X0 || x === PH_X1 || z === PH_Z0 || z === PH_Z1;

    // Walls from the roof surface up.
    if (rim) {
      for (let y = ROOF; y < PH_TOP; y++) {
        put(x, y, z, y === ROOF ? "smooth_quartz" : "light_gray_concrete");
      }
    }
    // Cap of the penthouse.
    put(x, PH_TOP, z, "gray_concrete");
  }
}

// Roof-top fittings: corner lanterns and a lightning rod on the penthouse.
for (const [x, z] of [
  [PH_X0, PH_Z0],
  [PH_X1, PH_Z0],
  [PH_X0, PH_Z1],
  [PH_X1, PH_Z1],
]) {
  if (has(x, z)) put(x, PH_TOP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}
if (has(5, 11)) {
  put(5, PH_TOP + 1, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
