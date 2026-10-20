import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989982";
const W = 21, H = 38, D = 17;
const ROOF = 26;          // parapet top, about 26 blocks above lowest ground
const FLOOR_H = 5;        // storey height in blocks

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;

// Parse cells: accepts [x, z, ground] arrays or {x, z, ground} objects.
const list = raw.map((c) => {
  const [x, z, g] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? c.y ?? 0];
  return { x: Math.round(x), z: Math.round(z), g: Math.round(g) };
});
const minG = Math.min(...list.map((c) => c.g));
const cells = new Map();
for (const c of list) cells.set(key(c.x, c.z), c.g - minG);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const has = (x, z) => cells.has(key(x, z));
const missing = (x, z) => {
  const m = [];
  if (!has(x, z - 1)) m.push("N");
  if (!has(x, z + 1)) m.push("S");
  if (!has(x - 1, z)) m.push("W");
  if (!has(x + 1, z)) m.push("E");
  return m;
};
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };

// Front (street) face: the north edge (lowest z). Door sits on its middle.
const frontCells = list.filter((c) => !has(c.x, c.z - 1));
const midX = frontCells.length
  ? Math.round(frontCells.reduce((s, c) => s + c.x, 0) / frontCells.length)
  : Math.floor(W / 2);

const paneProps = (faceZ) =>
  faceZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const lampProps = { hanging: "false", waterlogged: "false" };

// Main body: foundation, storeys, roof and parapet, per footprint cell.
for (const c of list) {
  const { x, z } = c;
  const gy = cells.get(key(x, z));
  const miss = missing(x, z);
  const edge = miss.length > 0;
  const faceZ = miss.includes("N") || miss.includes("S");
  const faceX = miss.includes("E") || miss.includes("W");
  const corner = faceZ && faceX;
  const idx = faceZ ? x : z;
  const pier = corner || idx % 3 === 0;
  const onFront = miss.includes("N");
  const isDoorX = onFront && x === midX;
  const isSurround = onFront && Math.abs(x - midX) === 1;

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  for (let y = gy; y <= 25; y++) {
    const k = Math.floor(y / FLOOR_H);
    const r = y % FLOOR_H;

    if (y === 25) {
      put(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }

    if (r === 0) {
      // Floor line / storey slab / cornice band.
      if (!edge) put(x, y, z, "smooth_stone");
      else if (k === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (!edge) continue; // interior air gap

    // Facade cells.
    if (k === 0 && onFront && isDoorX && (r === 1 || r === 2)) {
      put(x, y, z, "iron_door", {
        facing: "north",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (k === 0 && onFront && isSurround) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (pier && !(k === 0 && r !== 4 && !corner)) {
      put(x, y, z, "white_concrete");
      continue;
    }

    let glass = false;
    if (k === 0) {
      if (r === 4) put(x, y, z, "light_gray_concrete");          // shopfront canopy lintel
      else if (pier) put(x, y, z, "white_concrete");
      else { put(x, y, z, "glass_pane", paneProps(faceZ)); glass = true; }
    } else {
      if (r === 1) put(x, y, z, "light_gray_concrete");          // sill
      else if (r === 4) put(x, y, z, "white_concrete");          // header
      else { put(x, y, z, "glass_pane", paneProps(faceZ)); glass = true; }
    }

    // Warm light just inside some windows, standing on the floor slab.
    if (glass && (r === 2 || r === 3) && (x * 5 + z * 7 + k) % 4 === 0) {
      const dir = miss.find((d) => has(x + INWARD[OPP[d]][0], z + INWARD[OPP[d]][1]) || true);
      const [dx, dz] = INWARD[OPP[dir]];
      const ix = x + dx, iz = z + dz;
      const iy = k * FLOOR_H + 1;
      if (has(ix, iz) && iy >= cells.get(key(ix, iz))) {
        put(ix, iy, iz, "lantern", lampProps);
      }
    }
  }
}

// Setback penthouse on the roof, standing on the roof slab at y 25.
for (let x = 6; x <= 14; x++) {
  for (let z = 5; z <= 11; z++) {
    if (!has(x, z)) continue;
    const border = x === 6 || x === 14 || z === 5 || z === 11;
    const corner = (x === 6 || x === 14) && (z === 5 || z === 11);
    const alongZ = z === 5 || z === 11;
    const idx = alongZ ? x : z;
    for (let y = ROOF; y <= 28; y++) {
      if (!border) continue;
      if (corner || idx % 3 === 0) put(x, y, z, "white_concrete");
      else if (y === ROOF) put(x, y, z, "light_gray_concrete");
      else if (y === 27 || y === 28) put(x, y, z, "glass_pane", paneProps(alongZ));
      else put(x, y, z, "white_concrete");
    }
    // Penthouse floor and roof slab (full cells, no hanging air).
    put(x, ROOF, z, border ? "light_gray_concrete" : "smooth_stone");
    put(x, 29, z, "smooth_stone");
    if (border) put(x, 30, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Rooftop plant: two AC units on the roof slab.
for (let x = 2; x <= 4; x++) {
  for (let z = 12; z <= 13; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "light_gray_concrete");
  }
}
for (let x = 16; x <= 17; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
