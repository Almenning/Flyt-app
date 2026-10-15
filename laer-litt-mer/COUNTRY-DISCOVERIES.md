# Landoppdagelser i Læria

## Leveransen

Landkortene bruker en egen innholdsbank, uavhengig av illustrasjonene. Første pakke inneholder 24 land og 72 korte oppdagelser. Dette er **ikke full verdensdekning**: globusens eksisterende landbank inneholder 195 land, og 171 mangler foreløpig redigerte oppdagelser.

Publiserte land: Sveits, Tsjekkia, Norge, Sverige, Danmark, Finland, Island, Storbritannia, Tyskland, Frankrike, Spania, Italia, Egypt, Tsjad, Kenya, Sør-Afrika, Kina, Japan, India, Brasil, USA, Canada, Australia og New Zealand.

For land uten redigert innhold beholdes flagg, hovedstad, verdensdel, innbyggertall, omriss og øving. Overskriften er «Kort om [landet]», ikke «Tre oppdagelser». Det opprettes ikke falske landfortellinger fra en verdensdelmal.

## Datagrunnlag

`country-discoveries-v1.js` inneholder landets undertittel, smakebit, tre oppdagelser og kilder med kontrolldato. Hver oppdagelse har kategori, overskrift, tekst og en konkret referanse. Tekstene er egne, korte formuleringer for barn. Illustrasjonsregisteret inneholder bare illustrasjoner og deres metadata.

`country-discoveries-coverage.json` viser faktisk dekning og alle manglende land-ID-er. Testen stopper tilbakegang i dekning og nye uregistrerte hull. Full lanseringskontroll kan kreves med:

```sh
COUNTRY_REQUIRE_COMPLETE=1 node --test tests/laria-country-discoveries.test.cjs
```

Denne kontrollen skal foreløpig feile: 171 land mangler. En grønn teknisk test betyr ikke at hele verdens innhold er ferdig.

Sveits og Tsjekkia har fått offline-befolkning fra Verdensbankens SP.POP.TOTL-serie for 2024. Verdier, kilde-URL og kontrolldato ligger i `country-population-sources-2024.json`. Eksisterende nettbaserte befolkningsoppdatering beholdes. Tall uten kjent år merkes som eldre anslag, ikke som oppdaterte tall.

## Opplesning

«Les opp» bruker nettleserens taletjeneste, som de eksisterende oppgavene. Ingen ny stemmeleverandør, API-nøkkel eller abonnementsavhengighet er lagt til. Stemme og uttale avhenger av enheten; dette er ikke en ny eller ferdig innspilt Magnus-/ElevenLabs-stemme.

Opplesningen starter bare etter et trykk, leser én oppdagelse om gangen, markerer den som leses og kan stoppes. Landbytte, navigasjon, skjult side og sideavslutning stopper lesingen. Gamle avbrutte hendelser får ikke starte en ny lesekø. Manglende talestøtte eller feil meldes uten å sperre lesing og øving. Automatisk testing bruker en kontrollert talemodell; faktisk norsk uttale må også lyttes til på iPhone/iPad.

## Visning og uendret funksjonalitet

Oppdagelsene er hovedinnhold. Grunnfakta vises mer kompakt, og kildene ligger i en lukket seksjon for voksne. Siden kan rulles; brødteksten i oppdagelsene skal være minst 16 CSS-piksler. «Øv på landet» skal være tilgjengelig med vanlig rulling, ikke presses inn i første skjermbilde med mindre skrift.

Den valgte reven, eksisterende illustrasjoner, faktiske kartomriss, globusens posisjon, øvingsflyt og læringsdata beholdes. Lesing skal ikke skrive mestring, oppgavesvar eller fremgang.

## Kvalitetskontroll

```sh
node --test tests/laria-country-discoveries.test.cjs
node tests/laria-country-discoveries.playwright.js
node tests/laria-country-detail-premium.playwright.js
```

Innholdstesten kontrollerer struktur, kilder, unik tekst, land-ID-er, dekning, innkobling og cacheversjon. Nettlesertesten dekker Sveits/Tsjekkia, manglende landinnhold, valgt rev, store trykkflater, horisontal overløp, kilder, talestøtte, avbrudd, bevart globus og øving. Eksisterende landvisningstest kontrollerer Egypt/Tsjad, illustrasjoner, konturer og navigasjon. Skjermbilder lagres som CI-artefakter.

Ingen ny aktivitet, mørk modus, nye kartkontroller, oppgavetype eller belønningssystem inngår i endringen.
