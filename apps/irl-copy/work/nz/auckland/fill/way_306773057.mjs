// A 1930s brick-and-plaster commercial block (Auckland's stripped-classical office and shop buildings of the
// inter-war years): a red-brick wall between cream plaster string courses and piers, glazed storeys, a shopfront
// band at the street, and a five-storey core stepped back to a four-storey ring. Lidar roof heights are smoothed
// to 4-block storeys; the wall stands on a solid foundation down to y 0, so the downhill side shows its extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_306773057.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, g: ground, roof });
const inFp = (x, z) => cell.has(key(x, z));
const at = (x, z) => cell.get(key(x, z));

// Distance in cells from the outside of the footprint (1 = outer skin), by breadth-first search.
const dist = new Map();
let frontier = [];
for (const c of cell.values()) {
  if (!inFp(c.x - 1, c.z) || !inFp(c.x + 1, c.z) || !inFp(c.x, c.z - 1) || !inFp(c.x, c.z + 1)) {
    dist.set(key(c.x, c.z), 1); frontier.push(c);
  }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(c.x + dx, c.z + dz);
    if (cell.has(k) && !dist.has(k)) { dist.set(k, d + 1); next.push(cell.get(k)); }
  }
  frontier = next;
}

// Massing: the lidar roof rounded to 4-block storey tiers; the core (3+ cells in from the skin) rises one more
// storey than the ring around it, so the top floor is set back. Never less than four blocks above its ground.
for (const c of cell.values()) {
  c.d = dist.get(key(c.x, c.z));
  let R = Math.round(c.roof / 4) * 4;
  if (R === 20 && c.d < 4) R = 16;
  c.R = Math.max(R, c.g + 4);
}

// The street entrance: the outer cell with the lowest ground.
const outer = [...cell.values()].filter((c) => c.d === 1);
const door = outer.reduce((a, b) => (b.g < a.g || (b.g === a.g && b.z > a.z) ? b : a));

// Which way an outer cell faces (its first open side), and whether its facade runs along x or z.
function facing(c) {
  if (!inFp(c.x, c.z - 1)) return "north";
  if (!inFp(c.x, c.z + 1)) return "south";
  if (!inFp(c.x - 1, c.z)) return "west";
  return "east";
}
const alongX = (c) => facing(c) === "north" || facing(c) === "south";

// What an outer-skin cell is at height y: the storey grid is absolute (strings at multiples of 4), the base course
// sits on the cell's own ground, and the shopfront band runs from the ground to the first storey line.
function skinKind(c, y) {
  const { x, z, g, R } = c;
  if (y === R - 1) return "parapet";
  if (y === g) return "base";
  if (c === door && (y === g + 1 || y === g + 2)) return "door";
  if (c === door && y === g + 3) return "lintel";
  if (y > g && y % 4 === 0) return "string";
  const along = alongX(c) ? x : z;
  if (along % 3 === 0) return "pier";
  return y < (Math.floor(g / 4) + 1) * 4 ? "shop" : "window";
}

const hash = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const glowAt = (x, y, z) => hash(x, y, z) % 6 === 0;

const g = new Voxels([30, 33, 36]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Exposed foundation (the downhill side, and any wall below the ground): a rusticated base with a course every four
// blocks and small basement lights between the piers, each with an air gap behind it.
const basementLight = (c, y) => c.d === 1 && y < c.g && y % 4 !== 0 && y % 4 !== 3 && (alongX(c) ? c.x : c.z) % 3 !== 0;

for (const c of cell.values()) {
  for (let y = 0; y < c.R; y++) {
    if (y < c.g) {                                                              // foundation down to y 0
      if (c.d === 1) {
        if (y % 4 === 0) put(c.x, y, c.z, "polished_andesite");
        else if (basementLight(c, y)) put(c.x, y, c.z, "glass_pane", alongX(c)
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        else put(c.x, y, c.z, "stone_bricks");
      } else if (!([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
        const n = at(c.x + dx, c.z + dz); return n && basementLight(n, y);
      }))) put(c.x, y, c.z, "stone_bricks");
      continue;
    }
    if (c.d === 1) {
      const kind = skinKind(c, y);
      const ax = alongX(c);
      if (kind === "parapet") put(c.x, y, c.z, "smooth_quartz");
      else if (kind === "base") put(c.x, y, c.z, "polished_andesite");
      else if (kind === "string" || kind === "lintel") put(c.x, y, c.z, "smooth_quartz");
      else if (kind === "pier") put(c.x, y, c.z, "bricks");
      else if (kind === "shop") put(c.x, y, c.z, "glass");
      else if (kind === "window") put(c.x, y, c.z, "glass_pane", ax
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      else if (kind === "door") {
        const f = facing(c), half = y === c.g + 1 ? "lower" : "upper";
        put(c.x, y, c.z, "dark_oak_door", { facing: f, half, hinge: "left", open: "false", powered: "false" });
      }
      continue;
    }
    if (y === c.R - 1) { put(c.x, y, c.z, "smooth_stone"); continue; }             // roof deck, inside the skin
    // Second skin: a one-block air gap behind each glazed bay (a warm glowstone in some), brick elsewhere.
    const glazedNeighbour = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => at(c.x + dx, c.z + dz))
      .filter((n) => n && n.d === 1);
    const gap = c.d === 2 && y > c.g && glazedNeighbour.some((n) => {
      const k = skinKind(n, y);
      return k === "window" || k === "shop" || (k === "door" && n === door);
    });
    if (gap) {
      const lit = glazedNeighbour.some((n) => skinKind(n, y) === "window") && glowAt(c.x, y, c.z);
      if (lit) put(c.x, y, c.z, "glowstone");
      continue;
    }
    put(c.x, y, c.z, c.d === 2 ? "bricks" : "stone");
  }
}

// Rooftop plant on the core: 2x2 boxes at y R..R+1, spaced apart, each on solid roof.
const core = [...cell.values()].filter((c) => c.R === 20 && c.d >= 4);
const isCore = (x, z) => { const c = at(x, z); return c && c.R === 20 && c.d >= 4; };
const plant = [];
for (const c of core) {
  if (plant.length >= 4) break;
  if (![[1, 0], [0, 1], [1, 1]].every(([dx, dz]) => isCore(c.x + dx, c.z + dz))) continue;
  if (plant.some((p) => Math.abs(p.x - c.x) + Math.abs(p.z - c.z) < 9)) continue;
  plant.push(c);
}
for (const p of plant) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++)
  for (let y = 20; y < 22; y++) put(p.x + dx, y, p.z + dz, "light_gray_concrete");

g.save(`${HERE}/way_306773057.nbt`);
