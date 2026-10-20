import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280206";
const W = 11, H = 33, D = 18;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: (x,z) -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));

// Record: roof about 21 above lowest ground. Four storeys of 5 blocks,
// roof slab at +20, parapet at +21 (clamped to the volume).
const ROOF = Math.min(H - 4, minG + 20);
const PARAPET = Math.min(H - 1, ROOF + 1);
const CAP = Math.min(H - 1, ROOF + 2);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }; // runs E-W, on N/S faces
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }; // runs N-S, on E/W faces

const inward = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// Street face: south where exposed, else first exposed face.
const faceOf = (x, z) => {
  const missing = [];
  if (!has(x, z - 1)) missing.push("north");
  if (!has(x, z + 1)) missing.push("south");
  if (!has(x + 1, z)) missing.push("east");
  if (!has(x - 1, z)) missing.push("west");
  if (missing.length === 0) return null;
  return missing.includes("south") ? "south" : missing[0];
};

// Entrance: middle of the south (street) face.
const southCells = cells.filter(([, z]) => !has(0, 0) || true).map(([x, z]) => [x, z]).filter(([x, z]) => faceOf(x, z) === "south");
const sxs = southCells.map(([x]) => x);
const entranceX = sxs.length ? Math.round((Math.min(...sxs) + Math.max(...sxs)) / 2) : 5;

for (const [x, z, gr] of cells) {
  const face = faceOf(x, z);
  const facade = face !== null;
  const idx = face === "east" || face === "west" ? z : x; // position along the exposed face

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) {
    put(x, y, z, facade && y >= gr - 1 ? "stone_bricks" : "gray_concrete");
  }

  // Storeys: floor slabs every 5 blocks from the lowest ground, walls between.
  for (let y = gr; y < ROOF; y++) {
    const rel = y - minG;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (r === 0) {
      put(x, y, z, "light_gray_concrete"); // floor slab, whole footprint
      continue;
    }
    if (!facade) continue; // interior air gap

    if (r === 4) {
      // storey line / cornice band
      if (k === 0 && x === entranceX && face === "south") {
        put(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // entrance canopy
      } else {
        put(x, y, z, "light_gray_concrete");
      }
      continue;
    }

    // r = 1..3 : window band or shopfront
    const panes = face === "north" || face === "south" ? PANE_NS : PANE_EW;
    if (k === 0 && face === "south" && (x === entranceX || x === entranceX + 1 && false)) {
      // entrance door, two blocks tall starting at ground
      if (y === gr || y === gr + 1) {
        put(x, y, z, "iron_door", {
          facing: "south",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
    }
    if (idx % 3 === 0) {
      put(x, y, z, "light_gray_concrete"); // mullion
    } else if (k === 0) {
      put(x, y, z, "glass_pane", panes); // shopfront glass
    } else {
      put(x, y, z, "light_blue_stained_glass_pane", panes);
    }
  }

  // Wall base course on facade and lights behind glass (interior glowstone).
  if (facade) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    for (let k = 1; k < 4; k++) {
      const winY = minG + 5 * k + 2;
      if (winY >= ROOF) continue;
      if (idx % 6 === 1 && has(ix, iz) && winY >= (ground.get(`${ix},${iz}`) ?? 0)) {
        put(ix, winY, iz, "glowstone");
      }
    }
    if (idx % 6 === 4 && has(ix, iz)) {
      const y0 = minG + 2;
      if (y0 >= (ground.get(`${ix},${iz}`) ?? 0)) put(ix, y0, iz, "shroomlight");
    }
  }

  // Roof: slab across the whole footprint, parapet and cap on the facade.
  put(x, ROOF, z, "smooth_stone");
  if (facade) {
    put(x, PARAPET, z, "white_concrete");
    put(x, CAP, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof equipment: AC plant boxes and a stair/lift penthouse on the back.
const plant = (x0, z0, w, d, h) => {
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++) {
      if (!has(x, z)) continue;
      for (let y = ROOF + 1; y <= ROOF + h; y++) put(x, y, z, "light_gray_concrete");
    }
};
plant(2, 3, 2, 2, 2);
plant(7, 12, 2, 3, 2);
plant(4, 13, 3, 2, 3); // penthouse block, back of the roof

g.save(`${SRC}/${ID}.nbt`);
