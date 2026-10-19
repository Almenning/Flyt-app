# Læria: Finn ordene – arbeidslogg 18.10.2026

## Låst mål
En egen illustrert, levende **Finn ordene**-aktivitet i norskfaget, ved siden av dagens bokstav-Ordjakt.
Barnet ser seks ord, leter etter tilhørende gjenstander i Bokskogen og trykker direkte på dem.
Ingen ordetiketter skal være forhåndsplassert oppå svarene. Lek og oppdagelse skal være viktigere enn quiz.
Det skal alltid være barnets faktisk valgte rev som veileder, reagerer, gir hint og feirer.

## Implementert på isolert branch
feat/laria-find-words-picture-hunt-20261018

- laer-litt-mer/find-the-words.js: Egen, isolert spillmotor og dialog med 8 interaktive gjenstander, seks ord per runde, tre ordsett, forsiktig tilbakemelding på funn/distraktorer, to-trinns hint, opplesning på forespørsel, gjenopptakelse etter omlasting og fullføringsregistrering uten å berøre eksisterende Ordjakt-data.
- laer-litt-mer/find-the-words-scene.svg: Ny original illustrasjon av skogen, sol, tre, telt, vann, rev, sekk, båt og fugl, med korrekt plasserte interaktive HTML-trykkfelt uten svartekst i selve bildet.
- laer-litt-mer/find-the-words.css: Egen stil med enkel ordliste, illustrasjonen som hovedflate og levende personlig rev. Responsiv mobil og iPad; tastaturfokus og redusert bevegelse.
- laer-litt-mer/index.html: Last inn to nye filer uten å endre Ordjakt.
- laer-litt-mer/laria-navigation-v13.js og .css: Tilgjengelig fra Utforsk med egen knapp «Finn ordene i bildet» under de fire godkjente eksisterende kortene. Bevarer nøyaktig fire originalkort og deres ruter.
- laer-litt-mer/sw.js: Ny versjon av cache for oppdaterte ressurser.
- tests/laria-find-the-words.playwright.js: WebKit/Chromium-test av valg, ekte interaksjoner, seks funn, distraktorer, hint, valgt rev, fullføring, gjenopptakelse, retur og regresjonstest av fem opprinnelige Ordjakt-tema.
- .github/workflows/laria-find-the-words.yml: Egen CI-jobb på PR som bruker ekte Chromium/WebKit på iPhone- og iPad-størrelser og lagrer skjermbilder.

## Gjennomført kontroll
- Alle nye JS-filer og endret navigasjon er syntaktisk kontrollert i JavaScript-parser.
- Nye referanser til JS og CSS forekommer én gang i HTML.
- Den opprinnelige firekorts Utforsk-matrisen er beholdt uendret.
- Illustrasjonsfilen og script er koblet til appen. Ingen eksisterende appfiler er slettet.
- Ingen påstand om full premiumkvalitet eller publisering før ekte browser-/visuell QA.

## Kvalitetsport før publisering
1. Åpne PR mot main og kontrollere relevant GitHub Actions-resultat.
2. Test valgt jenterev/guttrev og alle seks funn i faktisk Chromium og WebKit på iPhone, liten iPhone og iPad stående/liggende.
3. Inspiser reelle skjermbilder: tydelige ord og gjenstander, relevant hit-testing, ingen skjulte kontroller eller horisontal overflow, ingen dekning av personlig rev. Prioriter estetisk nærhet til godkjent «Finn ordene»-illustrasjon.
4. Kontroller at klassisk Ordjakt fortsatt viser fem temaer og at nylig oppdatert SuperKlode og andre spill er uendret.
5. Først etter grønne tester, visuell kontroll og avklart samordning med oppdateringer på main: merge, Pages-verifisering og publisering.
6. Automatiseringsoppgaven «Læria Finn ordene» fortsetter hver time, dokumenterer reell fremgang og deaktiveres bare når kravene er oppfylt og publisering er kontrollert.

## Etterfølgende arbeid / bevisste begrensninger
Første runde har én original illustrert hovedscene med tre sett ord. Flere særegne miljøer, kvalitetskontroll av lys/skygge og mer variert animasjon er neste premiumiterasjon. Eksisterende lærerdata, reiser, samlebok og andre funksjoner er ikke endret. Verken brukerens eller barnets navn står i kode/asset.

## Kontroll og layoutretting 19.10.2026
- Verifisert PR #189 som draft på head f4249dc5130d86d9f828be10e7dee63380af1d96 ved oppstart.
- GitHub Actions «Laria Finn ordene WebKit» #39167360576 på dette hodet: SUCCESS. «Laria QA» #39167360631: SUCCESS. Øvrige undersøkte kontroller var grønne bortsett fra separat «Laria Dual Globes Release QA» #39167360735.
- Hentet og faktisk åpnet skjermbildene fra Actions-artefakt #12151242748 (WebKit iPhone 390x844, liten iPhone 320x568, iPad 820x1180, iPad liggende 1180x820 og Chromium iPad liggende).
- Visuell inspeksjon: iPad 820x1180 hadde en for liten tospaltet illustrasjon (omtrent 520x310) og mye ubrukt plass under. iPhone 390x844 kunne også utnyttet vertikalplassen noe bedre; liten iPhone er allerede tettpakket.
- Rettet ren CSS: iPad portrett bruker nå bred illustrasjon og en lesbar ordliste i to rader, fremfor en smal høyre-illustrasjon. Større iPhone portrett får litt mer rom til selve scenen. Ingen endringer i original Ordjakt, reisekart eller SuperKlode.
- Utvidet faktisk WebKit/Chromium-test med kontroll om minst 83 prosent av iPad-bredden for illustrasjonen, minst 32 prosent av høyden og fortsatt synlighet på første skjerm.
- Endringene er committet på den eksisterende PR-grenen. **Siste commit trenger ny eksakt-head CI og nye faktiske skjermbilder før merge**.
- Den separate globe-testen feilet i iPad landskap i verifyOffscreenCountryCard() ved venting i 5000 ms etter at iPhone-testene besto. Feilen stammer fra globetesten og er ikke bevist forårsaket av «Finn ordene». Ikke endre globen i denne PR-en; behandle denne blokkeringen særskilt.

## Avsluttende iPhone-kvalitetssikring 19.10.2026
- Kontrollerte faktisk siste iPad/iPhone-skjermbildepakke fra «Laria Finn ordene WebKit» run 39214621641, artefakt 12169021752, på head e94f59be0910cdc31d108a9722f70fde1be93e7a. Workflow fullført med SUCCESS.
- iPad 820x1180: ordliste i to lesbare rader og stor illustrasjon som fyller den sentrale flaten, uten horisontal avskjæring. iPad liggende: fire originale aktivitetskort er fortsatt adskilt fra den nye scenen; illustrasjonen er stor.
- iPhone 390x844: fant en reell CSS-kaskadefeil: en generell maks 700px-regel overstyrte aspektforholdet til en tidligere, mer spesifikk regel. Den skapte unødvendig luft nederst og en for liten rev.
- Rettet dette med en målrettet, siste media-regel kun for lange iPhone-portretter fra 361px og høyde 750px. Illustrasjonens forventede høyde øker; barnets valgte rev får et større visuelt nærvær. Kompakt iPhone 320x568 endres ikke.
- La inn regresjonskrav om større iPhone-illustrasjon, synlig rev innenfor skjermen samt at knappene for opplesning og ord kan aktiveres uten Javascript-feil.
- **Før publisering:** den nye eksakt-head WebKit/Chromium-runnen må bli grønn og nye skjermbilder inspiseres. Bruk den faktiske siste commit-hashen, ikke tidligere pipeline-resultater.
- Separat Dual Globes-test har feilet på landkort etter 5 sekunder i iPad landskap. Denne PR-en endrer ingen SuperKlode-filer. Opprett separat globefiks ved behov i stedet for å blande endringer.
