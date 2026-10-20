// Lobbies, doors, floors (curtain walls L1-L5, doors D1-D7, glass bands, connectors, floors and stairs).
// Writes only what plan.md's Lobbies, OPENINGS and FLOORS tables give. The shells are locked (runParts refuses any write
// into a cell an earlier part holds), so lobbyView lets this part write only air, the ground (y0) and its own cells; a
// write into a shell's wall is skipped here and counted, never sent to be refused.
import { curtainWall, connector, glassBand, GROUND_Y } from "../vocab.mjs";
import { formInterior } from "./forms.mjs";
import { flight, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ANDESITE = "polished_andesite";

// A view of the grid for this part: set / unset / fill write only where free(); the rest is counted in `skipped`
function lobbyView(g) {
  const mine = new Set(), skipped = [];
  const key = (x, y, z) => `${x},${y},${z}`;
  const free = (x, y, z) => {
    const c = g.get(x, y, z);
    return y === GROUND_Y || mine.has(key(x, y, z)) || !c || /(^|_)air$/.test(c.block);
  };
  const put = (x, y, z, block, state, nbt) => {
    if (free(x, y, z)) { g.set(x, y, z, block, state, nbt); mine.add(key(x, y, z)); }
    else skipped.push([x, y, z, block]);
  };
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => { put(x, y, z, block, state, nbt); return view; };
      if (prop === "unset") return (x, y, z) => { put(x, y, z, "minecraft:air"); return view; };
      if (prop === "fill") return (a, b, block, state) => {
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++)
          for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
            for (let z = Math.min(a[2], b[2]); z <= Math.max(a[2], b[2]); z++) put(x, y, z, block, state);
        return view;
      };
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return { view, skipped };
}

// Ground floor of a lobby: paved polished_andesite on the y0 ground (the ground is still writable here)
function paveLobby(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 0, z, ANDESITE);
}

// A lobby roof: polished_andesite_slab (top) at y8 over the lobby box, where no shell is above it
function lobbyRoof(g, [x0, z0, x1, z1]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 8, z, ...B.slab(ANDESITE, "top"));
}

// One door leaf, both halves, facing out of the building; hinge says which side the leaf hangs on
function leaf(g, x, z, facing, hinge = "left") {
  g.set(x, 1, z, ...B.door("birch", facing, "lower", hinge));
  g.set(x, 2, z, ...B.door("birch", facing, "upper", hinge));
}

// A double door: two leaves side by side across a wall (the two hinges mirror so they meet)
function doubleDoor(g, a, b, facing) {
  leaf(g, a[0], a[1], facing, "left");
  leaf(g, b[0], b[1], facing, "right");
}

// A floor layer: block at y on the box, only inside the forms (it never pokes out through a leaning wall)
function floor(g, [x0, z0, x1, z1], y, block = ANDESITE) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (formInterior(x, y, z)) g.set(x, y, z, block);
}

export function build(target) {
  const { view: g, skipped } = lobbyView(target);

  // L1..L5: ground paving and the roofs of the five street and entrance lobbies
  const lobbies = {
    L1: [26, 22, 42, 36],
    L2: [36, 56, 42, 94],
    L3: [52, 22, 56, 60],
    L4: [40, 110, 42, 148],
    L5: [52, 108, 54, 142],
  };
  for (const box of Object.values(lobbies)) paveLobby(g, box);
  for (const box of Object.values(lobbies)) lobbyRoof(g, box);

  // Curtain walls (glass_pane with polished_andesite mullions, y1..7) over each street face. The door cells are laid
  // after, so the glass stays above the doors (y3..7) and the doors overwrite the glass below.
  curtainWall(g, { axis: "x", fixed: 22, from: 27, to: 41 });   // L1 north entrance, plane z 22
  curtainWall(g, { axis: "z", fixed: 52, from: 22, to: 60 });   // L3 east street lobby, plane x 52
  curtainWall(g, { axis: "z", fixed: 42, from: 56, to: 94 });   // L2 west street lobby, plane x 42
  curtainWall(g, { axis: "z", fixed: 42, from: 110, to: 148 }); // L4 south-west street lobby, plane x 42
  curtainWall(g, { axis: "z", fixed: 52, from: 108, to: 142 }); // L5 south-east street lobby, plane x 52

  // Doors (birch, both halves, y1..2, facing out)
  doubleDoor(g, [31, 22], [32, 22], "north");   // D1
  doubleDoor(g, [35, 22], [36, 22], "north");   // D2
  doubleDoor(g, [52, 38], [52, 39], "west");    // D3 (x 52 z 38..39; the second leaf on z 39)
  doubleDoor(g, [52, 46], [52, 47], "west");    // D3 (z 46..47)
  doubleDoor(g, [42, 62], [42, 63], "east");    // D4
  doubleDoor(g, [42, 92], [42, 93], "east");    // D4 (z 92..93)
  doubleDoor(g, [42, 128], [42, 129], "east");  // D5
  doubleDoor(g, [52, 124], [52, 125], "west");  // D6
  doubleDoor(g, [9, 73], [9, 74], "west");      // D7 (red's west face: refused if the shell is solid there)

  // Glass bands: the bridge gallery's north and south windows, and the purple drum's slot window
  // (cut by the shells' own parts into their leaning faces: middle.mjs the gallery bands, north.mjs the slot window)

  // Connectors: 2 wide x 3 high openings where the shells overlap at y1..3
  connector(g, { box: [20, 1, 61, 21, 3, 62] });  // silver A <-> red
  connector(g, { box: [22, 1, 86, 23, 3, 87] });  // red <-> gold
  connector(g, { box: [28, 1, 126, 29, 3, 127] }); // gold <-> silver B
  connector(g, { box: [72, 1, 58, 73, 3, 62] });  // purple <-> blue
  connector(g, { box: [70, 1, 106, 71, 3, 108] }); // blue <-> magenta

  // Floors: full polished_andesite layers inside each shell (block y -> walk-on y+1)
  floor(g, [7, 28, 40, 60], 12);     // silver A, ground to y13
  floor(g, [7, 28, 40, 60], 24);     // silver A, upper
  floor(g, [57, 6, 89, 21], 12);     // purple mezzanine over z 6..20 (plus the landing at z 21)
  floor(g, [57, 65, 92, 104], 18);   // blue body upper floor
  floor(g, [33, 66, 59, 90], 18);    // bridge gallery over the train
  floor(g, [12, 64, 35, 85], 12);    // red
  floor(g, [13, 89, 40, 123], 12);   // gold
  floor(g, [56, 111, 85, 141], 12);  // magenta
  floor(g, [18, 127, 40, 147], 12);  // silver B
  // The blue floor is open over the gallery access (x 57..58, z 74..82)
  for (let x = 57; x <= 58; x++) for (let z = 74; z <= 82; z++) g.set(x, 18, z, "air");

  // Stair flights (3 wide, polished_andesite_stairs; from = first step at the lower floor's walk level)
  flight(g, { from: [9, 1, 48], facing: "north", to: 12, material: "polished_andesite", width: 3 });  // silver A, ground to y13
  flight(g, { from: [39, 13, 45], facing: "south", to: 24, material: "polished_andesite", width: 3 }); // silver A, y13 to y25
  flight(g, { from: [60, 1, 66], facing: "south", to: 18, material: "polished_andesite", width: 3 }); // blue to y19
  flight(g, { from: [14, 1, 76], facing: "north", to: 12, material: "polished_andesite", width: 3 }); // red to y13
  flight(g, { from: [15, 1, 104], facing: "north", to: 12, material: "polished_andesite", width: 3 }); // gold to y13
  flight(g, { from: [58, 1, 126], facing: "north", to: 12, material: "polished_andesite", width: 3 }); // magenta to y13
  flight(g, { from: [20, 1, 139], facing: "north", to: 12, material: "polished_andesite", width: 3 }); // silver B to y13
  flight(g, { from: [58, 1, 33], facing: "north", to: 12, material: "polished_andesite", width: 3 }); // purple to the mezzanine y13

  // Openings and floor cells the shells hold (connector reveals, glass bands, stair cuts, floor cells in walls) are skipped
  const cells = skipped.length ? ` (first ${skipped.slice(0, 3).map((c) => c.slice(0, 3).join(",")).join("; ")})` : "";
  console.log(`lobbies: ${skipped.length} writes into shell cells skipped${cells}`);
}
