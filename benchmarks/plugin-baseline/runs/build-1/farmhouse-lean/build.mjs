import { Grid } from "../../../../../../minecraft-design/tools/src/build.mjs";

const g = new Grid([40, 14, 36]);

function house() {
  const [x0, x1] = [1, 18], [z0, z1] = [1, 14], [y0, y1] = [1, 10];

  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      for (let y = y0; y < y1; y++) {
        const isWall = x === x0 || x === x1 - 1 || z === z0 || z === z1 - 1;
        if (isWall) g.set(x, y, z, "stone_bricks");
      }
    }
  }

  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      g.set(x, 5, z, "chiseled_stone_bricks");
    }
  }

  const wX = [3, 6, 9, 12, 15];
  for (let x of wX) {
    g.set(x, 2, z0, "air");
    g.set(x, 2, z1 - 1, "air");
    g.set(x, 8, z0, "air");
    g.set(x, 8, z1 - 1, "air");
  }
}

function chimney() {
  const [x0, x1] = [7, 9], [z0, z1] = [5, 7];
  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      for (let y = 5; y < 13; y++) {
        g.set(x, y, z, "bricks");
      }
    }
  }
}

function porch() {
  const [x0, x1] = [15, 19], [z0, z1] = [11, 14];
  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      g.set(x, 1, z, "oak_log");
      g.set(x, 2, z, "oak_log");
      g.set(x, 3, z, "oak_slab");
    }
  }
}

function potager() {
  for (let x = 21; x <= 39; x++) {
    g.set(x, 1, 3, "stone_brick_wall");
    g.set(x, 1, 27, "stone_brick_wall");
  }
  for (let z = 3; z <= 27; z++) {
    g.set(21, 1, z, "stone_brick_wall");
    g.set(39, 1, z, "stone_brick_wall");
  }

  for (let z = 3; z < 27; z++) {
    g.set(30, 1, z, "gravel");
  }
  for (let x = 21; x <= 39; x++) {
    g.set(x, 1, 15, "gravel");
  }

  const beds = [
    [[24, 27], [6, 9]],
    [[24, 27], [11, 14]],
    [[24, 27], [19, 22]],
    [[24, 27], [24, 27]],
    [[33, 36], [6, 9]],
    [[33, 36], [11, 14]],
    [[33, 36], [19, 22]],
    [[33, 36], [24, 27]],
  ];

  for (let [[x0, x1], [z0, z1]] of beds) {
    for (let x = x0; x <= x1; x++) {
      g.set(x, 1, z0, "dark_oak_fence");
      g.set(x, 1, z1, "dark_oak_fence");
    }
    for (let z = z0; z <= z1; z++) {
      g.set(x0, 1, z, "dark_oak_fence");
      g.set(x1, 1, z, "dark_oak_fence");
    }
    for (let x = x0 + 1; x < x1; x++) {
      for (let z = z0 + 1; z < z1; z++) {
        g.set(x, 1, z, "farmland");
        if ((x + z) % 2 === 0) g.set(x, 2, z, "wheat");
      }
    }
  }

  g.set(30, 1, 15, "crafting_table");
}

function shed() {
  const [x0, x1] = [29, 33], [z0, z1] = [23, 27];

  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      g.set(x, 1, z, "oak_log");
      g.set(x, 2, z, "oak_log");
      g.set(x, 3, z, "oak_slab");
    }
  }
  g.set(x0, 2, 24, "oak_door");
}

function arch() {
  g.set(29, 1, 11, "oak_fence_gate");
  g.set(31, 1, 11, "oak_fence_gate");
  g.set(30, 2, 11, "oak_trapdoor");
}

function lanterns() {
  g.set(21, 2, 3, "lantern");
  g.set(39, 2, 3, "lantern");
  g.set(21, 2, 27, "lantern");
  g.set(39, 2, 27, "lantern");

  // Gate lanterns
  g.set(29, 2, 12, "lantern");
  g.set(31, 2, 12, "lantern");

  // Porch lanterns
  g.set(15, 3, 11, "lantern");
  g.set(17, 3, 11, "lantern");
}

function coldFrame() {
  // Cold frame: x: 34-37, z: 20-23
  for (let x = 34; x <= 37; x++) {
    g.set(x, 1, 20, "dark_oak_log");
    g.set(x, 1, 23, "dark_oak_log");
  }
  for (let z = 20; z <= 23; z++) {
    g.set(34, 1, z, "dark_oak_log");
    g.set(37, 1, z, "dark_oak_log");
  }

  // Glass roof
  for (let x = 35; x < 37; x++) {
    for (let z = 21; z < 23; z++) {
      g.set(x, 2, z, "glass_pane");
    }
  }
}

function flowers() {
  // Flower pots on support blocks near fence
  const flowerSpots = [[22, 5], [22, 25], [37, 5], [37, 26]];
  for (let [x, z] of flowerSpots) {
    g.set(x, 1, z, "grass_block");
    g.set(x, 2, z, "potted_red_mushroom");
  }
}

house();
chimney();
porch();
potager();
shed();
coldFrame();
arch();
lanterns();
flowers();

g.save("/Volumes/ext1/swe/repos/mc-design-eval/benchmarks/plugin-baseline/runs/build-1/farmhouse-lean/build.nbt");
console.log(JSON.stringify({ saved: "build.nbt" }));
