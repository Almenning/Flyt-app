# TrollActor 2.0 – kunstport

## Status

**BLOCKED: ikke produksjonsklar.**

Storesøster v2-kandidatene viser en ønsket retning – langt bølgete brunt hår,
lilla hårbånd med blomst, spisse ører og bladantrekk – men de er ikke en
koordinatnøyaktig, sammenhengende lagpakke.

To isolerte genereringsforsøk ble vurdert 20. november:

| Lag | Resultat | Hvorfor avvist som runtime-kunst |
| --- | --- | --- |
| Kropp/bein | Transparent PNG med riktig motivretning | Avviker i volum, malestil og skuldergeometri fra Storesøsters låste ansikt. |
| Hode/hår | Transparent PNG med gjenkjennelige trekk | Feil proporsjon og koordinatrom mot kroppslaget; kan ikke rigges uten synlige skjøter. |

Filene er derfor ikke lagt inn i `assets/trollactor2/storesoster-v2/approved/`,
og kan ikke aktiveres av `trollactor2-layered.js`.

## Hard teknisk port

En fremtidig pakke må ha alle disse verdiene før den kan monteres:

```js
{
  identity: 'storesoster',
  version: 'storesoster-v2-layer-pack-1',
  ownerApproved: true,
  canvas: [2048, 2048],
  assets: { /* alle obligatoriske lag fra approved/-mappen */ }
}
```

Alle lag må dele samme 2048 × 2048-koordinatrom. V1-filene under
`assets/gangemagi-troll/` er fortsatt eneste produksjonsressurs.

## Gjenstående kunstleveranse

En ekte illustratøreksport, ikke AI-utskårne enkeltbilder, må levere:

- kropp/bein, hode/hår, venstre/høyre arm og hårbånd;
- øyne (åpen/blunk), bryn (nøytral/tenke) og munn (nøytral/smil/åpen);
- separat skygge, pivotkart og konturprøve;
- seks iPad-gjennomgåtte tilstander: idle, wave, think, help, celebrate og
  encourage.

Når denne pakken foreligger, kan den eksisterende lagmotoren kobles til en
Grovanova-demo uten å endre den låste bakgrunnsillustrasjonen eller barnets
valgte troll/progresjon.
