import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey concrete shophouse with a ground-floor shopfront,
// tiled cornice and a small plant room. Footprint 15 x 17, roof near y 11.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542407478";
const W = 15, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint: key "x,z" -> ground height (clamped so the storeys keep their lines)
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr)), 9));
}
const has = (x, z) => ground.has(`${x},${z}`);
const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// perimeter test: any 4-neighbour outside the footprint
const isPerim = (x, z) => Object.values(DIRS).some(([dx, dz]) => !has(x + dx, z + dz));

// collect exterior faces: name -> [[x, z], ...]
const faces = { north: [], south: [], west: [], east: [] };
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) faces[name].push([x, z]);
  }
}

// planned voxels, later writes override earlier ones
const out = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  out.set(`${x},${y},${z}`, { x, y, z, id, props });
};

// 1. foundation, floor slabs and roof deck (solid under each cell)
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  if (5 >= gr) put(x, 5, z, "smooth_quartz");   // first floor slab
  if (10 >= gr) put(x, 10, z, "smooth_stone");  // roof deck
}

// 2. facades on every exterior face
const pick = (name) => {
  // facing for doors and panes
  return name;
};

for (const [name, list] of Object.entries(faces)) {
  if (!list.length) continue;
  const alongNS = name === "north" || name === "south";
  const us = list.map(([x, z]) => (alongNS ? x : z));
  const umin = Math.min(...us);
  const umax = Math.max(...us);
  const len = umax - umin + 1;
  const mid = umin + Math.floor(len / 2);
  const [dx, dz] = DIRS[name];

  for (const [x, z] of list) {
    const u = alongNS ? x : z;
    const gr = ground.get(`${x},${z}`);
    const paneProps = alongNS
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr; y <= 11; y++) {
      const pillar = (u - umin) % 3 === 0;

      if (y === gr && y <= 4) {
        put(x, y, z, "stone_bricks");                       // base course
      } else if (y === gr + 1 && gr <= 1 && len >= 5 && u === mid) {
        put(x, y, z, "oak_door", { facing: pick(name), half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (y === gr + 2 && gr <= 1 && len >= 5 && u === mid) {
        put(x, y, z, "oak_door", { facing: pick(name), half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (y >= 1 && y <= 3) {
        put(x, y, z, pillar ? "white_concrete" : "glass");  // shopfront
      } else if (y === 4) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // fascia
      } else if (y === 5) {
        put(x, y, z, "smooth_quartz");                      // storey line
      } else if (y >= 6 && y <= 9) {
        if (y === 6 || y === 9 || pillar) {
          put(x, y, z, "white_concrete");                   // frames and mullions
        } else {
          put(x, y, z, "glass_pane", paneProps);            // upper windows
        }
      } else if (y === 10) {
        put(x, y, z, "red_terracotta");                     // tiled cornice
      } else if (y === 11) {
        put(x, y, z, "white_concrete");                     // parapet
      }
    }
  }
}

// 3. warm lights just behind some upper windows (inside, air gap kept elsewhere)
for (const [name, list] of Object.entries(faces)) {
  const [dx, dz] = DIRS[name];
  const alongNS = name === "north" || name === "south";
  for (const [x, z] of list) {
    const u = alongNS ? x : z;
    const gr = ground.get(`${x},${z}`);
    if (7 < gr) continue;
    if (((u + 2 * (name.length)) % 4) !== 0) continue;   // some windows lit
    if ((u - Math.min(...list.map(([a, b]) => (alongNS ? a : b)))) % 3 === 0) continue; // not in a pillar
    const ix = x - dx, iz = z - dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      put(ix, 7, iz, "glowstone");
    }
  }
}

// 4. rooftop plant room on the interior, standing on the roof deck
const xs = cells.map(([x]) => x), zs = cells.map(([, z]) => z);
const cx = Math.floor((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.floor((Math.min(...zs) + Math.max(...zs)) / 2);
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (Math.abs(x - cx) <= 2 && Math.abs(z - cz) <= 2) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

// write everything
for (const v of out.values()) {
  g.set(v.x, v.y, v.z, v.id, v.props);
}

g.save(`${DIR}/${ID}.nbt`);
