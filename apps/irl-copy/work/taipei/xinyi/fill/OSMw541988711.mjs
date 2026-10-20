import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 13 x 31 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey (5 blocks per storey) 1970s-80s Taipei commercial block:
// white-painted concrete walls, grey stone plinth, light-blue glass shopfronts
// and window bands, red-brown lintel over the entrance, parapet and roof plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541988711";
const W = 13, H = 23, D = 31;
const ROOF_MIN = 10;     // roof slab no lower than this row

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(cells.map(([x, z, gr]) => [key(x, z), Math.round(gr)]));
const has = (x, z) => ground.has(key(x, z));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

const exteriorFaces = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

// Ground-floor entrance: prefer a single-face cell on the south face, nearest the middle.
const midX = (W - 1) / 2;
let door = null;
{
  let best = null;
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    const f = exteriorFaces(x, z);
    if (f.length !== 1) continue;
    const face = f[0];
    const u = face === "north" || face === "south" ? x : z;
    const center = face === "north" || face === "south" ? midX : (D - 1) / 2;
    const score = (face === "south" ? 0 : 100) + Math.abs(u - center);
    if (!best || score < best.score) best = { x, z, face, score };
  }
  door = best;
}

for (const [x0, z0, gr0] of cells) {
  const x = x0, z = z0;
  const gr = Math.round(gr0);
  const faces = exteriorFaces(x, z);
  const perim = faces.length > 0;
  const topY = Math.max(ROOF_MIN, gr + 3);      // roof slab row
  const parapetY = topY + 1;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab / plinth.
  g.set(x, gr, z, perim ? "polished_andesite" : "smooth_stone");

  // Storey floors (ground floor slab is the plinth; upper slabs below).
  const floors = [gr, gr + 5].filter((f) => f + 3 <= topY - 1);
  for (const f of floors) {
    if (f > gr) g.set(x, f, z, "smooth_stone");
  }

  // Roof slab and parapet.
  g.set(x, topY, z, "light_gray_concrete");
  if (perim) g.set(x, parapetY, z, "light_gray_concrete");

  // Roof plant on interior cells: small AC units, scattered.
  if (!perim && (x * 3 + z * 5) % 11 === 0) g.set(x, parapetY, z, "iron_block");

  if (!perim) continue;

  // Exterior walls, storey by storey.
  const isDoor = door && door.x === x && door.z === z;
  const axisNS = faces.includes("north") || faces.includes("south");
  const u = axisNS ? x : z;
  const cornerPier = faces.length >= 2;
  const paneProps = axisNS
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = gr + 1; y <= topY - 1; y++) {
    // Cornice course under the roof.
    if (y === topY - 1) { g.set(x, y, z, "light_gray_concrete"); continue; }

    const f = floors.find((fl) => y >= fl && y <= fl + 4);
    if (f === undefined) { g.set(x, y, z, "white_concrete"); continue; }
    const rel = y - f;

    if (rel === 0 || rel === 4) { g.set(x, y, z, "light_gray_concrete"); continue; }

    // rel 1..3: window band.
    if (f === gr && isDoor) {
      if (rel === 1) {
        g.set(x, y, z, "oak_door", {
          facing: OPP[door.face], half: "lower", hinge: "left", open: "false", powered: "false",
        });
      } else if (rel === 2) {
        g.set(x, y, z, "oak_door", {
          facing: OPP[door.face], half: "upper", hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, "red_terracotta");
      }
      continue;
    }

    const pier = cornerPier || u % 3 === 0;
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }

    g.set(x, y, z, "light_blue_stained_glass_pane", { ...paneProps, waterlogged: "false" });

    // Warm light behind some panes, in the interior cell just inside the glass.
    if (rel === 2 && u % 6 === 1) {
      const outward = faces[0];
      const [dx, dz] = DIRS[outward];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && exteriorFaces(ix, iz).length === 0) {
        g.set(ix, y, iz, f === gr ? "glowstone" : "shroomlight");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
