// Layer 2 scoring schemes, v2: PRE-REGISTERED 2026-10-10, before the owner's fresh blind labels (labels-2). Do not tune
// these against labels-2; a change after seeing them is v3 and needs labels-3.
// o = L1 observations (ObserveBuild, model; fields: roof_form, roof_overhang, roof_lid, massing, facade_depth, street_door,
//     street_windows, wall_gaps, weathering, props, sign, storeys)
// m = L0 metrics from the .nbt (code; blankWalls, stray, visibleMaterials, detailShare, agedShare, floating, valid)
// Shaky L1 fields (roof_lid: 50% vs Sonnet) carry half weight; counts code can read (blank walls, stray, materials) come from L0.
const amt = { None: 0, Few: 1, Many: 2 };
const strayCost = (n) => (n === 0 ? 0 : n <= 3 ? 0.5 : 1.5);
const aged = (o, m) => o.weathering !== "None" || m.agedShare >= 0.05;

// A build that does not look broken or unfinished to a player walking past.
export const placeable = (o, m) => -1.5 * amt[o.wall_gaps] - strayCost(m.stray) - 1 * o.roof_lid - 1 * Math.min(4, m.blankWalls)
  - 2 * !o.street_door - (m.floating > 0 ? 2 : 0) - (m.valid ? 0 : 5);

// How much building craft shows: composed massing, wall relief, a shaped roof with eaves, openings, detail, material range.
export const crafted = (o, m) => ({ Box: 0, Some: 1, Varied: 2 })[o.massing] + ({ Flat: 0, Some: 1, Deep: 2 })[o.facade_depth]
  + 1 * o.roof_overhang + (["None", "Flat"].includes(o.roof_form) ? 0 : 1)
  + ({ None: 0, OneToThree: 0.5, FourToEight: 1, NineOrMore: 1 })[o.street_windows] + amt[o.props] + 0.5 * o.sign
  + (m.visibleMaterials >= 3 && m.visibleMaterials <= 7 ? 1 : 0) + (m.detailShare >= 0.3 ? 2 : m.detailShare >= 0.15 ? 1 : 0);

// Character over tidiness (the owner: weathering is deliberate style): craft, plus credit for visible age; gaps and
// jutting blocks cost a quarter as much on a weathered build; blank walls cost half.
export const characterful = (o, m) => {
  const soft = aged(o, m) ? 0.25 : 1;
  return crafted(o, m) + (aged(o, m) ? Math.max(amt[o.weathering], m.agedShare >= 0.05 ? 1 : 0) : 0)
    - soft * (1.5 * amt[o.wall_gaps] + strayCost(m.stray)) - 1 * o.roof_lid - 0.5 * Math.min(4, m.blankWalls)
    - 2 * !o.street_door - (m.floating > 0 ? 2 : 0) - (m.valid ? 0 : 5);
};

export const SCHEMES = { placeable, crafted, characterful };
export const VERSION = "v2-2026-10-10";
