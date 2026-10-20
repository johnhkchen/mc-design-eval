import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833896";
const W = 10, H = 23, D = 18;

// Storey plan: ground storey 0..4 (shopfront), floor slab 5, upper storey 6..9,
// roof slab 10, parapet 11. Two storeys of about 5 blocks, flat roof with parapet.
const STOREY_Y = 5, ROOF_Y = 10, PARAPET_Y = 11;

// Interior columns carrying the floor slab and roof slab (no air under a slab).
const COLS = new Set(["3,5", "3,11", "6,5", "6,11"]);

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.min(H - 1, Math.max(0, Math.round(gr))));
}

const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);
const zFace = (x, z) => !inside(x, z - 1) || !inside(x, z + 1); // wall runs along x
const xFace = (x, z) => !inside(x - 1, z) || !inside(x + 1, z); // wall runs along z
const pier = (x, z) =>
  (zFace(x, z) && x % 3 === 0) ||
  (xFace(x, z) && z % 3 === 0) ||
  (zFace(x, z) && xFace(x, z));

const pane = (x, z) => {
  const ns = xFace(x, z) ? "true" : "false";
  const ew = zFace(x, z) ? "true" : "false";
  return { north: ns, south: ns, east: ew, west: ew, waterlogged: "false" };
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Returns [id, props?] for a footprint cell at height y, or null for air.
function blockAt(x, z, y, fg, per) {
  if (y === ROOF_Y) return ["smooth_stone"];
  if (y === PARAPET_Y) return per ? ["white_concrete"] : null;
  if (y === STOREY_Y) return per ? ["light_gray_concrete"] : ["smooth_stone"];
  if (!per) return null;

  // Perimeter shell
  if (y === fg && y <= 4) return ["polished_andesite"]; // base course

  if (y <= 4) {
    // Entrance door on the z = 0 face, at x = 4
    if (x === 4 && z === 0 && !inside(4, -1) && (y === fg + 1 || y === fg + 2) && fg + 2 <= 4) {
      return [
        "dark_oak_door",
        {
          facing: "north",
          half: y === fg + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        },
      ];
    }
    if (pier(x, z)) return ["white_concrete"];
    if (y >= fg + 1 && y <= 3) return ["glass_pane", pane(x, z)]; // shopfront glass
    return ["white_concrete"]; // lintel band at 4
  }

  // Upper storey
  if (pier(x, z)) return ["white_concrete"];
  if (y === 6) return ["white_concrete"];                          // sill
  if (y === 7 || y === 8) return ["light_blue_stained_glass_pane", pane(x, z)];
  if (y === 9) return ["light_gray_concrete"];                     // head / cornice band
  return null;
}

// Main pass: foundation, then shell per cell.
for (const [x, z, gr] of cells) {
  const fg = Math.min(H - 1, Math.max(0, Math.round(gr)));
  const per = perim(x, z);

  for (let y = 0; y < fg; y++) put(x, y, z, "stone_bricks");

  if (COLS.has(`${x},${z}`)) {
    for (let y = fg; y < ROOF_Y; y++) put(x, y, z, "white_concrete");
    put(x, ROOF_Y, z, "smooth_stone");
    continue;
  }

  for (let y = fg; y <= PARAPET_Y; y++) {
    const b = blockAt(x, z, y, fg, per);
    if (b) put(x, y, z, b[0], b[1]);
  }
}

// Roof equipment: two plant boxes on the roof, interior cells only.
const boxes = [
  [2, 3, 4, 5, 2],
  [6, 7, 11, 12, 1],
];
for (const [x0, x1, z0, z1, h] of boxes) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inside(x, z) || perim(x, z)) continue;
      for (let k = 1; k <= h; k++) put(x, ROOF_Y + k, z, "light_gray_concrete");
    }
  }
}

// Warm lights behind some windows (interior lamps sit just inside the glass).
for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  if (!perim(x, z) || pier(x, z)) continue;
  let ix, iz;
  if (zFace(x, z)) {
    ix = x;
    iz = z === 0 ? 1 : D - 2;
  } else {
    ix = x === 0 ? 1 : W - 2;
    iz = z;
  }
  if (!inside(ix, iz) || perim(ix, iz) || COLS.has(`${ix},${iz}`)) continue;
  const ig = gAt(ix, iz);

  // Ground-floor glowstone behind some shopfront windows
  if ((x + z) % 6 === 0 && ig + 2 <= 3) {
    put(ix, ig + 2, iz, "glowstone");
  }
  // Upper-floor shroomlight behind some windows
  if ((x + z) % 4 === 1 && ig <= 6) {
    put(ix, 7, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
