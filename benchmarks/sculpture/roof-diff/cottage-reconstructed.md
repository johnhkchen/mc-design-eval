# roof-diff — cottage (reconstructed)

Band floor 14; regions {"ends":67,"slopes":285,"eaves":34,"ridge":89}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.924 | 750 (extra 269 / missing 481) | wall 309 |
| +x-z (135°) | 0.893 | 1208 (extra 961 / missing 247) | wall 375 |
| -x-z (225°) | 0.947 | 545 (extra 412 / missing 133) | wall 192 |
| -x+z (315°) | 0.942 | 613 (extra 251 / missing 362) | wall 293 |

Cross-azimuth: 3116 px, roof share 62.484%, worst view +x-z.

- **gable-roof-0-roof-4** ridge Δ(eave-rel) rmse 0.926 max -1.676; rakes: lo@-14 rmse 2.052, hi@13 rmse 1.655
- **gable-roof-2-roof-3** ridge Δ(eave-rel) rmse 1.064 max -1.401; rakes: lo@-1 (unfitted) rmse 0.812, hi@11 rmse 0.83

Reproducible: byte-identical ×2 (sha256 cbbdde2f2a41…).
