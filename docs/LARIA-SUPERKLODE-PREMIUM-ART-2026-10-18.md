# Læria SuperKlode – premium art-pass

Dato: 18. oktober 2026  
Gren: `feat/laria-superglobe-premium-art-20261018`  
Draft-PR: #184  
Base: SuperKlode v3 / PR #179

## Formål

Gjøre Oppdag til en geografisk korrekt, malt oppdagelsesverden i stedet for en flat kartflate med pålagte naturikoner. Enkel-globusen skal være urørt.

## Implementert

1. Oppdag bruker nå den georefererte terrengmodellen som primært uttrykk.
2. Brede separate biomestrøk er tatt ut av tegneløkken.
3. Store landbaserte fjell-, skog- og landmarkstempler er tatt ut av tegneløkken.
4. Terrengdekningen og biomeblandingen er økt, slik at natursonene bærer landflatene i stedet for kontinentfarge alene.
5. Bakgrunnen dempes bare når `data-discovery-globe="painted-atlas-v1"` er aktiv. Kloden får en roligere atmosfærisk ramme og sterkere dybdeskygge.
6. Statisk regresjonstest sperrer retur til de fjernede dekorstemplene.

## Låst retning – kontinenter først

Oppdag er nå bevisst avgrenset til en levende kontinentopplevelse i første
versjon. Enkel beholder den eksisterende presise land- og detaljzoomen.

1. Oppdag stopper på `1.72` i zoom, også ved kniping, musehjul, knapper,
   søk og programmatisk landfokus.
2. Oppdag åpner ved Europa (`13° øst, 53° nord`) i stedet for den generiske
   Tsjad-demonstrasjonen fra det gamle premiumskallet. Dette endrer ikke
   lagret fremgang; det gjelder kun startkomposisjonen i Oppdag.
3. Før valg av land vises et kort «Europa venter» med den faktisk valgte
   reven og en handling som vender kloden mot Europa.
4. De første detaljerte oppdagelsesområdene er Europa/Norge, Amazonas,
   Sahara, Japan og Arktis. Ingen av dem erstatter landpolygoner eller
   geografisk trefftesting.
5. Europa/Norge har nå de første særpregede, georefererte terrengkorridorene:
   norske fjordskoger, alpine daler og middelhavsåser. Scandes og Alpene får
   en sparsom fjellrygg også på oversiktsnivå. Dette er bevisst avgrenset til
   første kontinent, ikke en generell retur til dekorative fjellstempler.
6. Det gamle, generiske revebildet skjules i Oppdag. Invitasjonskortet bruker
   i stedet barnets faktisk valgte rev.
7. Etter at barnet velger et land i Oppdag, blir den samme valgte reven lagt
   inn som en liten, stedstilpasset reaksjon i landkortet. Norge og de første
   Europa-landene får egen tekst; resten får en kort nysgjerrig invitasjon.

## Verifisert

- `node --check laer-litt-mer/discovery-globe-phase1.js` bestått.
- `node tests/laria-discovery-globe-phase1-static.js` bestått.
- `npm run test:node` bestått: 384 tester, 0 feil.
- Enkel, kartgeometri, koordinater, landvalg, zoom, brukerdata og øvrige fag er ikke endret av denne grenen.
- Kontinentgrensen er testet som en isolert Oppdag-regel; Enkel beholder
  `GLOBE_ZOOM_MAX=5`.

## Åpen kvalitetsport

Faktisk WebKit/Chromium-opptak må inspiseres på iPad liggende/stående og iPhone 390 × 844 før merge. Lokalt testmiljø mangler installert Playwright WebKit; installasjonen kunne ikke gjennomføres på grunn av miljøets systemrettigheter og nedlastingsbegrensning. Dette er ikke en godkjenning av visuelt resultat.

18. oktober: den relevante Playwright-røykprøven ble forsøkt på nytt, men
stopper før teststart fordi `chromium_headless_shell` ikke finnes i miljøets
Playwright-cache. Dette er en miljøblokkering, ikke et grønt nettleserresultat.

## Neste vurdering

Når reelle skjermbilder foreligger, vurderes:
- om terrenget er for svakt eller for tett på verden-, region- og nærzoom
- om kortet og valgt land får tydelig nok sammenheng
- om den personlige reven kan få en diskret, faktisk funksjon i oppdagelsesøyeblikket
- særskilt Norge, Alpene, Sahara, Amazonas og Japan.
