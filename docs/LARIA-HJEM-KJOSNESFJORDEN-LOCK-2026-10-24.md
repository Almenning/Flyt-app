# Læria Hjem v15 – låst Kjøsnesfjorden / Grovanova

Dato: 2026-10-24

## Status

Denne filen er den visuelle kontrakten for ny Hjem-retning.

Eksisterende produksjons-Hjem er bevart i:
`backup/laria-home-before-new-visual-2026-10-24`

Aktiv utviklingsgren:
`feat/laria-home-kjosnesfjorden-troll-20261024`

## Ufravikelig geografisk regel

Kjøsnesfjorden/Grovanova skal bruke den låste fjellformen fra de godkjente masterbildene.
Fjellsilhuetten skal ikke regenereres, erstattes av Eggenipa eller «forbedres» av en ny AI-generering.

## Låste masterfiler

### iPad / liggende
- Fil: `laria-home-locked-tablet.png`
- Dimensjon: 1127 × 681
- SHA-256: `90c9e102ea84d24b954c6522062017bc1cdd9964a398d3cb37c7fa0203df65c7`

### Mobil / stående
- Fil: `laria-home-locked-phone.png`
- Dimensjon: 354 × 733
- SHA-256: `10bc123ab007c9119a73236fc981befc8d157d7df0cca580f3c6a7da706ff053`

### Låst trolltrio
- Fil: `laria-troll-trio-transparent-v3.png`
- Dimensjon: 443 × 431
- SHA-256: `1e2ab79d4b53e09233ab95bdcc1947501a85c47803e282a73ac8b92ef2688cc9`

## Produktretning

- Hjem er visuelt forankret i Kjøsnesfjorden.
- De tre småtrollene erstatter reven på Hjem.
- De fire fagverdenene beholdes: Bokskogen, Tallenga, Ordlandsbyen og Nordlysleiren.
- «Fortsett reisen» er primær handling.
- Hovednavigasjonen beholdes funksjonelt.
- Eksisterende progresjon og aktivitetstilstand skal ikke nullstilles eller omskrives av redesignen.
- Andre skjermer beholder foreløpig eksisterende rev/logikk til de redesignes eksplisitt.

## Teknisk sikkerhetsregel

`home-kjosnes-v15.js` aktiverer ny Hjem-visning bare når riktig masterasset kan lastes.
Hvis assetet mangler eller feiler, skal dagens Hjem vises uendret.

Dette er med hensikt: en manglende illustrasjon skal aldri gjøre Hjem ubrukelig.
