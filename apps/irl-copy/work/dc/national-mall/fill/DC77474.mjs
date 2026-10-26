// DC77474: a commercial Beaux-Arts block on the Mall's edge, five storeys at the tall end (roof 10) and three at the
// low end (roof 8). Calcite (limestone-like) facade on a stone-brick plinth, string courses between floors, glass-pane
// windows in pillared bays, a cornice and a low parapet on top; solid core, one air pocket behind each window (the
// glass has air behind it), a few glowstone pockets for warm light, and two doorways on the west and south faces.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77474.cells.json", "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inside = (x, z) => cell.has(key(x, z));

// roof: the lidar's tiers, each cell taken as the median of its 3x3 neighbourhood (so the noise goes), then 8, 9 or 10
for (const c of cell.values()) {
  const rs = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cell.get(key(c.x + dx, c.z + dz)); if (n) rs.push(n.r); }
  rs.sort((a, b) => a - b); c.top = rs[rs.length >> 1];
}

// faces: an outward side is a neighbour missing from the footprint; ring cells carry the facade
const normals = { west: [-1, 0], east: [1, 0], north: [0, -1], south: [0, 1] };
for (const c of cell.values()) {
  c.faces = Object.keys(normals).filter((f) => !inside(c.x + normals[f][0], c.z + normals[f][1]));
  c.ring = c.faces.length > 0;
}

// bays: pillars at every third cell along a face (0,3,6,9,12), glass in between; corners are pillars
const along = (c, f) => (f === "west" || f === "east" ? c.z : c.x);
const WINDOW_ROWS = [1, 2, 4, 5, 7, 8];
const COURSE_ROWS = [3, 6, 9];
const doorway = (c) => c.faces.length === 1 && (c.faces[0] === "south" || c.faces[0] === "west") && along(c, c.faces[0]) === 6 && c.g <= 1;
const doors = [...cell.values()].filter(doorway);

// which windows show a warm light behind the glass: a sparse, even scatter
const glow = (c, y) => ((along(c, c.faces[0]) * 3 + y + c.x + c.z) % 11 === 0);

// Cells whose inner neighbour is air behind a window (a doorway's air too): the air pocket is the cell just inside
const pockets = new Set();
const windowFor = new Map();   // "x,z" -> the facade face, for ring cells that get glass
for (const c of cell.values()) {
  if (!c.ring) continue;
  const f = c.faces[0];
  const isPillar = c.faces.length > 1 || along(c, f) % 3 === 0;
  if (isPillar) continue;
  windowFor.set(key(c.x, c.z), f);
  const [nx, nz] = normals[f];
  if (inside(c.x - nx, c.z - nz) && !cell.get(key(c.x - nx, c.z - nz)).ring) pockets.add(key(c.x - nx, c.z - nz));
}
for (const d of doors) { const [nx, nz] = normals[d.faces[0]]; pockets.add(key(d.x - nx, d.z - nz)); }

const g = new Voxels([13, 22, 13]);
const doorKeys = new Set(doors.map((d) => key(d.x, d.z)));

for (const c of cell.values()) {
  const { x, z, top } = c;
  // the plinth/foundation: stone from y 0 up under every cell
  g.set(x, 0, z, "stone_bricks");
  if (c.ring) {
    const f = c.faces[0];
    const corner = c.faces.length > 1;
    const pillar = !doorKeys.has(key(x, z)) && (corner || along(c, f) % 3 === 0);
    for (let y = 1; y < top; y++) {
      if (y === top - 1) { g.set(x, y, z, "smooth_quartz_slab", { type: "top" }); continue; }   // cornice
      if (y === top - 2 && WINDOW_ROWS.includes(y)) { g.set(x, y, z, "calcite"); continue; }   // a single top row reads as a course
      if (COURSE_ROWS.includes(y) || !WINDOW_ROWS.includes(y) || pillar) { g.set(x, y, z, "calcite"); continue; }
      // the bay's window: a door on the ground floor at the two doorways, else glass panes with frames
      if (y <= 2 && doorKeys.has(key(x, z))) {
        const door = { facing: f === "west" ? "west" : "south", hinge: "left", open: "false", powered: "false", half: y === 1 ? "lower" : "upper" };
        g.set(x, y, z, "dark_oak_door", door);
        continue;
      }
      const alongX = f === "north" || f === "south";
      g.set(x, y, z, "glass_pane", alongX
        ? { north: "false", south: "false", east: "true", west: "true" }
        : { north: "true", south: "true", east: "false", west: "false" });
    }
    g.set(x, top, z, "calcite");   // parapet: a solid rim, not battlements
    // the air pocket behind each window: the glass has air behind it, a glowstone in some of them
    for (let y = 1; y < top - 1; y++) if (WINDOW_ROWS.includes(y) && windowFor.has(key(x, z)) && glow(c, y)) {
      const [nx, nz] = normals[c.faces[0]];
      if (inside(x - nx, z - nz) && !cell.get(key(x - nx, z - nz)).ring) g.set(x - nx, y, z - nz, "glowstone");
    }
  } else {
    for (let y = 1; y < top; y++) {
      if (pockets.has(key(x, z)) && (WINDOW_ROWS.includes(y) || y <= 2)) continue;   // air behind glass / inside the door
      g.set(x, y, z, y === top - 1 ? "smooth_stone" : "stone_bricks");
    }
  }
}

// doorway pockets: the door's inner cells stay air, the hall's lamp sits in the top of the pocket
for (const d of doors) {
  const [nx, nz] = normals[d.faces[0]];
  const px = d.x - nx, pz = d.z - nz;
  if (inside(px, pz)) g.set(px, 2, pz, "glowstone");   // over the entry: a warm light at the door's head height
}

// roof plant: two stone-brick boxes on the flat roofs of the interior, standing on the roof
for (const [x0, z0] of [[3, 3], [8, 8]]) for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
  const c = cell.get(key(x0 + dx, z0 + dz)); if (c && !c.ring) g.set(c.x, c.top, c.z, "stone_bricks");
}

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77474.nbt");
console.log(info);
