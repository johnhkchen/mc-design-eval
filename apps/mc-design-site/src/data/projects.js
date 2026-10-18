// Case studies. Before/after models live in public/models; offsets line the pair up (found by matching blocks).
export const projects = [
  {
    id: "dh-01", code: "DH-01", name: "Polarton", placeholder: true, client: "Antipolar", town: "Dragonholde", status: "Built",
    lede: "A bare hillside west of the village, turned into a terraced working town: gin, smithy and barns by the stream, school, church and houses up on the plateau.",
    before: { src: "/models/dh-01-before.nbt", offset: [0, 0, 0] }, after: { src: "/models/dh-01-after.nbt", offset: [0, 0, 0] },
    poster: "/img/projects/dh01-after.jpg", plan: "/img/projects/dh01-plan.jpg",
    planCaption: "The plan laid over the land: streets following the contours, and a levelled plot for each building.", size: "93 × 90 blocks",
    story: [
      ["The land", "Antipolar exported the hill with Create's Schematic and Quill and sent the file. It climbs from a stream to a plateau, with trees and loose rock all over the slope."],
      ["The plan", "Streets follow the contours. Each plot gets a levelled pad, retaining walls where the hill drops away, and a driveway up from the street. Working buildings sit low by the water; houses and the church sit on the plateau."],
      ["The build", "The terraforming went in as one schematicannon file. The eight buildings, from the town's kit, followed over the top of it. All of it was pasted in survival."],
    ],
    modules: ["polarton-00-cotton-gin", "polarton-01-schoolhouse", "polarton-02-hill-farmhouse", "polarton-03-smithy", "polarton-04-church", "polarton-05-tobacco-barn", "polarton-06-corn-crib-granary", "polarton-07-owners-house"],
  },
  {
    id: "dh-02", code: "DH-02", name: null, client: "Antipolar", town: "Dragonholde", status: "Earthworks planned",
    lede: "The swamp next to Polarton, reclaimed the way the Mississippi delta was: a levee ring, drained polder fields, and a working waterfront.",
    before: { src: "/models/dh-02-before.nbt", offset: [0, 4, 0] }, after: { src: "/models/dh-02-after.nbt", offset: [0, 0, 0] },
    poster: "/img/projects/dh02-after.jpg", plan: "/img/projects/dh02-plan.jpg",
    planCaption: "The plan over the swamp: the levee ring, polder fields and waterfront. Lettered boxes A–H are the cannon sections.", size: "140 × 195 blocks",
    story: [
      ["The land", "After Polarton, Antipolar pointed at the swamp beside it as the next direction to grow. Shallow water, mud and cypress, with a bluff to the south."],
      ["The plan", "A levee ring with a packed-mud core keeps the water out. Inside, the land drains to polder fields, with canals, sluice gates and a raised street of lots. Outside the ring are boardwalks, finger piers, mixed-use buildings, a distillery, a brewhouse, and a boatyard with a dredged channel for shallow-draft barges."],
      ["Where it stands", "The 'after' view shows the planned earthworks, before any buildings. We're re-planning the paste so it takes as few blocks and as little cannon time as possible."],
    ],
    modules: [],
  },
  {
    id: "oak-lake", code: "OL-01", name: "Oak Lake", client: null, where: "a showcase on a vanilla survival landscape", status: "Built",
    lede: "A master-planned lakeside neighbourhood of mail-order houses: a tree-lined boulevard, crescents on the contours, a school, a church plot, a park with fields, trails and docks.",
    before: { src: "/models/oak-lake-before.nbt", offset: [0, 0, 0] }, after: { src: "/models/oak-lake-after.nbt", offset: [0, 0, 0] },
    poster: "/img/projects/oaklake-after.jpg", plan: "/img/projects/oaklake-plan.jpg",
    planCaption: "The master plan: West Avenue as a boulevard, the Lake Drive loop, crescents along the contours, the school grounds, church plot and green, and the park round the lake.", size: "160 × 160 blocks",
    story: [
      ["The land", "An untouched vanilla landscape: oak woods round a small lake, the ground falling to the water on every side. Nothing had been built on it."],
      ["The plan", "Streets climb in half steps only, so every walk from the street to a front door meets the accessible standard. The lake is the park: a shore path, picnic areas, a beach, a boat launch, a fishing pier and a canoe landing, with ball and athletic fields and tennis courts uphill."],
      ["The houses", "Fifteen lots, each holding one of the eight mail-order houses or one of seven colour variants, so no two neighbours match. Every way in was walked and passes."],
    ],
    modules: ["sears-00-magnolia", "sears-01-alhambra", "sears-02-vallonia", "sears-03-puritan", "sears-04-cornell", "sears-05-stanford", "sears-06-winona", "sears-07-craftsman",
      "sears-01-alhambra-b", "sears-02-vallonia-b", "sears-03-puritan-b", "sears-04-cornell-b", "sears-05-stanford-b", "sears-06-winona-b", "sears-07-craftsman-b"],
  },
];
export const projectById = Object.fromEntries(projects.map((p) => [p.id, p]));
