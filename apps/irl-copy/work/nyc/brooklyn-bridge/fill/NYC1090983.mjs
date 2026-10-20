import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${SRC}/NYC1090983.cells.json`, "utf8"));

const W = 5, H = 17, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup and reference levels (y0 = lowest ground under the footprint)
const map = new Map();
const key = (x, z) => x + "," + z;
const has = (x, z) => map.has(key(x, z));
const minG = Math.min(...cells.map(c => c[2]));
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: Math.round(gr - minG), r: Math.round(rf - minG) });

// Flat roof: median lidar roof height, clamped to a 2-storey-plus-parapet massing
const roofs = cells.map(c => Math.round(c[3] - minG)).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(16, Math.max(5, medRoof));

const cellInfo = (x, z) => {
  const c = map.get(key(x, z));
  const gc = c.g;
  const top = Math.min(16, Math.max(TOP, gc + 4));
  return { gc, top, hgt: top - gc };
};

const isRing = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

const SET = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Palette: 1971 brown-brick elevator building on a stone base, stone quoins and cornice
const BRICK = "bricks";
const BASE = "stone_bricks";
const QUOIN = "stone_bricks";
const CORNICE = "smooth_stone";
const FOUND = "stone";
const FLOOR = "smooth_stone";

// Pass 1: foundations, interior floors, shell
for (const [x, z] of [...map.keys()].map(k => k.split(",").map(Number))) {
  const { gc, hgt } = cellInfo(x, z);

  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gc; y++) SET(x, y, z, FOUND);

  if (!isRing(x, z)) {
    // interior: floor slabs every storey (even rel) and roof; air between
    for (let rel = 0; rel < hgt; rel++) {
      const y = gc + rel;
      if (rel % 2 === 0 || rel === hgt - 1) SET(x, y, z, FLOOR);
    }
    continue;
  }

  // exterior ring cell: facade
  const ext = {
    W: !has(x - 1, z), E: !has(x + 1, z),
    N: !has(x, z - 1), S: !has(x, z + 1),
  };
  const extCount = Object.values(ext).filter(Boolean).length;
  const corner = extCount >= 2;
  const face = ext.N ? "N" : ext.S ? "S" : ext.W ? "W" : "E";
  const along = (face === "N" || face === "S") ? x : z;
  const isDoor = face === "N" && z === 0 && along === 2;
  const nearDoor = face === "N" && z === 0 && (along === 1 || along === 3);
  const paneProps = (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  for (let rel = 0; rel < hgt; rel++) {
    const y = gc + rel;

    if (isDoor && rel <= 1) {
      SET(x, y, z, "oak_door", {
        facing: "north",
        half: rel === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (rel === 0) { SET(x, y, z, BASE); continue; }                       // stone base course
    if (rel === hgt - 1) { SET(x, y, z, CORNICE); continue; }              // cornice / parapet
    if (corner || (nearDoor && rel <= 1)) { SET(x, y, z, QUOIN); continue; } // quoins and door surround
    if (rel % 2 === 1) {                                                    // window band
      SET(x, y, z, "glass_pane", paneProps);
      continue;
    }
    SET(x, y, z, BRICK);                                                    // brick spandrel / storey line
  }

  // warm light behind the windows, inside the interior air
  if (!corner && !isDoor && along >= 1 && along <= 3) {
    const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] }[face];
    const ix = x + inward[0], iz = z + inward[1];
    if (has(ix, iz) && !isRing(ix, iz)) {
      const ci = cellInfo(ix, iz);
      for (const rel of [1, 3]) {
        if (rel >= hgt) continue;
        const y = gc + rel;
        const ri = y - ci.gc;
        if (ri >= 1 && ri < ci.hgt - 1 && ri % 2 === 1) {
          // lit middle windows on every face, dimmer flanking ones
          if (along === 2 || rel === 1) SET(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

g.save(`${SRC}/NYC1090983.nbt`);
