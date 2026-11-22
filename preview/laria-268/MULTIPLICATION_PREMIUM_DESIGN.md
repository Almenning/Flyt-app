# Læria: Gangetabellen, låst produkt- og designkontrakt

Oppdatert 8. oktober 2026. Brukerjustering: Utforsk og lek skal vise 10 x 10-tabellen umiddelbart, som første valg. Denne overstyrer den tidligere 12 x 12-illustrasjonen. Designreferanse: seks godkjente illustrasjoner i Laria_Gangetabell_Designpakke.zip (leverte originalbilder). Implementeringsfiler: multiplication-premium-v2.js og multiplication-premium-v2.css.

## Seks skjermer

1. **Oversikt**: Læria-logo, illustrert læringsreise, tre store valgmuligheter med tydelige ulike fargetoner, rev, støttebobler og fire internnavigasjonsvalg.
2. **Øv**: åtte oppgaver, én av gangen; synlige illustrerte like grupper og riktig multiplikasjonsstykke, valgfri forklaring, les-opp, store taktile svarvalg, vennlig respons ved feil, Neste-knapp og øktoppsummering.
3. **Velg tabell**: visuelt rutenett for 1–10, alltid tilgjengelig; anbefalt tabell; ingen låste tabeller. Progresjon må baseres på ulike faktastykker, ikke antall tilfeldige riktige svar.
4. **Utforsk**: 10 x 10-tabellen åpnes automatisk og er første valg. Videre kommer grupper, rutenett, tallinje, bytt plass og mønstre. Endre faktorer 1–10 med store pluss/minus-knapper, se matematisk korrekt visuelt resultat umiddelbart.
5. **10×10-tabell**: standardvisning når Utforsk og lek åpnes. Viser radene og kolonnene 1–10, 100 produkter, eget scrollområde på telefon, sticky rad-/kolonnehoder, valgt felt, multiplikasjonslikning, omvendt rekkefølge og faktorpar innen 1–10.
6. **Min mestring**: dagens aktivitet og faktisk sammenhengende øvingsdager, fremgang per tabell, åpent innhold som aldri låses, opptjente stjerner og vennlige anbefalinger.

## Låst visuell retning

- Premium illustrert 2.5D-eventyrverden med varme kremflater, fersken, brunt, støvet blått og grønt.
- Visuell nærhet til de seks originalillustrasjonene: dybde, håndverkslignende kort, myk naturscene, gylne detaljer og reven som støttende ledsager.
- Bruk eksisterende Læria-grafikk og faktiske kontroller. Ikke ta et screenshot og legg transparente knapper over.
- Egen stil for 1.–2. klasse, som blir strammere på eldre trinn uten å fjerne valgfri utforskning.
- Math-lab er inne i Lærias fagverden, ikke en separat hvit side.
- Universell utforming: semantisk HTML, 44 px+ trykkflater, lesbar kontrast, lydstøtte og statusrespons.
- Responsiv iPhone/iPad, portrett og landskap. Tabellen får eget scrollområde.

## Teknisk og pedagogisk kontrakt

- Behold eksisterende fag- og klodekode.
- Bevar gamle registreringer av fullførte laboppdrag. Nye data bruker samme lagringsnøkkel for mestring som forrige gangetabellversjon og migreres lesbart.
- Repetisjon er alltid frivillig; mestring anbefaler innhold, aldri skjuler.
- Ikke påstå at én økt beviser mestring av en hel tabell.
- Bruk faktisk antall økter og korrekte svar. Ingen oppdiktede stjerner eller låser i progresjonsvisningen.
- Ved avbrutt økt tilbys fortsettelse.

## Verifisering før endelig godkjenning

- Kjør tests/laria-multiplication-premium.playwright.js med Chromium og WebKit for telefon og iPad. Legg ved screenshots for alle seks skjermtyper.
- Utfør visuell gjennomgang opp mot de seks godkjente illustrasjonene. Detaljnivå i original mockup kan kreve flere separate illustrasjonsressurser for full pikselmatch.
- Bevar klode-zoom, fagbanker og eksisterende navigasjon.
- Status skal skille mellom merge/deploy, beståtte tester og visuell designgodkjenning. Ikke marker ferdig basert på kode alene.

## Illustrert grupper v3 (9. oktober 2026)
Godkjent visuelt prinsipp fra illustrasjonene: varme, tredimensjonale eventyrmiljøer, detaljerte kurver og brett, myke kremflater og svarfelt. Tellbare objekter må aldri være en flat bakgrunnsillustrasjon: de må genereres dynamisk av oppgavens faktorer.

- Barnet kan velge jordbær, boller, eventyrsopper eller epler i både Øv og Utforsk → Grupper.
- Nøyaktig a grupper, hver med nøyaktig b illustrerte objekter; ingen dekorativ rekvisitt skal telle som objekt.
- Bytte av motiv endrer aldri regnestykke, svar, stjerner eller lagret fremgang.
- Bruk reelle SVG-elementer som skalerer på iPhone og iPad. Behold 10 × 10-tabellen først i Utforsk.
- Ny visuell kvalitet skal gjennomgås opp mot referanseillustrasjonene, ikke godkjennes bare fordi testene er grønne.


## Premium visuell kvalitetsport v4 (9. oktober 2026)

Dette er implementeringskontrakten for de låste referanseillustrasjonene fra samtalen:
- **3 × 10 på iPhone og iPad** skal vise tre like grupper i **én rad**, med to tellbare rader à fem objekter i hver beholder. Ikke to grupper øverst og én alene nederst.
- Jordbær og epler: dybde, flettet kurv, håndtak, naturdetaljer og et avgrenset antall tydelige frukter. Boller: grunne bakerbrett med rutet lin. Eventyrsopper: mose- og trepregede kasser. Ingen identiske kasser uansett motiv.
- Kremfarget oppgavekort, varmt naturlandskap og diskré, ikke forstyrrende dekor. Hver gjenstand er en ekte interaktiv DOM-illustrasjon, ikke del av et statisk bilde som viser feil antall.
- Temaene skal kunne velges uten at regnestykket endres. Valgfrie ulike illustrasjoner varierer automatisk mellom oppgavene.
- Dybde består av adskilte illustrasjonslag (bakre håndtak, liner, tellbare objekter, front av kurv, blomster og nummerplate). Dette må kontrolleres i faktisk Safari-skjermbilde.
- Oppgavenes tall og svar knyttes aldri til selve illustrasjonsfilen. Ingen ekstra frukter eller objekter i dekorative miljølag.
- Test på iPhone og iPad i Safari og Chromium: eksakt 3 × 10-geometri, antall synlige objekter, 44 px+ trykkflater, full 10 × 10-tabell først under Utforsk, beholdt progresjon og fravær av sideveis overflow.

**Kvalitetserklæring:** Automatiske grønne tester bekrefter funksjon, tilgjengelighet og layoutkrav, men ikke fotografisk/pikselmessig identitet med konseptillustrasjonen. Avvik skal opplyses eksplisitt og ikke skjules bak «premium»-navnet.

### Sluttpolering av lesbarhet
På smale skjermer vises «Sopper» i motivvelgeren, med «Velg eventyrsopper» som tilgjengelig navn. Resultatplaten skal bruke mørk brun tekst på lys krem/gull med testet kontrast på minst 7:1 for både regnestykke og svar, uten at tall, antall illustrerte objekter eller 10 × 10-tabellen endres. Et faktisk Safari-skjermbilde skal bekrefte begge deler.
