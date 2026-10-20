import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style commercial block, c. 1990s: two storeys over a shopfront
// base, white tiled concrete frame, dark-framed glazing, red fascia at the entrance,
// stone plinth, parapet, rooftop plant and a small mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455327";
const W = 20, H = 23, D = 17;
const ROOF = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Ground per cell, clamped so a two-high entrance and the storey lines still fit.
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(2, Math.round(gr))));
}
const inside = (x, z) => ground.has(`${x},${z}`);
const bOf = (x, z) => ground.get(`${x},${z}`);

const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: 1, dz: 0, facing: "east" },
  { dx: -1, dz: 0, facing: "west" },
];
const facesOf = (x, z) => DIRS.filter((d) => !inside(x + d.dx, z + d.dz));
const isEdge = (x, z) => facesOf(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Front = north face (lowest z). Entrance at the median x of that face.
const frontXs = cells
  .filter(([x, z]) => !inside(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const eX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -999;
const eZ = cells
  .filter(([x, z]) => x === eX && !inside(x, z - 1))
  .map(([, z]) => z)[0];
const frontRow = new Set(
  frontXs.filter((x) => Math.abs(x - eX) <= 2).map((x) => `${x},${eZ}`)
);
// Shopfront bays: north-face cells within two of the entrance.
const isShopfront = (x, z) =>
  frontRow.has(`${x},${z}`) || (Math.abs(x - eX) <= 2 && z === eZ);

// Pass 1: foundation, floor slabs, walls, glazing, entrance.
for (const [x, z] of cells) {
  const b = bOf(x, z);
  const faces = facesOf(x, z);
  const edge = faces.length > 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < b; y++) put(x, y, z, "stone_bricks");
  // Ground floor slab on top of the foundation.
  put(x, b, z, edge ? "stone_bricks" : "smooth_stone");
  // Storey floor slab and roof slab across the whole footprint.
  put(x, 5, z, "smooth_stone");
  put(x, 10, z, "light_gray_concrete");

  if (!edge) continue;

  const corner = faces.length > 1;
  const face = faces[0];
  const along = face.dx !== 0 ? z : x;
  const bayWin = !corner && along % 3 === 1;
  const shop = isShopfront(x, z) && faces.some((f) => f.facing === "north");
  const isEntrance = shop && x === eX && z === eZ;
  const entranceFacing = "north";

  for (let y = b + 1; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
    } else if (y === 10) {
      put(x, y, z, "smooth_quartz");
    } else if (y === 9) {
      put(x, y, z, "light_gray_concrete"); // head band
    } else if (y === 8 || y === 7) {
      if (bayWin) put(x, y, z, "glass_pane");
      else put(x, y, z, "white_concrete");
    } else if (y === 6 || y === 5) {
      put(x, y, z, "light_gray_concrete"); // sill and floor bands
    } else if (y === 4) {
      put(x, y, z, shop ? "red_concrete" : "light_gray_concrete"); // fascia / spandrel
    } else {
      // Ground-floor storey, y in b+1 .. 3.
      if (y === b + 1) {
        if (isEntrance) {
          put(x, y, z, "oak_door", {
            facing: entranceFacing, half: "lower", hinge: "left", open: "false", powered: "false",
          });
        } else {
          put(x, y, z, "smooth_quartz");
        }
      } else if (isEntrance && y === b + 2) {
        put(x, y, z, "oak_door", {
          facing: entranceFacing, half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else if (shop || bayWin) {
        put(x, y, z, "glass_pane");
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

// Pass 2: warm light behind some glazing (interior air cells sit on the slabs).
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const b = bOf(x, z);
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const f = faces[0];
  const along = f.dx !== 0 ? z : x;
  const ix = x - f.dx, iz = z - f.dz;
  if (!inside(ix, iz) || isEdge(ix, iz)) continue;

  if (along % 6 === 1) {
    put(ix, 6, iz, "glowstone"); // upper storey, on the floor slab behind the glass
  }
  if (x === eX && z === eZ) {
    put(ix, b + 1, iz, "glowstone"); // entrance lit from within
  } else if (isShopfront(x, z) && f.facing === "north" && along % 2 === 0) {
    put(ix, b + 1, iz, "shroomlight");
  }
}

// Pass 3: rooftop plant and a small mast on the roof slab (layer 10).
for (const [x, z] of cells) {
  if (isEdge(x, z)) continue;
  if ((x * 5 + z * 7) % 13 === 3) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}
const mast = cells.find(([x, z]) => !isEdge(x, z) && (x * 3 + z) % 17 === 5);
if (mast) {
  const [mx, mz] = mast;
  for (let y = 11; y <= 14; y++) put(mx, y, mz, "iron_bars");
  put(mx, 15, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
