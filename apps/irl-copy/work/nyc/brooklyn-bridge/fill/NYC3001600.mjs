import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001600.cells.json`, "utf8"));

const W = 9, H = 21, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, gr, rf] of cells) {
  C.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}

// One flat roof for the whole building (median lidar roof), smoothing noise into one tier.
const rfs = [...C.values()].map((v) => v.rf).sort((a, b) => a - b);
const B = Math.min(...[...C.values()].map((v) => v.gr)); // common base line
const T = Math.min(Math.max(rfs[Math.floor(rfs.length / 2)], B + 5), H - 5);
const hs = Math.max(1, Math.floor((T - 1 - B) / 4)); // storey height, four storeys

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

// Entrances on both short faces (z = min and z = max), centred on x = 4
const DOOR_X = 4;
const doorFace = (x, z, faces) => faces.includes("N") && z === 0 && x === DOOR_X
  ? "N" : (faces.includes("S") && x === DOOR_X ? "S" : null);

for (const [k0, v] of C) {
  const [x, z] = k0.split(",").map(Number);
  const gr = v.gr;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = [];
  if (!C.has(key(x - 1, z))) faces.push("W");
  if (!C.has(key(x + 1, z))) faces.push("E");
  if (!C.has(key(x, z - 1))) faces.push("N");
  if (!C.has(key(x, z + 1))) faces.push("S");
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0];
  const s = face === "W" || face === "E" ? z : x;
  const isBay = s % 3 === 1;
  const door = perim && !corner ? doorFace(x, z, faces) : null;
  const doorHere = door !== null || (perim && faces.includes("N") && z === 0 && x === DOOR_X)
    || (perim && faces.includes("S") && x === DOOR_X);
  const entranceCell = perim && x === DOOR_X && (faces.includes("N") || faces.includes("S"));

  for (let y = gr; y < T - 1; y++) {
    const rel = y - B;
    const k = Math.floor(rel / hs);
    const r = rel % hs;
    const floorLine = r === 0;

    if (!perim) {
      // interior: only floor slabs at storey lines; air otherwise
      if (floorLine) put(x, y, z, "smooth_stone");
      continue;
    }

    // Entrance: door on the short faces, two blocks high at ground
    if (entranceCell && k === 0 && (y === gr || y === gr + 1) && !corner) {
      const half = y === gr ? "lower" : "upper";
      const facing = faces.includes("N") ? "south" : "north";
      put(x, y, z, "oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // Calcite surround beside the door
    if (perim && k === 0 && y === gr + 1 && !corner &&
        ((faces.includes("N") && z === 0) || (faces.includes("S") && z === D - 1)) &&
        (x === DOOR_X - 1 || x === DOOR_X + 1)) {
      put(x, y, z, "calcite");
      continue;
    }

    if (floorLine) {
      put(x, y, z, k === 0 ? "polished_andesite" : "calcite");
      continue;
    }

    if (corner) {
      put(x, y, z, "calcite"); // stone quoins
      continue;
    }

    if (isBay) put(x, y, z, "glass");
    else put(x, y, z, "bricks");
  }

  // Cornice ring on the perimeter, roof slab inside, all at the same level T-1
  if (perim) put(x, T - 1, z, "polished_andesite");
  else put(x, T - 1, z, "stone");

  // Warm lights behind some windows
  if (perim && !corner && isBay) {
    for (let k = 1; k < 4; k++) {
      const s2 = face === "W" || face === "E" ? z : x;
      if (s2 % 6 !== 1) continue;
      const [dx, dz] = inward[face];
      const y = B + k * hs + 1;
      if (y > gr && y < T - 1 && C.has(key(x + dx, z + dz))) {
        put(x + dx, y, z + dz, "shroomlight");
      }
    }
  }
}

// Central rooftop mechanical penthouse, standing on the roof slab
for (let x = 3; x <= 5; x++) {
  for (let z = 7; z <= 11; z++) {
    if (!C.has(key(x, z))) continue;
    for (let y = T; y < T + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, T + 2, z, "smooth_stone");
  }
}

g.save(`${DIR}/NYC3001600.nbt`);
