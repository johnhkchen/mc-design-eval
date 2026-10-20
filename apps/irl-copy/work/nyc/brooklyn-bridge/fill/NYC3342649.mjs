import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 64 John Street, DUMBO. 1900 Industrial & Manufacturing: a 4-storey red brick
// loft warehouse on a stone base, with a cornice, parapet, window bays with
// stone piers, a wooden shopfront on the street (north, -z) side, a gravel roof
// and one stair bulkhead.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3342649";
const W = 28, H = 20, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr, roof]) => ({
  x: Math.round(x), z: Math.round(z),
  ground: Math.round(gr), roof: Math.round(roof),
}));

const cellAt = new Map(cells.map((c) => [`${c.x},${c.z}`, c]));
const has = (x, z) => cellAt.has(`${x},${z}`);
const G0 = Math.min(...cells.map((c) => c.ground));

// Smooth lidar roof noise into one flat roof tier.
const med = cells.map((c) => c.roof).sort((a, b) => a - b)[Math.floor(cells.length / 2)];
for (const c of cells) {
  let t = c.roof;
  if (Math.abs(t - med) <= 1) t = med;
  c.top = Math.min(H - 3, Math.max(c.ground + 4, t));
}

const DIRS = [
  { name: "n", dx: 0, dz: -1, inx: 0, inz: 1 },
  { name: "s", dx: 0, dz: 1, inx: 0, inz: -1 },
  { name: "w", dx: -1, dz: 0, inx: 1, inz: 0 },
  { name: "e", dx: 1, dz: 0, inx: -1, inz: 0 },
];
const faces = (c) => DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));

// Main entrance on the street (north) face, nearest the middle of the front.
let door = null;
for (const c of cells) {
  if (!faces(c).some((d) => d.name === "n")) continue;
  if (!door || Math.abs(c.x - 14) < Math.abs(door.x - 14)) door = c;
}

const vox = new Map();
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  vox.set(`${x},${y},${z}`, { x, y, z, id, p });
};

const windows = [];

// Pass 1: massing, facades, roofs.
for (const c of cells) {
  const f = faces(c);
  const ext = f.length > 0;

  for (let y = 0; y < c.ground; y++) put(c.x, y, c.z, "stone");

  for (let y = c.ground; y < c.top; y++) {
    if (!ext) {
      // Interior: brick body; the roof surface is gravel-grey stone.
      put(c.x, y, c.z, y === c.top - 1 ? "stone" : "bricks");
      continue;
    }
    const d = f[0];
    const u = d.dz !== 0 ? c.x : c.z;
    const rel = y - G0;

    if (door && c === door && (y === c.ground || y === c.ground + 1)) {
      put(c.x, y, c.z, "dark_oak_door", {
        facing: "north",
        half: y === c.ground ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    let id;
    if (y === c.top - 1) id = "smooth_stone";                  // cornice course
    else if (rel === 0) id = "stone_bricks";                    // base course
    else if (rel % 2 === 0) id = "smooth_stone";                // storey string courses
    else if (rel === 1) id = u % 4 === 0 ? "dark_oak_planks" : "glass_pane"; // shopfront
    else if (u % 4 === 0) id = "stone_bricks";                  // stone piers
    else id = u % 4 === 2 ? "glass_pane" : "bricks";            // window bays

    put(c.x, y, c.z, id);
    if (id === "glass_pane") windows.push({ x: c.x, y, z: c.z, d, u, rel });
  }

  if (door && c === door) {
    put(c.x, c.ground + 2, c.z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Parapet on the exterior ring only.
  if (ext) put(c.x, c.top, c.z, "stone_brick_wall");
}

// One stair bulkhead on the roof, sitting on the interior roof surface.
const bulk = cells.filter((c) => faces(c).length === 0 && c.x >= 10 && c.x <= 14 && c.z >= 6 && c.z <= 10);
for (const c of bulk) {
  put(c.x, c.top, c.z, "bricks");
  put(c.x, c.top + 1, c.z, "smooth_stone");
}

// Pass 2: an air gap behind each glass pane, with warm lights in some of them.
for (const w of windows) {
  const nx = w.x + w.d.inx, nz = w.z + w.d.inz;
  if (!has(nx, nz)) continue;
  const nb = cellAt.get(`${nx},${nz}`);
  if (faces(nb).length > 0) continue;
  if (w.y >= nb.top - 1) continue;
  const lit = w.rel >= 1 && (w.u + w.rel) % 3 === 0;
  put(nx, w.y, nz, lit ? "glowstone" : "air");
}

const g = new Voxels([W, H, D]);
for (const v of vox.values()) {
  if (v.p) g.set(v.x, v.y, v.z, v.id, v.p);
  else g.set(v.x, v.y, v.z, v.id);
}
g.save(`${DIR}/${ID}.nbt`);
