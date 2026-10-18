// DataSF (City and County of San Francisco), all Open Data Commons PDDL (public domain). Socrata SoQL, clipped to the
// place's box with intersects() (within_box keeps only features wholly inside, which drops every long contour line).
const D = "https://data.sf.gov/resource";
const PDDL = "Open Data Commons PDDL 1.0 (public domain)";
const inSF = (p) => p.city === "san-francisco";

async function socrata(id, geom, b) {
  const poly = `POLYGON((${b.west} ${b.north}, ${b.east} ${b.north}, ${b.east} ${b.south}, ${b.west} ${b.south}, ${b.west} ${b.north}))`, features = [];
  for (let off = 0; ; off += 5000) {
    const q = new URLSearchParams({ $where: `intersects(${geom}, '${poly}')`, $limit: "5000", $offset: String(off) });
    const r = await fetch(`${D}/${id}.geojson?${q}`); if (!r.ok) throw new Error(`DataSF ${id}: ${r.status} ${await r.text()}`);
    const j = await r.json(); features.push(...j.features); if (j.features.length < 5000) break;
  }
  return { type: "FeatureCollection", features };
}
const src = (id, layers, name, dataset, geom, shape) => ({
  id, layers, name, licence: PDDL, attribution: "City and County of San Francisco, DataSF", url: `https://data.sf.gov/d/${dataset}`, covers: inSF,
  async fetch(place, frame) { return shape(await socrata(dataset, geom, frame.box)); },
});

export default [
  // 5 ft contours on the San Francisco datum: elevation in feet
  src("sf-contours", ["ground"], "Elevation Contours (5 ft)", "6d73-6c4f", "the_geom", (fc) => ({ ground: { kind: "contours", unit: 0.3048, field: "elevation", ...fc } })),
  // 2010 Pictometry footprints split by parcel, with LiDAR heights: hgt_median_m (roof median above ground), peak_1st_m - gnd_min_m (peak)
  src("sf-buildings", ["buildings"], "Building Footprints (LiDAR heights)", "ynuv-fyni", "shape", (fc) => ({ buildings: { ...fc, features: fc.features.map((f) => ({ ...f,
    properties: { id: f.properties.sf16_bldgid, parcel: f.properties.mblr, height: +f.properties.hgt_median_m, peak: +(+f.properties.peak_1st_m - +f.properties.gnd_min_m).toFixed(1) } })) } })),
  src("sf-streets", ["streets"], "Streets – Active and Retired", "3psu-pn9h", "line", (fc) => ({ streets: { ...fc, features: fc.features
    .filter((f) => String(f.properties.active) === "true" && !/^HWY/.test(f.properties.street))
    .map((f) => ({ ...f, properties: { name: `${f.properties.street} ${f.properties.st_type ?? ""}`.trim() } })) } })),
  // the assessor's roll (latest year): what each parcel's building is. Joined to a footprint by its parcel (block + lot).
  src("sf-parcels", ["parcels"], "Assessor Historical Secured Property Tax Rolls", "wv5m-vpq2", "the_geom", (fc) => {
    const latest = Math.max(...fc.features.map((f) => +f.properties.closed_roll_year || 0)), by = new Map();
    for (const f of fc.features) { const p = f.properties; if (+p.closed_roll_year !== latest) continue;
      by.set(`SF${p.block}${p.lot}`, { type: "Feature", geometry: f.geometry, properties: { parcel: `SF${p.block}${p.lot}`, year: +p.year_property_built || null,
        stories: +p.number_of_stories || null, units: +p.number_of_units || null, construction: p.construction_type ?? null, use: p.use_definition ?? null,
        address: (p.property_location ?? "").replace(/\s+/g, " ").replace(/^0000 0*/, "").replace(/0000$/, "").trim() } }); }
    return { parcels: { type: "FeatureCollection", rollYear: latest, features: [...by.values()] } };
  }),
  src("sf-parks", ["parks"], "Recreation and Parks Properties", "gtr9-ntp6", "shape", (fc) => ({ parks: { ...fc, features: fc.features.map((f) => ({ ...f, properties: { name: f.properties.property_name } })) } })),
];
