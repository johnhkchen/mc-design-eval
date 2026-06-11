# roof-diff — church (reconstructed)

Band floor 14; regions {"ridge":18,"ends":4,"slopes":20,"eaves":6}

| view | IoU | mismatch px | top region (px) |
|---|---|---|---|
| +x+z (45°) | 0.896 | 778 (extra 701 / missing 77) | unpartitioned 646 |
| +x-z (135°) | 0.946 | 391 (extra 126 / missing 265) | unpartitioned 200 |
| -x-z (225°) | 0.922 | 756 (extra 391 / missing 365) | wall 590 |
| -x+z (315°) | 0.865 | 1155 (extra 590 / missing 565) | unpartitioned 567 |

Cross-azimuth: 3080 px, roof share 53.214%, worst view -x+z.

- **gable-roof-3-roof-7** ridge Δ(eave-rel) rmse 4.228 max -12.137; rakes: lo@-7 (unfitted) rmse 10.573, hi@1 (unfitted) rmse 0.872

Reproducible: byte-identical ×2 (sha256 538fb8d05b21…).
