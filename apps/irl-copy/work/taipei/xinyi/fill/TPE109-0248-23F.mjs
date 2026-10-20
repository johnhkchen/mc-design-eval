import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE109-0248-23F";

const W = 87, H = 23, D = 24;
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));

const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade classification: exposed cells, outward normal, corner flag, bay index.
const info = new Map();
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const exposed = n || s || w || e;
  let normal = null;
  if (n) normal = "north";
  else if (s) normal = "south";
  else if (w) normal = "west";
  else if (e) normal = "east";
  const corner = (n || s) && (w || e);
  const long = normal === "north" || normal === "south";
  const bay = long ? x : z;
  info.set(key(x, z), { exposed, normal, corner, long, bay });
}

// Depth from the outside edge (0 = facade, 1 = behind it, ...).
const depth = new Map();
const queue = [];
for (const [k, f] of info) {
  if (f.exposed) {
    depth.set(k, 0);
    queue.push(k);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number);
  const d = depth.get(queue[i]);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = key(x + dx, z + dz);
    if (has(x + dx, z + dz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push(nk);
    }
  }
}

const pending = []; // recessed glazing, applied after all floors and slabs

// Pass 1: foundation, floors, facades, roofs.
for (const [x, z, gr] of cells) {
  const gy = Math.max(0, Math.min(H - 1, Math.round(gr)));
  const f = info.get(key(x, z));

  // Foundation up to the cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  put(x, gy, z, f.exposed ? "stone_bricks" : "smooth_stone");

  if (f.exposed) {
    const b = f.bay;
    const pier = f.corner || b % 4 === 0;
    const mull = !f.corner && b % 4 === 2;
    const door = f.long && !f.corner && (b % 16 === 9 || b % 16 === 10);
    const [ox, oz] = OUT[f.normal];
    const ix = x - ox, iz = z - oz;
    const inwardOk = has(ix, iz) && !info.get(key(ix, iz)).exposed;
    const igy = inwardOk ? ground.get(key(ix, iz)) : 0;

    // Glazing is recessed one block behind the facade line when there is room.
    // Air stays in the facade cell, so each window gets a reveal.
    const glaze = (y, id) => {
      if (inwardOk && y - igy >= 1 && y - igy <= 9 && y - igy !== 5) {
        pending.push({ x: ix, y, z: iz, id });
      } else {
        put(x, y, z, id);
      }
    };

    // Ground storey: shopfronts, entrances, transom.
    for (let y = gy + 1; y <= gy + 4; y++) {
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === gy + 4) {
        put(x, y, z, "white_concrete");
      } else if (door && y <= gy + 2) {
        put(x, y, z, "oak_door", {
          facing: f.normal,
          half: y === gy + 1 ? "lower" : "upper",
          hinge: b % 16 === 9 ? "left" : "right",
          open: "false",
          powered: "false",
        });
      } else if (mull) {
        put(x, y, z, "gray_concrete");
      } else {
        glaze(y, "light_blue_stained_glass");
      }
    }

    // Storey line between floors.
    put(x, gy + 5, z, "smooth_quartz");

    // Upper storey: punched windows with spandrels and mullions.
    for (let y = gy + 6; y <= gy + 9; y++) {
      if (pier) {
        put(x, y, z, "smooth_quartz");
      } else if (y === gy + 6 || y === gy + 9) {
        put(x, y, z, "white_concrete");
      } else if (mull) {
        put(x, y, z, "gray_concrete");
      } else {
        glaze(y, "cyan_stained_glass");
      }
    }

    // Cornice and parapet.
    put(x, gy + 10, z, "smooth_quartz");
    put(x, gy + 11, z, "white_concrete");
  } else {
    // Interior floor slabs and roof surface.
    put(x, gy + 5, z, "smooth_stone");
    put(x, gy + 10, z, "light_gray_concrete");
  }
}

// Pass 1b: recessed glazing, skipping any cell that is a slab in the interior.
for (const p of pending) {
  const igy = ground.get(key(p.x, p.z));
  const rel = p.y - igy;
  if (rel === 0 || rel === 5 || rel === 10 || rel === 11) continue;
  put(p.x, p.y, p.z, p.id);
}

// Pass 2: warm light behind the recessed glass (two blocks in from the facade).
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const f = info.get(key(x, z));
  if (!f.exposed) continue;
  const gy = ground.get(key(x, z));
  const b = f.bay;
  const glassBay = !f.corner && (b % 4 === 1 || b % 4 === 3);
  if (!glassBay) continue;
  const [ox, oz] = OUT[f.normal];
  const lx = x - 2 * ox, lz = z - 2 * oz;
  if (!has(lx, lz)) continue;
  if ((depth.get(key(lx, lz)) ?? 0) < 2) continue;
  const lgy = ground.get(key(lx, lz));
  if (b % 8 === 3) put(lx, lgy + 2, lz, "glowstone");
  if (b % 8 === 5) put(lx, lgy + 7, lz, "glowstone");
}

// Pass 3: rooftop plant on the roof, set well inside the outline.
for (const [x, z] of ground.keys().map(k => k.split(",").map(Number))) {
  const k = key(x, z);
  const f = info.get(k);
  if (f.exposed) continue;
  if ((depth.get(k) ?? 0) < 3) continue;
  if ((x % 10 === 5 || x % 10 === 6) && (z % 8 === 4 || z % 8 === 5)) {
    const gy = ground.get(k);
    put(x, gy + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
