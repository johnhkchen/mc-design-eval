// Part 4, facades and fittings (plan.md FACADES, OPENINGS, elements 5, 6, 12, 14, 19): piers and window strips on every
// exposed face, lit bays at ~25%, shopfronts with bronze fascias, the portal's doors, glass and gilded panels, the plot 1/2
// Fifth Avenue entrances with their relief panels and emblems. Builds only into the shell's skin (air) and the cells the
// plan leaves open; doors and portal glass overwrite the facade's own pier/glass cells (same part, so no refusal).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pier_strip_face, shop_bay, deco_panel, emblem, crown_band } from "../vocab.mjs";

const GLASS = "glass_pane";

// A two-leaf dark oak door (both halves) on a face: cells a and a+1 along `along` ("x" or "z") at floor y, leaves facing `facing`.
function doorPair(g, x, y, z, facing, along) {
  const [dx, dz] = along === "x" ? [1, 0] : [0, 1];
  for (let i = 0; i < 2; i++) {
    const hinge = i === 0 ? "left" : "right";
    g.set(x + i * dx, y, z + i * dz, ...B.door("dark_oak", facing, "lower", hinge));
    g.set(x + i * dx, y + 1, z + i * dz, ...B.door("dark_oak", facing, "upper", hinge));
  }
}

// Glass panes in a column run along z (for the portal and the Fifth Avenue entrance).
function glassZ(g, x, y0, y1, z0, z1) {
  for (let z = z0; z <= z1; z++) for (let y = y0; y <= y1; y++)
    g.set(x, y, z, GLASS, { north: "true", south: "true", east: "false", west: "false" });
}

// The shell's solid cells are earlier parts' work, and runParts locks them. `replace: true` shopfronts overwrite this part's
// own facade cells (candles, fascias), so they must reach past the facade's glass; they must not reach the shell's cells.
// The shell leaves a course solid where a lower mass runs into a taller wall (plot 0 north face, y 5, x 30..32), so a write
// into one is dropped here and listed, and the stone course stays as the shell built it.
function ownCellsOnly(g, dropped) {
  const mine = new Set();
  const set = (x, y, z, block, state) => {
    const key = `${x},${y},${z}`;
    if (!mine.has(key) && !g.isAir(x, y, z)) { dropped.push([x, y, z, block]); return; }
    mine.add(key);
    g.set(x, y, z, block, state);
  };
  return new Proxy(g, { get: (t, k) => (k === "set" ? set : typeof t[k] === "function" ? t[k].bind(t) : t[k]) });
}

// Plot 0: the International Building, its Fifth Avenue wings, the portal (kit coordinates; plot 0 origin is 0,0).
function plot0(g) {
  // T1 tower: east (Fifth Avenue side, face x 61) and west, between the crown band (y 139..142) and the paving
  pier_strip_face(g, { face: "east", at: 61, from: 18, to: 37, y0: 19, y1: 138, pierMod: 2, litSeed: 1 });
  pier_strip_face(g, { face: "west", at: 0, from: 18, to: 37, y0: 19, y1: 138, pierMod: 2, litSeed: 2 });
  crown_band(g, [0, 139, 18, 61, 142]);

  // Slab ends, first and second steps: east faces of T4 (x 53), both slab ends (z 12..17 and 38..43)
  pier_strip_face(g, { face: "east", at: 53, from: 12, to: 17, y0: 2, y1: 57, pierMod: 1, litSeed: 3 });
  pier_strip_face(g, { face: "east", at: 53, from: 38, to: 43, y0: 2, y1: 57, pierMod: 1, litSeed: 4 });

  // Fifth Avenue wings: north (z 0..19) and south (z 36..54), east face x 83, piers 2,5,8,... and 38,41,...
  pier_strip_face(g, { face: "east", at: 83, from: 0, to: 19, y0: 2, y1: 21, pierMod: 2, litSeed: 5 });
  pier_strip_face(g, { face: "east", at: 83, from: 36, to: 54, y0: 2, y1: 21, pierMod: 2, litSeed: 6 });
  shop_bay(g, { face: "east", plane: 83, a: 2, b: 8, pier: (t) => (t - 2) % 3 === 0, replace: true });
  shop_bay(g, { face: "east", plane: 83, a: 11, b: 17, pier: (t) => (t - 2) % 3 === 0, replace: true });
  shop_bay(g, { face: "east", plane: 83, a: 36, b: 44, pier: (t) => (t - 2) % 3 === 0, replace: true });
  shop_bay(g, { face: "east", plane: 83, a: 47, b: 52, pier: (t) => (t - 2) % 3 === 0, replace: true });
  doorPair(g, 83, 2, 9, "east", "z");
  doorPair(g, 83, 2, 45, "east", "z");

  // Forecourt faces: C2 (north wing) south face at z 19, D2 (south wing) north face at z 36, x 63..83, piers x = 0 mod 3
  pier_strip_face(g, { face: "south", at: 19, from: 63, to: 83, y0: 2, y1: 21, pierMod: 0, litSeed: 7 });
  pier_strip_face(g, { face: "north", at: 36, from: 63, to: 83, y0: 2, y1: 21, pierMod: 0, litSeed: 8 });

  // 51st Street (north, z 0) and 50th Street (south, z 54): podium streets, shopfronts between the 50th/51st doors
  const streetBays = [[30, 36], [39, 51], [54, 66], [69, 82]];
  const doors = [37, 52, 67];
  pier_strip_face(g, { face: "north", at: 0, from: 30, to: 83, y0: 2, y1: 21, pierMod: 0, litSeed: 9 });
  pier_strip_face(g, { face: "south", at: 54, from: 30, to: 83, y0: 2, y1: 21, pierMod: 0, litSeed: 10 });
  for (const [a, b] of streetBays) {
    shop_bay(g, { face: "north", plane: 0, a, b, replace: true });
    shop_bay(g, { face: "south", plane: 54, a, b, replace: true });
  }
  for (const x of doors) {
    doorPair(g, x, 2, 0, "north", "x");
    doorPair(g, x, 2, 54, "south", "x");
  }

  // The portal: three pairs of bronze-framed doors on x 60 (z 22..23, 27..28, 32..33), tall glass above, gilded panels
  for (const z0 of [22, 27, 32]) {
    doorPair(g, 60, 2, z0, "east", "z");
    glassZ(g, 60, 7, 15, z0, z0 + 1);
    deco_panel(g, { x: 61, z0, z1: z0 + 1, y0: 4, y1: 6, face: "east" });
  }
}

// Plots 1 and 2: the two six-storey blocks. Local frames: plot 1 origin kit x 88, plot 2 origin kit x 146. `garden` is the
// face on the Channel Gardens (z 18 for plot 1, z 0 for plot 2), `street` the 49th/50th Street face (the other one).
function plot12(g, ox, garden, street, emb) {
  const L = (x) => ox + x;
  const gardenFace = garden === 18 ? "south" : "north";
  const streetFace = street === 0 ? "north" : "south";
  // piers at local 4, 7, ... 49 (local x = 1 mod 3), i.e. kit x = 1 mod 3 shifted by the plot origin; corners 0..1, 52..53
  const pierMod = L(1) % 3;
  for (const [face, at, litSeed] of [[gardenFace, garden, 11], [streetFace, street, 12]]) {
    pier_strip_face(g, { face, at, from: L(0), to: L(53), y0: 2, y1: 21, pierMod, litSeed });
  }
  // shopfronts on the garden face (doors at x 26..27 and 44..45) and on the street face (doors at 44..45 only)
  for (const [a, b] of [[18, 25], [28, 43], [46, 52]]) shop_bay(g, { face: gardenFace, plane: garden, a: L(a), b: L(b), pier: (t) => (t - L(1)) % 3 === 0, replace: true });
  for (const [a, b] of [[18, 43], [46, 52]]) shop_bay(g, { face: streetFace, plane: street, a: L(a), b: L(b), pier: (t) => (t - L(1)) % 3 === 0, replace: true });
  doorPair(g, L(44), 3, garden, gardenFace, "x");
  doorPair(g, L(26), 3, garden, gardenFace, "x");
  doorPair(g, L(44), 3, street, streetFace, "x");

  // Fifth Avenue end (x 53): piers either side of the recess (z 6..12), the gilded panel, the coat of arms, the entrance
  // (the east face plane is kit x; its run is z, which is not offset)
  pier_strip_face(g, { face: "east", at: L(53), from: 0, to: 5, y0: 2, y1: 21, pierMod, litSeed: 13 });
  pier_strip_face(g, { face: "east", at: L(53), from: 13, to: 18, y0: 2, y1: 21, pierMod, litSeed: 14 });
  deco_panel(g, { x: L(53), z0: 6, z1: 12, y0: 11, y1: 17, face: "east" });
  emblem(g, { x: L(53), z0: 8, z2: 10, y0: 9, y1: 10, kind: emb, replace: true });
  doorPair(g, L(51), 3, 8, "east", "z");
  glassZ(g, L(51), 5, 8, 7, 11);
}

// A display candle stands on the shop floor: where a shop bay put one over air, a floor block goes under it (y 1).
function shopFloors(g) {
  for (const c of [...g]) {
    const [x, y, z] = c.pos;
    if (c.block.endsWith("candle") && y === 2 && g.isAir(x, 1, z)) g.set(x, 1, z, "smooth_stone");
  }
}

export function build(shellGrid) {
  const dropped = [];
  const g = ownCellsOnly(shellGrid, dropped);
  plot0(g);
  plot12(g, 88, 18, 0, "british");
  plot12(g, 146, 0, 18, "french");
  shopFloors(g);
  if (dropped.length) console.log(`facades: ${dropped.length} writes into the shell's solid cells dropped, e.g. ${dropped.slice(0, 3).map((d) => d.join(" ")).join("; ")}`);
}
