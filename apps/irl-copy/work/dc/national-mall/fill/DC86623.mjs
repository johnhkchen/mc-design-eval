import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1012 14th St NW, Washington DC 20005. Commercial-Office-Large, 18 x 6 footprint.
// Read as a c.1968 to 1975 speculative office block: five storeys of precast
// concrete piers with bronze-tinted glass, a granite plinth, a smooth stone
// shopfront band at street level, a quartz cornice and a central mechanical penthouse.
// All storey lines use one shared datum (absolute y), so the sloping side
// stays in step with the rest of the facade.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86623";
const W = 18, H = 31, D = 6;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);
const norm = (c) => Array.isArray(c)
  ? { x: c[0], z: c[1], gr: c[2], rf: c[3] }
  : { x: c.x, z: c.z, gr: c.ground, rf: c.roof };
const cellsIn = list.map(norm);

const minG = Math.min(...cellsIn.map((c) => c.gr));
const roofs = cellsIn.map((c) => c.rf - minG).sort((a, b) => a - b);
const maxGnd = Math.max(...cellsIn.map((c) => Math.round(c.gr - minG)));

// One clean roof tier for the whole block (median of lidar), clamped to the volume.
let R = Math.round(roofs[Math.floor(roofs.length / 2)]);
R = Math.max(R, maxGnd + 8);
R = Math.min(R, H - 4);

const cellMap = new Map();
for (const c of cellsIn) {
  const gnd = Math.min(Math.max(Math.round(c.gr - minG), 0), R - 8);
  cellMap.set(`${c.x},${c.z}`, { gnd });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance on the north (z = 0) face, centred on the 18-block frontage.
const DOOR_X = 8;

for (const [key, { gnd }] of cellMap) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid granite from y 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) put(x, y, z, "granite");

  // Exterior test and face orientation.
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const west = !has(x - 1, z);
  const east = !has(x + 1, z);
  const exterior = front || back || west || east;
  const zFace = front || back;
  const dirOut = front ? "north" : back ? "south" : west ? "west" : "east";
  const u = zFace ? x : z;
  const umax = zFace ? W - 1 : D - 1;
  const pier = u === 0 || u === umax || u % 3 === 0;
  const paneProps = zFace
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Wall, storey lines and windows on the shared absolute datum, up to R-2.
  for (let y = gnd; y <= R - 2; y++) {
    const s = Math.floor(y / 4);
    const k = y % 4;
    const ground = s === 0;

    if (!exterior) {
      // Interior: floor slabs only (air gap behind the glass), plus warm lights set back from the glass.
      if (k === 0) put(x, y, z, "light_gray_concrete");
      if (z === 2 && k === 1 && x % 6 === 4) {
        put(x, y, z, ground ? "glowstone" : "shroomlight");
      }
      continue;
    }

    if (ground) {
      // Ground storey: granite plinth, glass shopfront, stone header, door surround.
      if (k === 0) { put(x, y, z, "polished_granite"); continue; }
      if (k === 3) { put(x, y, z, "smooth_stone"); continue; }
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      if (zFace && front && u === DOOR_X) {
        put(x, y, z, "dark_oak_door", {
          facing: dirOut,
          half: k === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (zFace && front && (u === DOOR_X - 1 || u === DOOR_X + 1)) {
        put(x, y, z, "polished_granite");
        continue;
      }
      put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    } else {
      // Upper storeys: floor line, glass panes in white piers, spandrel band.
      if (k === 0) put(x, y, z, "white_concrete");
      else if (k === 3) put(x, y, z, "light_gray_concrete");
      else if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }

  // Top course: cornice on the perimeter, roof membrane inside.
  if (R - 1 >= gnd) {
    put(x, R - 1, z, exterior ? "smooth_quartz" : "light_gray_concrete");
  }
}

// Lantern over the entrance, hung from the stone header.
if (has(DOOR_X, 0)) {
  put(DOOR_X, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Central mechanical penthouse on the roof deck, set back from the faces.
for (let x = 6; x <= 11; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    put(x, R, z, "light_gray_concrete");
    put(x, R + 1, z, "light_gray_concrete");
    put(x, R + 2, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
