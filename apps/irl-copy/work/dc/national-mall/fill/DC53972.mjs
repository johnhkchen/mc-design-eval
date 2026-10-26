import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC53972.cells.json`, "utf8"));

const W = 18, H = 29, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();

// Per-cell ground and roof; roof quantised to 3-block storey bays
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.min(26, Math.round(gr)));
  const rawRel = Math.round(roof) - ground;
  const rel = Math.max(3, 3 * Math.round(rawRel / 3));
  const top = Math.min(28, ground + rel);
  info.set(key(x, z), { x, z, ground, top });
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const topAt = (x, z) => (info.has(key(x, z)) ? info.get(key(x, z)).top : -1);

// Outward faces: a neighbour is missing or lower (setbacks show their walls)
const facesOf = (c) => DIRS.filter(([dx, dz]) => topAt(c.x + dx, c.z + dz) < c.top);
const edgeSet = new Set();
for (const c of info.values()) if (facesOf(c).length) edgeSet.add(key(c.x, c.z));
const adjacentToEdge = (c) =>
  DIRS.some(([dx, dz]) => edgeSet.has(key(c.x + dx, c.z + dz)));

const PANE = "light_blue_stained_glass_pane";
const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Entrance on the z=0 face, centred on x=8
const DOOR_X = 8;
const SURROUND = [6, 7, 9, 10];

for (const c of info.values()) {
  const { x, z, ground, top } = c;
  const faces = facesOf(c);
  const edge = faces.length > 0;

  // Foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (edge) {
    const corner = faces.some((f) => f[0] !== 0) && faces.some((f) => f[1] !== 0);
    // Along-facade coordinate: x on north/south faces, z on east/west faces
    const along = faces[0][0] !== 0 ? z : x;
    const onFrontDoorFace = faces.some((f) => f[0] === 0 && f[1] === -1) && z === 0;
    const isDoorCell = onFrontDoorFace && x === DOOR_X;
    const isSurround = onFrontDoorFace && SURROUND.includes(x);

    for (let y = ground; y < top; y++) {
      const rel = y - ground;

      if (isDoorCell && rel === 0) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoorCell && rel === 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (y === top - 1) { g.set(x, y, z, "smooth_quartz"); continue; }       // cornice / parapet course
      if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }              // solid corner piers
      if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }            // base course
      if (isSurround && rel <= 2) { g.set(x, y, z, "stone_bricks"); continue; } // entrance surround
      if (rel % 3 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }      // storey line / spandrel
      if (along % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }   // mullion pier
      g.set(x, y, z, PANE, paneProps);                                        // window glass
    }
  } else {
    // Interior: solid core with floor slabs; cells behind the facade keep an air gap in window bands
    const ring = adjacentToEdge(c);
    for (let y = ground; y < top - 1; y++) {
      const rel = y - ground;
      const band = rel > 0 && rel % 3 !== 0;
      if (ring && band) {
        if (rel === 1 && (x * 3 + z * 5) % 4 === 0) g.set(x, y, z, "glowstone");
        continue; // air gap behind the glass
      }
      g.set(x, y, z, "smooth_quartz");
    }
    g.set(x, top - 1, z, "gray_concrete");                                    // flat roof membrane
    // Roof plant on a few interior roof cells, standing on the roof
    if ((x * 7 + z * 11) % 13 === 0 && top + 1 < H) {
      g.set(x, top, z, "light_gray_concrete");
      g.set(x, top + 1, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/DC53972.nbt`);
