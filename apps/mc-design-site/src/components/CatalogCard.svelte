<script>
  import { cannonMinutes } from "../data/cannon.js";
  // One catalog entry as a card: thumbnail, number and type, name, block count and cannon time.
  let { e } = $props();
</script>

<a class="card" href={`/catalog/${e.id}/`}>
  <div class="thumb"><img src={e.image} alt={e.name} loading="lazy" width="525" height="525" /></div>
  <span class="eyebrow"><span class="no">No. {e.id.split("-")[1]}</span> · {e.type}</span>
  <h3>{e.name}</h3>
  <span class="spec"><span>{e.blocks.toLocaleString("en-US")} blocks</span> · <span>{cannonMinutes(e.blocks)} min</span></span>
</a>
