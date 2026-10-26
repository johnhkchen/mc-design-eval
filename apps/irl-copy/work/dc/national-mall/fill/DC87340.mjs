import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 800 Connecticut Ave NW: Commercial-Office-Large, c.1970s-80s speculative office block.
// Massing: lidar tops smoothed into 3-block storey tiers, stone foundation, light precast
// piers and spandrels, grey tinted glazing, a quartz cornice, a lobby with canopy on the street face.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87340";
const W = 17, H = 32, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cmap = new Map();
for (const [x, z, gnd, roof] of cells) {
  cmap.set(`${x},${z}`, { gnd: Math.max(0, Math.round(gnd)), roof: Math.round(roof), top: 0 });
}
const has = (x, z) => cmap.has(`${x},${z}`);
const get = (x, z) => cmap.get(`${x},${z}`);

// Quantise lidar roof heights to whole 3-block storeys, at least one storey above ground.
for (const [key, c] of cmap) {
  let t = Math.round(c.roof / 3) * 3;
  t = Math.max(t, c.gnd + 3);
  c.top = Math.min(t, 30);
}

// Smooth tops: median of each cell and its 8 neighbours, applied twice, so lidar noise
// becomes clean flat tiers instead of stubs and spikes.
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, c] of cmap) {
    const [x, z] = key.split(",").map(Number);
    const vals = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (has(x + dx, z + dz)) vals.push(get(x + dx, z + dz).top);
    }
    vals.sort((a, b) => a - b);
    const med = vals[Math.floor(vals.length / 2)];
    next.set(key, Math.max(med, c.gnd + 3));
  }
  for (const [key, t] of next) cmap.get(key).top = t;
}

const topOf = (x, z) => get(x, z).top;

// Outward face of a perimeter cell (null if interior).
const faceOf = (x, z) => {
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
};
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Lobby door: centre of the street (z = 0) face.
const frontXs = [];
for (const [key] of cmap) {
  const [x, z] = key.split(",").map(Number);
  if (z === 0) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const doors = [];
const cellKeys = [...cmap.keys()].map((k) => k.split(",").map(Number));

for (const [x, z] of cellKeys) {
  const c = get(x, z);
  const top = c.top;

  // Stone foundation from y0 up to this cell's ground.
  for (let y = 0; y < c.gnd; y++) put(x, y, z, "stone_bricks");

  const face = faceOf(x, z);

  if (!face) {
    // Interior: floor slabs per storey and a roof deck; air between.
    for (let y = c.gnd; y < top; y++) {
      if (y === c.gnd || y % 3 === 0 || y === top - 1) {
        put(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // Perimeter wall.
  const along = face === "N" || face === "S" ? x : z;
  const isPier = along % 3 === 0;
  const [ix, iz] = inward[face];

  for (let y = c.gnd; y < top; y++) {
    const rel = y % 3;
    let b;
    if (y === top - 1) {
      b = "smooth_quartz"; // cornice
    } else if (y === c.gnd) {
      b = "polished_granite"; // base course
    } else if (y < c.gnd + 3) {
      b = isPier ? "light_gray_concrete" : "glass"; // lobby glazing with piers
    } else if (rel === 1) {
      b = isPier ? "light_gray_concrete" : "gray_stained_glass";
    } else {
      b = isPier ? "light_gray_concrete" : "white_concrete"; // spandrel / head band
    }
    put(x, y, z, b);

    // Warm light just behind some window panes.
    if (
      !isPier && rel === 1 && y >= c.gnd + 3 && y < top - 1 &&
      (along + y) % 5 === 2 &&
      has(x + ix, z + iz) && !faceOf(x + ix, z + iz)
    ) {
      put(x + ix, y, z + iz, "glowstone");
    }
  }

  // Lobby entrance on the street face: doors, lantern, and a quartz canopy.
  if (face === "N" && z === 0 && x === doorX && top > c.gnd + 3) {
    doors.push([x, c.gnd, z]);
    put(x, c.gnd + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
    put(x, c.gnd + 3, z, "smooth_quartz");
  }
}

// Canopy flanking the door cell, sitting on the wall beneath it.
if (doorX >= 0 && has(doorX, 0)) {
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, 0) && faceOf(doorX + dx, 0) === "N") {
      const c = get(doorX + dx, 0);
      if (c.top > c.gnd + 3) put(doorX + dx, c.gnd + 3, 0, "smooth_quartz");
    }
  }
}

// Doors placed after the wall pass so they overwrite the lobby glazing.
for (const [x, gy, z] of doors) {
  put(x, gy, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(x, gy + 1, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Roof equipment: low plant boxes only where the roof is flat across the neighbourhood,
// so each sits on a solid roof deck.
for (const [x, z] of cellKeys) {
  if (faceOf(x, z)) continue;
  if (x % 5 !== 2 || z % 4 !== 1) continue;
  const top = topOf(x, z);
  if (top + 2 > 31) continue;
  let flat = true;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!has(x + dx, z + dz) || topOf(x + dx, z + dz) !== top) flat = false;
  }
  if (!flat) continue;
  put(x, top, z, "light_gray_concrete");
  put(x, top + 1, z, "smooth_quartz");
}

g.save(`${DIR}/${ID}.nbt`);
