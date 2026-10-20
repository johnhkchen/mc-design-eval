import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district office/retail block, c. 1990s: five storeys of white-tiled concrete
// with blue-glass ribbon windows, a stone plinth, a cornice-capped roof and a
// central penthouse. Lidar roof reference: about 26 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989985";
const W = 18, H = 38, D = 17;
const ROOF_REF = 26;
const STOREY = 5;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) foot.set(key(x, z), Math.round(gr));
const has = (x, z) => foot.has(key(x, z));
const list = cells.map(([x, z]) => [x, z]);

// Floor datum: the highest ground under the footprint, so every storey sits on
// solid fill and the downhill side carries the plinth.
const datum = Math.max(...cells.map((c) => Math.round(c[2])));

// Storeys sized so the parapet lands near the lidar roof height.
let floors = Math.min(5, Math.floor((ROOF_REF - datum - 1) / STOREY));
floors = Math.max(2, floors);
const topY = datum + floors * STOREY; // roof deck level

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const faces = (x, z) =>
  Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Door: north face, a non-mullion column nearest the middle.
const northCells = list.filter(([x, z]) => faces(x, z).includes("N"));
const mid = (W - 1) / 2;
let doorX = null;
for (const [x] of northCells.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid))) {
  if (x % 3 !== 0) { doorX = x; break; }
}
if (doorX === null && northCells.length) doorX = northCells[0][0];

// 1. Foundation fill from y 0 up to the datum under every footprint cell.
for (const [x, z] of list) {
  for (let y = 0; y < datum; y++) put(x, y, z, "stone_bricks");
}

// 2. Ground-floor slab, and a polished base course on the edge cells.
for (const [x, z] of list) {
  put(x, datum, z, "smooth_stone");
  if (faces(x, z).length) put(x, datum, z, "polished_andesite");
}

// 3. Storey slabs and cornice bands between storeys.
for (let s = 1; s <= floors; s++) {
  const b = datum + s * STOREY;
  for (const [x, z] of list) {
    if (s === floors) continue; // roof handled below
    put(x, b, z, "smooth_stone");
    if (faces(x, z).length) put(x, b, z, "smooth_quartz");
  }
}

// 4. Walls, windows, entrance and warm glow for each storey.
for (let s = 0; s < floors; s++) {
  const b = datum + s * STOREY;
  for (const [x, z] of list) {
    const f = faces(x, z);
    if (!f.length) continue;

    // Corner columns: solid pier through every storey.
    if (f.length >= 2) {
      for (let yy = 1; yy <= 4; yy++) put(x, b + yy, z, "white_concrete");
      continue;
    }

    const face = f[0];
    const idx = face === "N" || face === "S" ? x : z;
    const mull = idx % 3 === 0;
    const isDoor = s === 0 && face === "N" && x === doorX;

    for (let yy = 1; yy <= 4; yy++) {
      const y = b + yy;
      if (yy === 4) {
        put(x, y, z, s === 0 ? "smooth_quartz" : "gray_concrete");
      } else if (isDoor && yy <= 2) {
        // door is placed below
      } else if (mull) {
        put(x, y, z, "white_concrete");
      } else if (s === 0) {
        put(x, y, z, yy === 3 ? "smooth_stone" : "glass");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    }

    if (isDoor) {
      put(x, b + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, b + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, b + 3, z, "smooth_stone");
    }

    // Warm light behind some upper-floor windows, inside the room.
    if (s >= 1 && !mull && idx % 6 === 4) {
      const [dx, dz] = DIRS[face];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && faces(ix, iz).length === 0) {
        put(ix, b + 2, iz, "glowstone");
      }
    }
  }
}

// 5. Roof deck, cornice and parapet.
for (const [x, z] of list) {
  put(x, topY, z, "gray_concrete");
  if (faces(x, z).length) {
    put(x, topY, z, "smooth_quartz");
    put(x, topY + 1, z, "smooth_quartz");
  }
}

// 6. Central penthouse, only if its whole footprint is on the building.
const px0 = 5, px1 = 12, pz0 = 5, pz1 = 11;
let penthouseOk = true;
for (let x = px0; x <= px1 && penthouseOk; x++)
  for (let z = pz0; z <= pz1; z++)
    if (!has(x, z)) { penthouseOk = false; break; }

if (penthouseOk) {
  for (let x = px0; x <= px1; x++) {
    for (let z = pz0; z <= pz1; z++) {
      const ring = x === px0 || x === px1 || z === pz0 || z === pz1;
      const corner = (x === px0 || x === px1) && (z === pz0 || z === pz1);
      if (ring) {
        put(x, topY + 1, z, "white_concrete");
        put(x, topY + 2, z, corner ? "white_concrete" : "light_blue_stained_glass_pane");
      } else {
        // interior air: the penthouse keeps an open room under its cap
      }
      put(x, topY + 3, z, "smooth_stone");
    }
  }
  // Warm lanterns on the penthouse corners.
  for (const x of [px0, px1]) {
    for (const z of [pz0, pz1]) {
      put(x, topY + 4, z, "lantern", { hanging: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
