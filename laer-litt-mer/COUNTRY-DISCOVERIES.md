# Landoppdagelser i Læria

## Innholdspakke 20261015.2

Landkortene bruker en egen innholdsbank, uavhengig av illustrasjonene. Banken inneholder nå **57 land og 171 korte oppdagelser**. Alle **45 land i appens eksisterende Europa-gruppe** har tre oppdagelser hver. De 33 nye landene gir 99 nye oppdagelser; de første 24 landenes innholdsobjekter er uendret.

Dette er **ikke full verdensdekning**. Av appens 195 land mangler fortsatt **138** redigerte oppdagelser. Tallene beskriver appens eksisterende landbank og inndeling, ikke en ny definisjon av Europas grenser eller hvilke områder som er selvstendige stater. Ingen land, land-ID-er eller verdensdelstilknytninger er endret.

De nye landene er Albania, Andorra, Østerrike, Belarus, Belgia, Bosnia-Hercegovina, Bulgaria, Kroatia, Kypros, Estland, Hellas, Ungarn, Irland, Latvia, Liechtenstein, Litauen, Luxemburg, Malta, Moldova, Monaco, Montenegro, Nederland, Nord-Makedonia, Polen, Portugal, Romania, Russland, San Marino, Serbia, Slovakia, Slovenia, Ukraina og Vatikanstaten.

Første pakke omfattet Sveits, Tsjekkia, Norge, Sverige, Danmark, Finland, Island, Storbritannia, Tyskland, Frankrike, Spania, Italia, Egypt, Tsjad, Kenya, Sør-Afrika, Kina, Japan, India, Brasil, USA, Canada, Australia og New Zealand.

For land uten redigert innhold beholdes flagg, hovedstad, verdensdel, innbyggertall, omriss og øving. Overskriften er «Kort om [landet]», ikke «Tre oppdagelser». Manglende innhold fylles ikke med fortellinger fra en verdensdelmal.

## Datagrunnlag og kilder

`country-discoveries-v1.js` inneholder undertittel, smakebit og tre oppdagelser per land. Hver oppdagelse har kategori, overskrift, tekst og en konkret kilde med kontrolldato. Formuleringene er korte og skrevet for barn. Kildene er blant annet UNESCO, museene og institusjonene som forvalter stedene, og offisielle turistkontorer. Tekstene beskriver konkrete steder og tradisjoner, ikke hva alle mennesker i et land er eller gjør.

Eksempler fra Europapakken er planetariet i stuetaket i Franeker, broderte frimerker i Liechtenstein, aragonittformasjoner i Slovakia, skilpaddebehandling i Monaco og eggdekorering med voks i Ukraina. Kildereferansen ligger ved hver enkelt oppdagelse i banken. Illustrasjoner og deres metadata ligger fortsatt separat.

`country-discoveries-coverage.json` inneholder nøyaktig dekning, samtlige manglende land-ID-er og regional status. Testene krever at rapporten stemmer med innholdet. De krever dessuten at den eksisterende Europa-gruppen fortsatt består av de samme 45 land-ID-ene, og at alle har innhold. En kontrollsum beskytter de første 24 landenes innholdsobjekter mot utilsiktet endring.

Full verdensdekning kan kreves med:

```sh
COUNTRY_REQUIRE_COMPLETE=1 node --test tests/laria-country-discoveries.test.cjs
```

Denne kontrollen skal fortsatt feile: 138 land mangler. En grønn teknisk test betyr ikke at hele verdens innhold er ferdig.

Sveits og Tsjekkia beholder offline-befolkning fra Verdensbankens SP.POP.TOTL-serie for 2024. Verdier og kilder ligger i `country-population-sources-2024.json`. Europapakken endrer ingen befolkningstall. Tall uten kjent år merkes fortsatt som eldre anslag.

## Opplesning og valgt rev

«Les opp» bruker nettleserens taletjeneste. Ingen ny stemmeleverandør, API-nøkkel eller abonnement er lagt til. Stemme og uttale avhenger av enheten; dette er ikke en ferdig innspilt Magnus-/ElevenLabs-stemme.

Lesing starter bare etter et trykk. En oppdagelse leses om gangen og markeres mens den leses. Landbytte, navigasjon, øving, skjult side og sideavslutning stopper lesingen. Gamle avbrutte hendelser skal ikke starte en ny lesekø. Feil eller manglende talestøtte skal ikke sperre lesing og øving. Automatiske taletester bruker en kontrollert talemodell; faktisk norsk uttale må lyttes til på fysiske enheter.

Den valgte, låste reven brukes fortsatt gjennom `LARIA_FOX.worldSource(LARIA_FOX.choice())`. AI-genererte konseptbilder er ikke produksjonsskjermbilder og erstatter ikke revefigurene eller eksisterende landillustrasjoner. Europapakken legger ikke til nye illustrasjoner.

## Visning og mellomlagring

Oppdagelsene er hovedinnhold. Grunnfakta vises kompakt, og kildene ligger i en lukket seksjon for voksne. Siden kan rulles. Brødtekst i oppdagelsene skal være minst 16 CSS-piksler, og øvingsknappen skal kunne nås uten å krympe teksten.

Serviceworkerens cacheversjon har fått suffikset `-discoveries1-europe2`. Når landbanken mangler i den nye appcachen, blir nettleserens separate HTTP-cache revalidert. Senere lesing bruker appcachen som før, også uten nett når dataene allerede er lagret. Dette er ikke en påstand om at hele appen virker uten nett fra en helt tom enhet.

Kartgeometri, globusposisjon, oppgaver, fremgang, svarhistorikk, personopplysninger og lagringsskjema er uendret. Ingen ny aktivitet eller belønningsmekanisme inngår.

## Kvalitetskontroll

```sh
node --check laer-litt-mer/country-discoveries-v1.js
node --test tests/laria-country-discoveries*.cjs
node tests/laria-country-discoveries.playwright.js
node tests/laria-country-detail-premium.playwright.js
```

Innholdstestene kontrollerer kilder, lengde, unik tekst, uendrede førstegangsdata, land-ID-er, full Europa-dekning og nøyaktig oversikt over resten av verden. Taletestene leser de tre riktige tekstbolkene for alle 57 land og kontrollerer samtlige 195 renderingsstier. Cachetestene kontrollerer revalidering, offline-lesing, feil og at uvedkommende cacher ikke slettes.

Nettlesertesten kontrollerer Sveits og Tsjekkia, samt nye tekster for Nederland, Liechtenstein og Bosnia-Hercegovina på seks WebKit-/Chromium-oppsett. Alle 45 europeiske land gjennomløpes i Chromium med ekte landrenderer og valgt rev. Land uten innhold testes med Afghanistan. Eksisterende landvisningstest beholder kontrollene for Egypt/Tsjad, illustrasjoner, omriss og øving.

Skjermbilder, en kopi av den nøyaktig testede innholdsbanken og maskinlesbar Europa-kontroll lagres i den eksisterende CI-artefakten. Kontroller må være grønne og relevante skjermbilder gjennomgått før sammenslåing. Denne dokumentasjonen beskriver testkravene; faktiske testresultater dokumenteres i PR og Actions.
