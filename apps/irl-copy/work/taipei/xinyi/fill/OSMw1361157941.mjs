import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1361157941";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 33 x 16. Read as a 1990s-2000s Xinyi commercial/office block:
// granite base, four storeys of 5 blocks with light blue glazed bays and
// quartz piers, a light grey cornice, a white parapet and a central roof box.
const W = 33, H = 33, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), gr);

const minG = Math.min(...foot.values());
const TOP = minG + 21;          // parapet top, absolute y
const BODY_TOP = minG + 19;     // last storey row (rel 19)
const ROOF_REL = 20;            // roof slab row
const PARAPET_REL = 21;         // parapet row on edges

const inF = (x, z) => foot.has(key(x, z));
const edge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: single door on the z=0 face at x=16.
const ENX = 16, ENZ = 0;
const doorHere = (x, z) => x === ENX && z === ENZ && inF(x, z) && edge(x, z);

function facadeBlock(x, z, k, o) {
  const u = x + z;
  if (k === 0) {
    if (o === 0) return { id: "polished_granite" };
    if (doorHere(x, z)) {
      if (o === 1) return { id: "dark_oak_door", p: { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" } };
      if (o === 2) return { id: "dark_oak_door", p: { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" } };
      if (o === 3) return { id: "smooth_quartz" }; // lintel above door
    }
    if (o === 4) return { id: "smooth_quartz" };
    if (u % 3 === 0) return { id: "smooth_quartz" };
    return { id: "gray_stained_glass" };
  }
  // Upper storeys
  if (o === 0) return { id: "light_gray_concrete" }; // belt course
  if (o === 4) return { id: "smooth_quartz" };       // spandrel
  if (u % 3 === 0) return { id: "smooth_quartz" };   // mullion pier
  if (o === 2 && u % 9 === 4 && k % 2 === 1) return { id: "glowstone" }; // warm lit bay
  return { id: "light_blue_stained_glass" };
}

// Foundation, body, floors, roof and parapet.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const isEdge = edge(x, z);
  for (let y = gr; y <= TOP; y++) {
    const rel = y - minG;
    if (rel < 0) continue;

    if (rel <= BODY_TOP) {
      if (isEdge) {
        const k = Math.floor(rel / 5);
        const o = rel % 5;
        const fb = facadeBlock(x, z, k, o);
        put(x, y, z, fb.id, fb.p);
      } else if (rel === gr - minG || (rel > 0 && rel % 5 === 0)) {
        // Floor slab per storey on interior cells (air elsewhere).
        put(x, y, z, "smooth_quartz");
      }
    } else if (rel === ROOF_REL) {
      put(x, y, z, "light_gray_concrete");
    } else if (rel === PARAPET_REL && isEdge) {
      put(x, y, z, "white_concrete");
    }
  }
}

// Central rooftop box (penthouse) on the roof slab, interior cells only.
for (let x = 11; x <= 21; x++) {
  for (let z = 4; z <= 11; z++) {
    if (!inF(x, z)) continue;
    const perim = x === 11 || x === 21 || z === 4 || z === 11;
    const rim = perim && !(x % 3 === 0);
    put(x, minG + 21, z, "smooth_quartz");
    put(x, minG + 22, z, perim ? (rim ? "light_blue_stained_glass" : "smooth_quartz") : "air");
    put(x, minG + 23, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
