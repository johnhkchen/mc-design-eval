import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001349";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 6, H = 25, D = 10;
const g = new Voxels([W, H, D]);

// ---- helpers ---------------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const cellMap = new Map();
for (const [x, z, gr, ro] of cells) {
  cellMap.set(key(x, z), {
    x, z,
    ground: clamp(Math.round(Number(gr)), 0, 12),
    roof: Math.round(Number(ro)),
  });
}
const has = (x, z) => cellMap.has(key(x, z));
const faces = (x, z) => {
  const f = {};
  if (!has(x, z - 1)) f.north = true;
  if (!has(x, z + 1)) f.south = true;
  if (!has(x - 1, z)) f.west = true;
  if (!has(x + 1, z)) f.east = true;
  return f;
};
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- common datums: street floor G and one cornice line for the whole block --
const cellList = [...cellMap.values()];
const G = Math.min(...cellList.map(c => c.ground));
const roofs = cellList.map(c => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
// storeys above the shopfront band (each 2 blocks), clamped to fit the build height
let n = clamp(Math.round((medRoof - G - 5) / 2), 2, 5);
while (G + 3 + 2 * n + 2 > 24 && n > 2) n--;
const Yc = G + 3 + 2 * n + 2;   // parapet row (top of building)
const corbelY = Yc - 2;
const cornY = Yc - 1;
const upperTop = Yc - 3;        // last storey row (window row of top storey)

// ---- choose one street entrance on the lowest-ground frontage ---------------
const doorCands = [];
for (const c of cellList) {
  if (c.ground > G + 1) continue;
  const fk = Object.keys(faces(c.x, c.z));
  if (fk.length !== 1) continue;           // avoid corners
  const face = fk[0];
  const idx = (face === "north" || face === "south") ? c.x : c.z;
  if (idx % 2 === 1) doorCands.push({ x: c.x, z: c.z, face, idx });
}
let door = null;
for (const face of ["west", "east", "south", "north"]) {
  const list = doorCands.filter(d => d.face === face).sort((a, b) => a.idx - b.idx);
  if (list.length) { door = list[Math.floor(list.length / 2)]; break; }
}
const outward = { north: "north", south: "south", east: "east", west: "west" };
const inwardOffset = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// ---- build each footprint column --------------------------------------------
for (const c of cellList) {
  const { x, z } = c;
  const gr = c.ground;
  const f = faces(x, z);
  const fk = Object.keys(f);
  const facade = fk.length > 0;
  const corner = fk.length >= 2;
  const idxAlong = (f.north || f.south) ? x : z;
  const window = facade && !corner && idxAlong % 2 === 1;
  const isDoor = door && door.x === x && door.z === z;

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= Yc; y++) {
    // parapet
    if (y === Yc) {
      if (facade) put(x, y, z, "stone_brick_wall");
      continue;
    }
    // corbel course with ceiling slab inside
    if (y === corbelY) {
      if (facade) put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else put(x, y, z, "smooth_stone");
      continue;
    }
    // cornice with roof deck inside
    if (y === cornY) {
      put(x, y, z, facade ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // street floor
    if (y === G) {
      put(x, y, z, facade ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // shopfront: glass bays, dark oak mullions, door
    if (y === G + 1 || y === G + 2) {
      if (!facade) continue;
      if (isDoor) {
        put(x, y, z, "dark_oak_door", {
          facing: outward[door.face],
          half: y === G + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (window) {
        put(x, y, z, "glass");
      } else {
        put(x, y, z, "dark_oak_planks");
      }
      continue;
    }
    // first-floor band / floor slab
    if (y === G + 3) {
      put(x, y, z, facade ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // upper storeys: sill/spandrel row + window row
    if (y <= upperTop) {
      const rel = y - (G + 3);
      const sub = rel % 2;
      const k = Math.floor(rel / 2);
      if (sub === 1) {
        // window row (rel 1,3,...)
        if (facade) {
          put(x, y, z, window ? "glass_pane" : "bricks");
        } else {
          const lit = ((x + z + k) % 3 === 0);
          if (lit) put(x, y, z, "glowstone");
        }
      } else {
        // base row (rel 2,4,...) = floor slab / sill
        if (facade) put(x, y, z, window ? "stone_bricks" : "bricks");
        else put(x, y, z, "smooth_stone");
      }
      continue;
    }
  }
}

// ---- entrance: hanging lantern in the room behind the door -------------------
if (door) {
  const [dx, dz] = inwardOffset[door.face];
  const ix = door.x + dx, iz = door.z + dz;
  if (has(ix, iz)) {
    put(ix, G + 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
