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
- Opprinnelig låst fil: `laria-home-locked-tablet.png`
- Opprinnelig dimensjon: 1127 × 681
- Opprinnelig PNG SHA-256: `90c9e102ea84d24b954c6522062017bc1cdd9964a398d3cb37c7fa0203df65c7`
- Produksjonsmaster: `laer-litt-mer/assets/home-v15/kjosnes-home-tablet.webp`
- Produksjonsdimensjon: 1127 × 681
- Produksjons-WebP SHA-256: `246edc1572d652af5c3ebf452be60db0b2f842b6afd9fd27529c04145bdf38e5`
- WebP-en er gjenopprettet i 1127 × 681 fra den godkjente høyoppløste kilden og lagret med WebP q100. 760 × 459-versjonen ga synlig uskarp oppskalering. Fjellform og komposisjon skal ikke endres.
- Kvalitetsregel: liggende tablet-/desktop-master skal aldri være lavere enn 1127 × 681. Safe-area-fyll skal ikke lages ved å blure eller duplisere masterillustrasjonen.
- Portrettregel: mobil/iPad-portrett skal vise hele bredden av den låste phone-masteren uten side-crop. Fagkort eller navigasjon skal aldri kuttes i høyre/venstre kant.

### Mobil / stående
- Opprinnelig låst mockup: `laria-home-locked-phone.png`
- Opprinnelig dimensjon: 354 × 733
- Opprinnelig SHA-256: `10bc123ab007c9119a73236fc981befc8d157d7df0cca580f3c6a7da706ff053`
- Produksjonsmaster: `laer-litt-mer/assets/home-v15/kjosnes-home-phone.webp`, ren crop uten telefonramme/notch
- Produksjonsdimensjon: 340 × 641
- Produksjons-WebP SHA-256: `0d804d147dc38d259c13757522907f953488f0b40dea298a8efc06055427c8f7`
- Cropen endrer ikke fjellform, fjord, troll eller innhold; den fjerner kun mockupens fysiske telefonramme og ytre marg.

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
