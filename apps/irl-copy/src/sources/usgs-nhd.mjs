// USGS National Hydrography Dataset, large-scale waterbodies (lakes, ponds, lagoons): public domain, United States.
export default [{
  id: "usgs-nhd", layers: ["water"], name: "National Hydrography Dataset, waterbodies", licence: "Public domain (US Government work)",
  attribution: "U.S. Geological Survey, National Hydrography Dataset", url: "https://www.usgs.gov/national-hydrography",
  covers: (p) => p.country === "US",
  async fetch(place, { box: b }) {
    const q = new URLSearchParams({ geometry: `${b.west},${b.south},${b.east},${b.north}`, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326",
      spatialRel: "esriSpatialRelIntersects", outFields: "GNIS_NAME,FTYPE,AREASQKM", returnGeometry: "true", f: "geojson" });
    // the National Map's servers time out now and then (502, 504): a few tries, backing off
    for (let k = 0; ; k++) {
      const r = await fetch(`https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12/query?${q}`);
      if (r.ok) return { water: await r.json() };
      if (k >= 4 || r.status < 500) throw new Error(`NHD: ${r.status}`);
      await new Promise((ok) => setTimeout(ok, 2000 * 2 ** k));
    }
  },
}];
