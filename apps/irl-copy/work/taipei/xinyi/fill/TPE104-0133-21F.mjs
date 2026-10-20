import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE104-0133-21F";
const W = 12, H = 23, D = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) fp.set(key(x, z), gr);
const has = (x, z) => fp.has(key(x, z));

// outward-facing directions: [dx, dz, facing name]
const FACES = [[-1, 0, "west"], [1, 0, "east"], [0, -1, "north"], [0, 1, "south"]];
const outwardFaces = (x, z) => FACES.filter(([dx, dz]) => !has(x + dx, z + dz));
const isBnd = (x, z) => outwardFaces(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Street frontage = west (x = 0) face. Entrance sits on the middle of that face.
const streetAlong = [];
for (const k of fp.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x - 1, z)) streetAlong.push(z);
}
const doorA = streetAlong.length
  ? Math.round((Math.min(...streetAlong) + Math.max(...streetAlong)) / 2)
  : -1;

const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Storey levels relative to each cell's ground gr:
// rel 0 base course, 1-4 storey one, 5 storey line, 6-9 storey two, 10 parapet cap, 11 coping
const wallMat = (rel) => {
  if (rel === 0) return "stone_bricks";
  if (rel === 5 || rel === 10) return "light_gray_concrete";
  if (rel === 11) return "smooth_stone";
  return "white_concrete";
};

for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const out = outwardFaces(x, z);
  const bnd = out.length > 0;

  // ground-floor slab
  put(x, gr, z, bnd ? "stone_bricks" : "smooth_stone");

  if (!bnd) {
    // interior: second-floor slab, roof deck, and a rooftop plant screen
    put(x, gr + 5, z, "light_gray_concrete");
    put(x, gr + 10, z, "light_gray_concrete");
    if (x >= 4 && x <= 7 && z >= 12 && z <= 18) {
      const edge = x === 4 || x === 7 || z === 12 || z === 18;
      put(x, gr + 11, z, edge ? "smooth_stone" : "smooth_quartz");
    }
    continue;
  }

  // walls, bands, parapet
  for (let rel = 1; rel <= 11; rel++) put(x, gr + rel, z, wallMat(rel));

  // choose one face per cell, street face first
  const face = out.find(f => f[0] === -1) ?? out[0];
  const [dx, dz, name] = face;
  const isStreet = dx === -1;
  const along = dx !== 0 ? z : x;
  const pier = along % 3 === 0;
  const pane = dx !== 0 ? paneNS : paneEW;
  const inX = x - dx, inZ = z - dz;
  const inner = has(inX, inZ) && !isBnd(inX, inZ);
  const nearDoor = isStreet && Math.abs(along - doorA) === 1;

  // quartz piers give the grid depth against the white spandrels
  if (pier) {
    for (const rel of [1, 2, 3, 4, 6, 7, 8, 9]) put(x, gr + rel, z, "smooth_quartz");
  }

  // storey one
  if (isStreet) {
    put(x, gr + 4, z, "gray_concrete"); // fascia band over the shopfront
    if (along === doorA) {
      put(x, gr + 1, z, "spruce_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "spruce_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "glass_pane", pane); // transom
      if (inner) put(inX, gr + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    } else if (nearDoor) {
      // entrance reveal: quartz jambs beside the door
      for (let rel = 1; rel <= 3; rel++) put(x, gr + rel, z, "smooth_quartz");
    } else if (!pier) {
      for (let rel = 1; rel <= 3; rel++) {
        put(x, gr + rel, z, "light_blue_stained_glass_pane", pane);
      }
    }
  } else if (!pier) {
    for (let rel = 1; rel <= 4; rel++) {
      put(x, gr + rel, z, "light_blue_stained_glass_pane", pane);
    }
  }

  // storey two windows, with warm lights behind some of them
  if (!pier) {
    for (let rel = 6; rel <= 9; rel++) {
      put(x, gr + rel, z, "light_blue_stained_glass_pane", pane);
    }
    if (along % 6 === 4 && inner) {
      put(inX, gr + 7, inZ, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
