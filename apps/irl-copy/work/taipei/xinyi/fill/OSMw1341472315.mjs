import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341472315";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) =>
  Array.isArray(c)
    ? { x: c[0], z: c[1], g: Math.round(c[2]) }
    : { x: c.x, z: c.z, g: Math.round(c.ground ?? c.g ?? c.y ?? 0) }
);

const W = 5, H = 19, D = 9;
const key = (x, z) => `${x},${z}`;
const cellMap = new Map(cells.map((c) => [key(c.x, c.z), c]));
const has = (x, z) => cellMap.has(key(x, z));

const minG = Math.min(...cells.map((c) => c.g));
const topY = minG + 7; // roof top (exclusive) about 7 blocks above lowest ground

// exposed faces: outward normal of each side of the footprint
const DIRS = [
  { name: "north", dx: 0, dz: -1, alongX: true },
  { name: "south", dx: 0, dz: 1, alongX: true },
  { name: "west", dx: -1, dz: 0, alongX: false },
  { name: "east", dx: 1, dz: 0, alongX: false },
];

const g = new Voxels([W, H, D]);

const PANE_X = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const pane = (alongX) =>
  alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pre-compute per-cell facade info
const info = cells.map((c) => {
  const exposed = DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));
  return { ...c, exposed, edge: exposed.length > 0, corner: exposed.length >= 2 };
});
const infoMap = new Map(info.map((c) => [key(c.x, c.z), c]));

// 1. Foundations: solid from y 0 up to each cell's ground
for (const c of info) {
  for (let y = 0; y < c.g && y < H; y++) g.set(c.x, y, c.z, "stone");
}

// 2. Body: storeys, cornice, parapet, shopfront, door, windows
for (const c of info) {
  const gc = c.g;
  if (gc >= topY) continue;
  const primary = c.exposed[0];
  const frontFace = c.exposed.some((d) => d.name === "north");

  for (let y = gc; y < topY; y++) {
    const d = topY - 1 - y; // distance from roof top
    if (!c.edge) {
      // interior: floor slabs and roof lid only, air between (no interiors)
      if (y === gc) g.set(c.x, y, c.z, "stone_bricks");
      else if (d === 2) g.set(c.x, y, c.z, "smooth_stone");
      else if (d === 0) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }

    // edge cells: full facade wall
    if (y === gc) {
      g.set(c.x, y, c.z, "stone_bricks"); // base course
      continue;
    }
    if (d === 0) { g.set(c.x, y, c.z, "smooth_stone"); continue; } // parapet cap
    if (d === 1) { g.set(c.x, y, c.z, "smooth_stone"); continue; } // cornice
    if (d === 2) { g.set(c.x, y, c.z, "light_gray_concrete"); continue; } // storey line

    // window rows (d 3..5)
    const isWindowRow = d >= 3 && d <= 5;
    const idx = primary && primary.alongX ? c.x : c.z;
    const windowBay = !c.corner && primary && idx % 2 === 1;

    if (frontFace && y <= gc + 2) {
      // shopfront on the front (north) face at ground floor
      const isDoorCell = c.x === 2 && c.z === 0 && c.exposed.length === 1;
      if (isDoorCell && y <= gc + 2) {
        if (y === gc + 1) {
          g.set(c.x, y, c.z, "dark_oak_door", {
            facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          g.set(c.x, y, c.z, "dark_oak_door", {
            facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
          });
        }
        continue;
      }
      if (windowBay || (!c.corner && primary && primary.name === "north")) {
        g.set(c.x, y, c.z, "glass");
      } else {
        g.set(c.x, y, c.z, "white_concrete");
      }
      continue;
    }

    if (isWindowRow && windowBay) {
      g.set(c.x, y, c.z, "glass_pane", pane(primary.alongX));
    } else {
      g.set(c.x, y, c.z, "white_concrete");
    }
  }
}

// 3. Warm lights: hanging lanterns just inside some window bays
const lightY = topY - 4;
for (const c of info) {
  if (!c.edge || c.corner || c.g >= lightY) continue;
  const primary = c.exposed[0];
  if (!primary) continue;
  const idx = primary.alongX ? c.x : c.z;
  if (idx % 4 !== 1) continue;
  const ix = c.x - primary.dx;
  const iz = c.z - primary.dz;
  const inner = infoMap.get(key(ix, iz));
  if (!inner || inner.edge) continue;
  if (lightY <= inner.g) continue;
  g.set(ix, lightY, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Roof equipment: one small plant box on an interior roof cell
const interiors = info.filter((c) => !c.edge && c.g < topY);
if (interiors.length) {
  const cx = 2, cz = 4;
  const pick =
    interiors.find((c) => c.x === cx && c.z === cz) ||
    interiors.reduce((best, c) =>
      Math.abs(c.x - cx) + Math.abs(c.z - cz) < Math.abs(best.x - cx) + Math.abs(best.z - cz) ? c : best
    );
  if (topY < H) {
    g.set(pick.x, topY, pick.z, "light_gray_concrete");
    g.set(pick.x, topY + 1 < H ? topY + 1 : topY, pick.z, "light_gray_concrete_slab" === "" ? "" : "smooth_stone_slab", {
      type: "bottom", waterlogged: "false",
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);
