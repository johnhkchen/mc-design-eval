import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608939";
const W = 24, H = 23, D = 19;

// Footprint cells: [x, z, ground]. Normalise so the lowest ground is y 0.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(([, , gr]) => Math.round(gr)));
const cells = raw.map(([x, z, gr]) => [x, z, Math.round(gr) - minG]);

const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

// Exterior ring = footprint cells with at least one open side.
const ringSet = new Set();
for (const [x, z] of cells) {
  if (!has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1)) {
    ringSet.add(`${x},${z}`);
  }
}
const ring = (x, z) => ringSet.has(`${x},${z}`);

const maxG = Math.max(...cells.map(([, , gr]) => gr));
// Roof cap at 11 blocks above the lowest ground, lifted if the site rises above that.
const roofY = Math.max(11, maxG + 10);

// Front = northmost ring row (smallest z). Door sits in the middle of that row.
const frontZ = Math.min(...[...ringSet].map((k) => Number(k.split(",")[1])));
const frontXs = [...ringSet]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === frontZ)
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

// Pane connections only toward neighbouring ring cells, so glass does not arm into air.
const paneProps = (x, z) => ({
  north: ring(x, z - 1) ? "true" : "false",
  south: ring(x, z + 1) ? "true" : "false",
  east: ring(x + 1, z) ? "true" : "false",
  west: ring(x - 1, z) ? "true" : "false",
  waterlogged: "false",
});

// Inward neighbour (footprint, not ring) for placing lights behind glass.
const inward = (x, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !ring(nx, nz)) return [nx, nz];
  }
  return null;
};

for (const [x, z, gr] of cells) {
  const isRing = ring(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  g.set(x, gr, z, isRing ? "polished_granite" : "smooth_stone");

  // Storey line between floors.
  const floor2 = gr + 5;
  const cornice = roofY - 1;

  for (let y = gr + 1; y <= roofY - 1; y++) {
    if (y === floor2) {
      g.set(x, y, z, isRing ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (!isRing) continue; // interior air gap

    if (y === cornice) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }

    const pos = x + z;

    if (y <= gr + 4) {
      // Ground-floor shopfront.
      if (y === gr + 4) {
        g.set(x, y, z, "dark_oak_planks");
      } else if (pos % 3 === 0) {
        g.set(x, y, z, "dark_oak_planks");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(x, z));
      }
    } else if (y === roofY - 2) {
      // Upper-floor lintel.
      g.set(x, y, z, "white_concrete");
    } else {
      // Upper-floor window grid.
      if (pos % 4 === 0) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(x, z));
        // Warm shroomlight behind selected upper windows.
        if (y === gr + 7 && pos % 8 === 2) {
          const inn = inward(x, z);
          if (inn) g.set(inn[0], y, inn[1], "shroomlight");
        }
      }
    }
  }

  // Interior floor slab at the upper storey line (non-ring already set above).
  // Roof cap across the whole footprint.
  g.set(x, roofY, z, "smooth_stone");

  // Parapet on the perimeter; rooftop units inside.
  if (isRing) {
    g.set(x, roofY + 1, z, "stone_brick_wall");
  } else if ((x * 3 + z * 5) % 11 === 0) {
    g.set(x, roofY + 1, z, "iron_block");
  }
}

// Entrance: door in the middle of the front row, with a transom and an inside lantern.
{
  const dgr = gmap.get(`${doorX},${frontZ}`);
  g.set(doorX, dgr + 1, frontZ, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dgr + 2, frontZ, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  g.set(doorX, dgr + 3, frontZ, "dark_oak_planks");
  const inn = [doorX, frontZ + 1];
  if (has(inn[0], inn[1]) && !ring(inn[0], inn[1])) {
    g.set(inn[0], dgr + 4, inn[1], "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
