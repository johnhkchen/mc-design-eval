import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865173";
const W = 11, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: ground height per cell
const ground = new Map();
let base = Infinity;
for (const [x, z, gc] of cells) {
  ground.set(`${x},${z}`, gc);
  base = Math.min(base, gc);
}
const has = (x, z) => ground.has(`${x},${z}`);
const top = base + 11; // roof sits about 11 blocks above lowest ground

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces per footprint cell
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

// Door: centre of the south street face if present, else north
let doorFace = null;
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (facesOf(x, z).includes("south")) { doorFace = "south"; break; }
}
if (!doorFace) doorFace = facesOf(cells[0][0], cells[0][1])[0] ?? "north";

const doorUs = cells
  .filter(([x, z]) => facesOf(x, z).includes(doorFace))
  .map(([x, z]) => (doorFace === "north" || doorFace === "south" ? x : z));
const doorU = doorUs.length
  ? Math.round((Math.min(...doorUs) + Math.max(...doorUs)) / 2)
  : -1;

const inward = {
  north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0],
};

const lateLights = []; // [x, y, z] shroomlights/glowstone set after interiors

for (const [x, z, gc] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc && y < H; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs at storey lines and roof, air elsewhere
    for (let y = gc; y < top; y++) {
      const h = y - base;
      if (h === 5 || h === 10) put(x, y, z, "light_gray_concrete");
    }
    // Small roof plant box on the upper roof
    if (x >= 4 && x <= 6 && z >= 6 && z <= 10) put(x, base + 10, z, "smooth_stone");
    continue;
  }

  // Facade: choose the face that drives the pattern (prefer the street side)
  const face = faces.includes(doorFace) ? doorFace : faces[0];
  const u = face === "north" || face === "south" ? x : z;
  const pier = u % 3 === 0;
  const isDoorCell = face === doorFace && u === doorU;
  const lit = u % 6 === 1; // some bays carry a warm light behind the glass

  for (let y = gc; y < top; y++) {
    const h = y - base;
    let b = null;
    let props = null;

    if (y === gc) {
      b = "polished_andesite"; // base course
    } else if (h >= 1 && h <= 3) {
      if (isDoorCell && (h === 1 || h === 2)) {
        b = "oak_door";
        props = {
          facing: face,
          half: h === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else {
        b = pier ? "white_concrete" : "glass";
      }
    } else if (h === 4) {
      b = "dark_oak_planks"; // shopfront fascia
    } else if (h === 5) {
      b = "light_gray_concrete"; // storey line
    } else if (h >= 6 && h <= 8) {
      b = pier ? "white_concrete" : "glass";
    } else if (h === 9) {
      b = "smooth_stone"; // cornice
    } else if (h === 10) {
      b = pier ? "smooth_quartz" : "white_concrete"; // parapet with caps
    }

    if (b) put(x, y, z, b, props);
  }

  // Warm lights behind some glazed bays (inner cell must be interior)
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  const innerIsInterior = has(ix, iz) && facesOf(ix, iz).length === 0;
  if (innerIsInterior && !pier) {
    if (lit) lateLights.push([ix, base + 7, iz, "shroomlight"]);
    else if (u % 6 === 4) lateLights.push([ix, base + 2, iz, "glowstone"]);
  }
}

for (const [x, y, z, id] of lateLights) put(x, y, z, id);

g.save(`${DIR}/${ID}.nbt`);
