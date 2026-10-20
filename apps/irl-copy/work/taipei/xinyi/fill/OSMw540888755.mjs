import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540888755";
const W = 30, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const isPerim = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// materials: 1990s-2000s Taipei office/retail: white cladding, pale frames, tinted glass
const FRAME = "light_gray_concrete";
const WALL = "white_concrete";
const BASE = "smooth_stone";
const FOUND = "stone";
const PANE = "light_blue_stained_glass_pane";
const ENTRY = "glass";

// pane connection states: a run along x (north/south face) connects east/west, and vice versa
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const FACES = [
  { dx: 0, dz: -1, name: "N" },
  { dx: 0, dz: 1, name: "S" },
  { dx: -1, dz: 0, name: "W" },
  { dx: 1, dz: 0, name: "E" },
];

for (const [x, z, b] of cells) {
  // foundation up to the cell's ground, then base floor at ground
  for (let y = 0; y < b; y++) put(x, y, z, FOUND);
  put(x, b, z, BASE);

  // storey slab at b+5 and roof slab at b+10, over every cell
  put(x, b + 5, z, FRAME);
  put(x, b + 10, z, FRAME);

  // roof equipment on interior cells
  if (!isPerim(x, z) && (x + z) % 5 === 0) put(x, b + 11, z, FRAME);

  if (!isPerim(x, z)) continue;

  for (const f of FACES) {
    if (has(x + f.dx, z + f.dz)) continue; // not exposed
    const along = f.dx !== 0 ? z : x;
    const pane = f.dx !== 0 ? paneEW : paneNS;
    const southEntrance = f.name === "S" && (x === 14 || x === 15);

    // ground storey: b+1..b+4
    for (let y = b + 1; y <= b + 4; y++) {
      if (y === b + 4) { put(x, y, z, FRAME); continue; } // lintel band
      if (southEntrance && y <= b + 2) { put(x, y, z, ENTRY); continue; }
      if (southEntrance && y === b + 3) {
        if (x === 14) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        else put(x, y, z, ENTRY);
        continue;
      }
      if (along % 3 === 0) put(x, y, z, FRAME); // piers
      else put(x, y, z, PANE, pane);
    }

    // upper storey: b+6..b+9
    for (let y = b + 6; y <= b + 9; y++) {
      if (y === b + 6) { put(x, y, z, FRAME); continue; } // sill
      if (y === b + 9) { put(x, y, z, WALL); continue; }  // head band
      if (along % 3 === 0) put(x, y, z, WALL);
      else put(x, y, z, PANE, pane);
    }

    // parapet
    put(x, b + 11, z, WALL);

    // warm light behind selected upper windows (interior cell, if it is footprint interior)
    if (along % 6 === 4) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz) && !isPerim(ix, iz)) put(ix, b + 7, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
