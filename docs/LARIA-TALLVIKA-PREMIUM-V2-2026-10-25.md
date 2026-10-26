# Læria / Tallvika V2 – visuell rekonstruksjon (draft)

Dato: 25.10.2026. Baseline: produksjon etter PR #222, commit `32ea548`.

## Hvorfor endringene er nødvendige

Gjennomgang av faktiske Chromium-/WebKit-bilder av den publiserte Tallvika viser:

1. iPhone: 1672 × 941-originalen krympes til et lite panorama og etterfølges av tre generiske, tekstbaserte knapper. Den beste illustrasjonen i appen mister sin funksjon som navigasjon.
2. iPad stående: fjordbildet er sterkt visuelt, men med en flat «Plassverdi»-stripe og mye ubenyttet skjermplass.
3. iPad liggende: aktiviseringsflatene i hyttene er vanskelige å lese som berørbare; appens generelle navigasjon og den illustrerte verdenen henger dårlig sammen.
4. Skogstrollet er fortsatt en original transparent WebP plassert foran et flatt bakgrunnsbilde. Det er **ikke** et rigget, levende vesen. Målkravet om kvalitetsrik karakteranimasjon kan ikke oppfylles i denne PR-en uten nye malte kildelag.

## Fase 1: tilgjengelige aktivitetshytter

- Den godkjente Tallvika-PNG-en gjenbrukes uendret som *fullstendig*, ukroppet panorama.
- Tre nye illustratede innganger viser utsnitt fra nøyaktig den samme PNG-en. Utsnittene er bare CSS-vinduer, ikke nye eller endrede illustrasjoner.
- Alle hytter er vanlige, semantiske knapper med store trykkflater og fokusmarkering. Ingen ny navigasjons- eller læringsmotor introduseres.
- iPhone stående: tre brede bildefortellinger under hele fjordbildet, ikke generiske tekstkort.
- iPad stående: de tre husene samles i en illustrert rekke under fjordbildet; tydelig «Hvor vil du leke?».
- iPad liggende / Mac: illustrasjonen vises på venstre side med tre aktivitetshytter og frivillig oppdrag til høyre; mindre tomrom og kortere vei til lek.
- iPhone liggende: to kolonner når skjermen er lav, uten å beskjære originalbildet.
- Husenes originale skilt i maleriet bevares. Kun visuelt tydelige, diskrete inngangsmarkører legges over hvert hus i store visninger.
- Aktivitetskortene starter de eksisterende `openMultiplicationLab`, `openFractionLab` og Gangetabell-visningen. «Neste eventyr» forblir frivillig og bruker den samme lagrede progresjonen.
- Skogtrollfiler, klassevalg og progresjon røres ikke. CSS støtter `prefers-reduced-motion`.

## Dette er fremdeles **ikke** premium-godkjent

**Animasjon av skogstroll er utenfor scope.** Den gamle PNG/transparent-WebP-komposisjonen er en midlertidig løsning og skal ikke omtales som fullført rigging. PR #220 og issue #221 dokumenterer mangel på skjult hår-, arm- og klesillustrasjon. Ingen automatisk inpainting, falske lemmer eller hoppende PNG-er skal brukes til å omgå dette.

## Aksept før merge

1. Automatisk kode- og kontraktkontroll samt Chromium og **WebKit** på iPhone 390×844, iPhone liggende, iPad stående og liggende.
2. Verifiser at alle tre illustrerte kort er synlige, min. 90 px høye, har kildetro CSS-bilder, er tastatur-/berørbare og leder til riktig spill.
3. Ingen horisontal overflow, ingen dobbelkopierte malte skilt, ingen beskåret hovedillustrasjon eller mørk legacy-footer.
4. Alle tre originale troll kan velges, byttes og gjenfinnes etter reload. Gammel progresjon og aktuelle oppdrags-ID-er er uendret.
5. Sammenlign **faktiske** nye WebKit-skjermbilder side ved side med produksjon, og vurder spesielt figurens forankring, kontrast, orden i visuell hierarki og barns tilgang på alle tre spillene.
6. Brukergodkjenning av helheten før publisering. Ingen automatisk merge.

## Neste fase

Reell 2D-lagbasert trollpilot (først storesøster) må følge eksisterende kunstkontrakt i issue #221, testes med idle, vinke, tenke, hint og juble i Gangemagi på ekte Safari/WebKit, og først deretter integreres i Tallvika. Navigasjonen skal kunne ta imot TrollActor uten å endre barnets lagrede identitet.

Låst prioritet: bedre barneopplevelse og kvalitetsriktig karakterkunst foran antall funksjoner.

## Fase 2: spillruting og sammenhengende valg (samme draft-PR)

- **Bekreftet feil:** «Gangetabellen» fra Tallvika kalte Gangemagi sin wrapper og forsøkte så å klikke en gammel `.mp-menu-explore`, som ikke finnes i Gangemagi. Dermed åpnet ikke 10 × 10-tabellen pålitelig.
- Ny avgrenset inngang `LARIA_MULT_PREMIUM.openTableFromTallvika()` åpner eksisterende 10 × 10-tabellmotor direkte med `page='explore', mode='table'`. Matematikken og tidligere progresjon endres ikke.
- Ett trykk på «tilbake» fra denne direkte tabellvisningen returnerer til Tallvika. Andre innganger til klassisk gangetabell beholder opprinnelig navigasjon.
- Gangemagi åpner fortsatt jordbærmarkedet, Brøklab sin eksisterende lab. Ingen ekstra bekreftelsesskjerm.
- Illustrerte aktivitetshytter og tilhørende trykksoner på fjordlandskapet har felles markering ved peker- eller tastaturfokus, uten endret bakgrunn eller karakter.
- Hvis tabellen ikke kan åpnes, vises feilmelding på Tallvika fremfor å sende barnet til et annet spill.
- Chromium-/WebKit-regresjon tester tabell med 100 celler, respons (2 × 3 = 6), direkte retur, fortsatt separat Gangemagi og uendret `state.journey`.
- Endret ressursversjon og serviceworker-cache hindrer at eldre motor eller Tallvika-script brukes etter senere publisering.

**Skogstrollene er utenfor denne fasen.** Ingen karakterfiler, rigging eller animasjoner endres; eget arbeid fortsetter i separat tråd og PR #220 / issue #221.

## Fase 3: sammenhengende aktivitetshytter og én returlogikk

- Start fra Tallvika registrerer bare flyktig visningstilstand (aktivt hus, om barnet valgte selve huset eller et aktivitetskort, og scrollposisjonen). Ingen endringer i læringslagring.
- Tilbakeknappen i **Gangemagi**, **Brøklab** og **Gangetabellen** leder tilbake til Tallvika i ett trykk når aktiviteten ble startet der, også når barnet har besøkt en intern side i Brøklab eller den klassiske tabellens «Min mestring». Andre innganger beholder etablerte regler.
- Ved retur gjenopprettes scroll og tastaturfokus på samme inngang, og siste besøkte hytte vises kort som «Sist besøkt». Huset kan spilles på nytt uten venting eller utløsing av nye belønninger.
- «Tallvika / Brøklab» og «Tallvika / Gangetabellen» vises som diskret brødsmule i de eksisterende spilloverskriftene. Gangemagi har allerede sin Tallvika-merking.
- Ingen ekstra overgangsskjerm, automatisk fremdrift, forsinkelser eller helskjermsanimasjon før barnet kan leke.
- Den utvidede Playwright-testen dekker både direkte bilderuter og aktivitetskort, korrekt retur fra interne undermoduser, tilgjengelige returlabels, lagret progresjon, gjenopprettet fokus og scroll, samt at besøksmarkeringen ikke lagres etter reload.

**Karakterutvikling er avgrenset bort**. Ingen troll-/reveillustrasjoner, rigging eller animasjonsfiler berøres.

## Fase 4: presise utsnitt i aktivitetshyttene

En egen kontroll av faktiske WebKit-skjermbilder og originalens geometri viste at Brøklab-kortet skar midt gjennom det malte butikkskiltet; det samme kunne skje for Gangetabellen. CSS-vinduene er derfor flyttet litt ned: Brøklab 80 %, Gangetabellen 75 %. Gangemagi beholder eksisterende fokus på gangestykker/arbeidsbenk. Dette er *kun bildeposisjon*, ikke rekonstruksjon, AI-genererte varianter eller inngrep i det låste originalmotivet. Nye Chromium-/WebKit-skjermbilder må sammenlignes før visuell godkjenning.

## Fase 5: lesbare aktiviteter og mer diskrete innganger (26.10.2026)

Faktiske WebKit-bilder fra PR #223 viste 10–11 px beskrivelser på aktivitetshyttene i liggende visninger og store kremfargede pilmerker som skygget for maleriet. Størrelsene justeres i eksisterende grunn- og breakpointregler: minst 12 px beskrivelser og 10 px aktivitetsetiketter, med litt større forklaring på iPhone. Dekorative huspiler reduseres fra 36 til 30 px, mens trykkflatene fortsatt er de samme store knappene. QA kontrollerer størrelsene direkte i Chromium/WebKit. Ingen illustrasjon, skogstroll eller spillmotor er endret.

Samtidig er Bokskogen-testen korrigert fordi kort iPhone-landskap tilsiktet ruller til gjeldende oppdrag etter 350 ms. Testen verifiserer nå kartets dokumentposisjon og at oppdraget er synlig. Koden for Norsk er uendret. Full Laria QA på eksakt commit gjenstår.


## Fase 6: rent illustrasjonsutsnitt for Gangetabellen (26.10.2026)

En kontroll av **faktiske WebKit-skjermbilder** fra PR #223, commit `3df3d71`, viser at Gangetabellens illustrerte inngang på iPhone liggende og iPad liggende delvis klipper selve husets malte skilt. Dette gir en halv tekstlinje øverst i aktivitetskortet og bryter med kravet om kildetro, ryddig visuell komposisjon.

**Rotårsak:** Kortets brede CSS-bakgrunnsvindu (470–550 %) er for høyt i kildekoordinater; det eksponerer enten det malte «Gangetabellen»-skiltet øverst eller «Neste eventyr»-skiltet nederst. Originalillustrasjonen er korrekt og skal ikke endres.

**Avgrenset rettelse:** Behold original PNG uendret. Bruk et tettere utsnitt av selve regnetavlen på 650 % ved liggende iPad/telefon og 560 % på stående telefon; stående iPad beholder sitt allerede rene 340 %-utsnitt. Skjermbildesimulering direkte fra den originale PNG-en er sammenlignet for alle fire visningsformer. En egen WebKit/Chromium-regresjon måler hvilket vertikalt kildeintervall som faktisk vises og avviser utilsiktet gjensyn av skilt-tekst. Tallvikas CSS-release-URL og serviceworker-cache er revidert for å unngå gammel CSS etter publisering, uten å endre Gangemagis egne godkjente ressursnøkler.

**Kvalitetsport:** Kontrakt/CI og ferske Chromium-/WebKit-skjermbilder på eksakt siste head må være grønne og vurderes. Dette er en **draft-forbedring**, ikke visuell godkjenning og ikke merge/publisering. Skogtrollenes originalfiler, navigasjon, læringsmotorer og lagret progresjon er uendret.


## Fase 7: fjern unødvendig nettleserinstallasjon fra smoke-jobben (26.10.2026)

Publiseringskontrollen ble unødig langsom fordi `pre-demo-smoke.yml` installerte Chromium/WebKit og systemavhengigheter fra eksterne pakkekilder ved hver PR-kjøring. Tallvikas egen grønne `laria-tallvika.yml` bruker allerede den forhåndsbygde `mcr.microsoft.com/playwright:v1.62.1-noble`-containeren, som samsvarer med prosjektets pin `playwright: 1.62.1`.

**Tiltak:** Bruk samme låste container bare for `smoke`-jobben. Erstatt `npx playwright install --with-deps` med en rask sjekk av at begge eksekverbare nettlesere finnes. Behold alle Node-, Basecamp-, nettleser-, edge- og publiseringskontroller, med samme fail-/gatingsemantikk. Pages-bygg- og deploy-jobbene endres ikke.

**Kontroll:** Workflowsyntaks skal gjennom GitHub Actions, og `Continuous smoke checks`, full Laria QA og de øvrige PR-testene må fullføres på den nye siste commiten. Dette er en CI-pålitelighetsforbedring, ikke en påstand om fullført produktgodkjenning. PR #226 berører også samme workflow og krever konfliktavklaring hvis begge senere merges.

**Verifiseringsgrense:** Ingen publisering eller merge som følge av denne endringen uten grønn CI på siste kandidat og låst visuell aksept.


## Fase 8: rydde opprinnelse ved avbrutt spill (26.10.2026)

Oppdaget et navigasjonsavvik i Tallvikas flyktige foreldreruting: `entryContext` og `data-tv-origin` ble tidligere bare ryddet ved spillenes synlige Tilbake-knapp. Hvis en aktivitet ble forlatt via annen appnavigasjon, kunne neste uavhengige spillstart derfor feilaktig arve «Tilbake til Tallvika».

**Rotrettelse:** Én observatør per faktisk mattelab rydder bare når den aktive labskjermen deaktiveres uten ordinær Tallvika-retur. Mottar laben ny aktiv tilstand i samme skjermbytte, beholdes konteksten. Ordinær spillintern navigasjon og Tilbake-flyt påvirkes ikke. For direct Gangetabell resettes også `data-mp-direct-tallvika`. Ingen endringer i læringsmotorer, lagring eller figurkunst.

**Regresjon:** Ekte WebKit i liggende iPad-viewport simulerer at barnet forlater både Gangemagi og Brøklab via appnavigasjon, starter dem igjen uavhengig og kontrollerer at det gamle Tallvika-returmålet ikke gjenoppstår. Alle tidligere 8 nettleser-/lagrings-/returkontroller beholdes. Tallvika-scriptets ressursversjon og serviceworker-cache er revidert.

**Kvalitetsport:** Fersk QA på siste commit og visuell godkjenning før merge/publisering. Ingen automatisk lansering.


## Fase 9: faktisk regressjonsfeil i kort liggende WebKit (26.10.2026)

**Publiseringsstopp:** Full `Laria QA` feilet på commit `7fc737b`, job `121425295827`, i `tests/laria-responsive-phasea-bokskogen.playwright.js:66`. Bokskogens oppdragsmarkør ble ikke fullt synlig i WebKit 844×390 etter én 350ms automatisk scroll. Det samme skjedde i `Continuous smoke checks`, men nettlesersuiten hadde `continue-on-error: true`, slik at smoke-jobben feilaktig ble rapportert grønn.

**Rotrettelse:** `bokskogen-world.js` beholder eksisterende 350ms startscroll, men kontrollerer faktisk synlighet etter layout på korte liggende skjermer. Hvis markøren ligger utenfor visningsområdet, justeres scroll mot sentrum med to avgrensede etterkontroller og WebKit-støttet `scrollIntoView` ved behov. Bare aktiv Bokskogen-reise justeres, og oppdragsdata, illustrationer og ordinær portrettnavigasjon endres ikke.

**Riktig gate:** `pre-demo-smoke.yml` lar ikke lenger `npm run test:browser` feile uten å stoppe smoke-arbeidsflyten. Den tidligere konkrete feilen var reproduserbar i full QA **og** smoke; det var ikke grunnlag for å kalle alle kvalitetskontroller grønne.

**Diagnostikk:** WebKit-testen beholder sitt opprinnelige strenge synlighetskrav, og logger ved feil både `scrollY`, dokumenthøyde, viewport, om gjeldende stopp finnes og reell stopplassering. Skjermbilde lagres ved feil. Slik skjules ingen layoutfeil bak en høyere timeout.

**Videre kvalitetsport:** Ingen merge eller publisering før alle relevante arbeidsflyter faktisk er grønne på samme siste commit og visuell godkjenning foreligger. Ingen troll-/Gangemagi-/mattemotorfiler er endret.
