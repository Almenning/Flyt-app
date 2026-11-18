# Grovanova iPad-portrett: kontrollert integrering

Status 18. november 2026: **ingen ny portrettkunst er godkjent eller aktivert**.

`home-kjosnes-v15.js` leser bare den sperrede manifestfilen
`assets/home-v15/grovanova-ipad-portrait-master.json`. Den er inaktiv til alle
feltene nedenfor er oppfylt. Dagens SHA-låste telefon-/iPad-bilder er uendret
fallback.

## Hva kunstleveransen må inneholde

| Felt | Krav |
| --- | --- |
| Fil | Egen UI-fri Grovanova-portrettfil under `assets/home-v15/` |
| Kilde | Geografisk korrekt, visuelt godkjent master; ikke AI-konseptbilder |
| Størrelse | Minst 2048 × 2732 px for distribusjonsfilen; arbeidsmaster 3072 × 4096 px anbefales |
| Integritet | SHA-256 for akkurat eksportert fil |
| Innhold | Samme låste Kjøsnesfjorden/Grovanova-identitet, men ingen logo, tekst, skilt, navigasjon, innmalt troll eller annen UI |
| Frisoner | Fire skilt, reise, bunnnavigasjon, vokseninngang, live-hilsen og tre diskrete lys-/vannflater må markeres som normaliserte `[x,y,bredde,høyde]`-ankre |

## Aktiveringsrekkefølge

1. Eier godkjenner den faktiske portrettmasteren visuelt mot den låste kunstspesifikasjonen.
2. Legg den godkjente eksporten til `assets/home-v15/`; behold alle eksisterende mastere.
3. Fyll ut manifestet med `status: 'approved'`, relativ filsti, SHA-256, faktiske pikseldimensjoner og UI-ankergruppene.
4. Ta iPad-portrettskjermbilder og verifiser at kontrollene ligger i frisonene. TrollActor skal fortsatt bli rendret av appen, ikke fra bakgrunnsfilen.
5. Kjør Home-art, iPad, full Læria-QA, smoke og iOS-build på den konkrete filen. Først deretter kan en separat, godkjent PR vurderes.

## Teknisk kontroll før aktivering

- Nettleseren henter kandidatens faktiske bytes, beregner SHA-256 med WebCrypto
  og dekoder den verifiserte Blob-en. SHA-mismatch eller feil pikseldimensjon
  faller tilbake til dagens låste portrettkilde.
- CI kjører samme manifestregler med Node og tester en bevisst merket,
  midlertidig `TEST FIXTURE ONLY`-ressurs. Testressursen ligger aldri i
  `assets/`, kan aldri stå i produksjonsmanifestet og kan ikke forveksles med
  kunstleveransen.
- UI-anker må ha positiv bredde/høyde og ligge fullt innenfor `[0,1]`.
- Ved aktivert master tegnes faktisk SVG-logo, fagskilt, reisehandling,
  bunnnavigasjon og vokseninngang av DOM/CSS; ingen av disse forventes malt i
  bakgrunnsfilen.
- PR #254s separate, dekorative båter er ikke en del av denne porten. Før den
  PR-en eventuelt kombineres med en godkjent portrettmaster, må båtene få egne
  godkjente vann-ankre i samme manifest; ellers skal de ikke vises i aktivert
  portrett.

## Sikkerhetsatferd

Porten kan bare åpnes på iPad i stående orientering. Mangler godkjenning,
filsti, SHA-256, minimumsmål, frisoner eller samsvar mellom registrerte og
dekodede dimensjoner, bruker appen den eksisterende rene, låste
portrett-fallbacken. Liggende iPad og iPhone berøres ikke.
