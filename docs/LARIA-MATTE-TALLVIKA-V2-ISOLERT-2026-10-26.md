# Læria – Matte/Tallvika V2 (isolert fra Norsk)

Dato: 26.10.2026. Utgangspunkt: main `e48affa95a` etter flettet PR #226 (Norsk/Eggenipa).

## Formål
Viderefør den testede visuelle Tallvika V2 og eksplisitt én-trykks ruting mellom Tallvika, Gangemagi, Brøklab og Gangetabellen fra draft PR #223, uten å ta med Norsk/Bokskogen eller utilsiktet overskrive integrert Eggenipa.

## Implementert
- Tallvika med godkjent fjordillustrasjon, tre låste originaltroll som valg, lesbare aktivitetsskilt/-kort og tydelig frilek. Ingen nye figurvarianter.
- Tallvika sitt direkte 10×10 Gangetabellen-inngang går til bordet, ikke Gangemagi eller et ekstra startsjikt.
- Gangemagi, Brøklab og Gangetabellen har eksplisitt parent/return-kontekst til Tallvika, inkludert korrekt fokus/scroll og opprydding hvis barnet forlater aktiviteten en annen vei. Barnets progresjon forblir hos eksisterende motor.
- Tallvika UI-versjoner oppdatert i **den nåværende main-HTML**, uten å fjerne `eggenipa.css` eller `eggenipa.js` fra Norsk. Serviceworker-cache beholder `eggenipa-touchback1` og får en ny Tallvika-versjon.
- Relevante matematikkontrakter og Chromium/WebKit-testene er overtatt fra PR #223. Den eldre testens utdatert frilek-entry er korrigert.

## Avgrensning og kvalitetsport
- Ikke endre Bokskogen, Norsk, Eggenipa, hjemmet eller trollanimasjons-piloten.
- Den tidligere PR #223 er ikke sammenslåingsklar etter Norsk-merge. Denne isolerte grenen er etterfølger for **kun** matematikkarbeid. Behold PR #223 som historisk referanse til erstatteren er validert.
- Mattekontrakten, egen Tallvika WebKit+Chromium QA, Brøklab/Gangemagi, regresjon og iOS må være grønne på eksakt ny commit. Ny bred QA kan avdekke feil utenfor Matte; disse må identifiseres og ikke skjules, men håndteres i rett tråd.
- *Ikke* merge/publiser uten nødvendige kontroller og faktisk visuell godkjenning. Statiske troll er ikke premiumanimasjon og inngår i separat PR #224.


## iPad liggende: helhetlig eventyrscene, 26.10.2026

**Funn i faktisk WebKit 1194×834:** Tallvika-verdenen var ca. 778×438 px i et todelt layout, mens bunnen av skjermen stod ubrukt. De tre illustrerte aktivitetene sto i en høy, smal kolonne på høyre side. Dette er verken en god bruk av iPad-landskap eller en tydelig prioritering av det låste fjordmotivet.

**Løsning, kun Matte:** På nettbrett i liggende format (1000–1400 CSS-px bredde, høyde minst 720) går siden over til et vertikalt komponert oppslag. Hele originalbildet beholdes i 1672:941, men vokser etter tilgjengelig skjermhøyde. Under følger en kort, synlig oppdragsrad: de tre eksisterende illustrerte portalene og det frivillige neste oppdraget. Ingen ekstra aktiviteter, ny kunst, dataendringer eller scrollkrav for å nå de tre valgene. iPad portrett, iPhone og øvrig desktop beholder sine eksisterende løsninger.

**Test:** Den eksisterende Playwright WebKit/Chromium-matrisen utvides med håndfaste første-skjerm-målinger: bildet må være minst 76 % av viewportbredden, ha uendret kildeaspekt, aktivitetene skal ligge på én rad under landskapet og oppdraget skal være synlig på første skjerm. Ved feil skal testen feile, ikke akseptere en kosmetisk CSS-override. Skjermbilder samles fra eksakt commit. Kvalitetsgodkjenning følger etter faktisk gjennomsyn, ikke bare kodeendring.


### Kortlesbarhet i iPad liggende – kontroll mot første skjermbilde

Et faktisk Chromium-bilde fra den nye 1194×834-komposisjonen viste at de to første aktivitetsbeskrivelsene la de siste ordene for tett inntil den overlappende pilknappen. Avviket skyldtes at kortenes tekstkolonne ikke reserverte plass til den absoluttposisjonerte pilen, ikke feil i bildet. Matte-spesifikk rotkorrigering: gi tekstkolonnen styrt fleksbredde og null minimumsbredde, reserver 14px høyresone i beskrivelsen og løft tekststørrelsen til 13px. Ny Playwright-kontroll måler faktisk høyresikker sone og hindrer både tekst-/piloverlapp og klipping ved line-wrap. Ingen spillmotorer, kunst eller andre fag berøres.


### 26.10: Responsiv regresjon for liten og stor iPad i landskap

Den dedikerte Tallvika-matrisen dekket tidligere bare 1194×834. Nå inkluderes **1024×768** og **1366×1024** i både Chromium og WebKit, med de samme spill-, lagrings- og originale bildekontraktene. Sjekken for førsteskjerm (minst 76 % landskapsbredde, alle fire inviterende valg synlige, ingen horisontal eller vertikal unødig scrolling) gjelder nå for samtlige tre nettbrett-størrelser.

**Rotårsak ved mindre bredde:** Gangetabellens foto-vindu bruker et kraftig utsnitt av én og samme malte kildefil. Med uendret 650 % bakgrunn ved 1024 px blir kildeintervallet for høyt og kan vise avkuttede malte skilt. Begrenset, originaltro tilpasning til 780 % for 1000–1160 px holder utsnittet på tavlen. Den eksisterende strenge Playwright-sjekken for kildekoordinater (innenfor 490–815) validerer dette uten å endre originalfilen. Ingen endring i iPhone, Norsk, spillmotorer, troll eller data.

**Status:** Dette er en ny testkandidat. Resultater og ferske WebKit-skjermbilder må kontrolleres på eksakt commit før premiumvurdering.


### 26.10: Ryddet reell WebKit-miljøblokkering for Gangemagi-QA

I `Laria Gangemagi approved Markedsbok visual QA` på `642e409` feilet GitHub-jobb `121533746557` etter tre **beståtte Chromium-visninger** og godkjent matte-/progresjonskontrakt: WebKit MiniBrowser kunne ikke starte fordi systembiblioteket `libicudata.so.74` manglet. Dette er en inkompatibilitet mellom ubestemt `ubuntu-latest`, Playwrights WPE og cache av browser-binarier, ikke en påvist feil i Gangemagis kode.

**Rotrettelse:** Gangemagi-arbeidsflyten bruker nå samme offisielle, versjonslåste Playwright-container `mcr.microsoft.com/playwright:v1.62.1-noble` som den allerede grønne Tallvika-jobben. Stale nettleser-cache og `install-deps` er fjernet; arbeidsflyten sjekker eksplisitt at begge nettlesere finnes, men beholder de opprinnelige seks skjermstørrelsene, åtte oppdrag, Node-testene og bildeopplasting. Ingen spill-/UI-filer, Norsk, originalillustrasjoner eller lagrede data er endret.

**Kvalitetsport:** Krev en ny faktisk grønn WebKit/Chromium-kjøring på samme siste commit. En grønn Tallvika-test alene erstatter ikke denne kontrollen.


### 26.10 – Aktivt, malt «Neste eventyr»-skilt

Den godkjente Tallvika-illustrasjonen inneholder et tydelig, malt skilt med teksten «Neste eventyr» og en pil. Skiltet var imidlertid bare dekor: Barnet kunne trykke på de tre husene, men ikke på det like inviterende oppdragsskiltet. Dette brøt den direkte utforskningsflyten.

**Tiltak:** Legg et transparent, semantisk button-treffområde over skiltet (minst 44×44 CSS-px), tilgjengelig med berøring, mus og tastatur. Det deler eksisterende `data-tv="next"`-ruting med den frivillige oppdragsknappen. Når neste kapittel mangler, er både skilt og knapp deaktivert. Det legges **ingen nye bilder, ikoner, animasjoner eller oppgaver** inn i verdenen. Eksisterende tre hus-knapper berøres ikke.

**QA:** Egen Chromium/WebKit-test på iPhone og iPad måler faktisk treffområde, at skiltet ligger på den nedre høyre delen av originalbildet uten å overlappe Gangetabellen, lik disabled-tilstand og samme mål i den eksisterende matte-rutingen. Eksisterende spill-, lagrings-, returruting- og øvrig QA beholdes. Inntil nye tester er grønne på siste commit er dette ikke klart for merge/publisering.


#### Oppfølgingsrettelse: unikt handlingsnavn (26.10)

Integrert WebKit-QA [run #40313772700](https://github.com/Almenning/Flyt-app/actions/runs/40313772700) avdekket at gjenbruk av `data-tv="next"` på selve bildet brøt den etablerte kontrakten om **én** `[data-tv="next"]` i Tallvika: `locator.isEnabled` fant to elementer. Det var ikke en WebKit-miljøfeil. **Rotrettelse:** Det malte skiltet har nå unikt `data-tv="next-sign"`, mens både `next-sign` og eksisterende `next` går til identisk, frivillig matteoppdrag i samme event-delegering. Den gamle primærknappen og dens automatiske testselektor forblir uendret. Ny Tallvika-test kontrollerer fortsatt at begge innganger fungerer likt, og integrert QA må bli grønn på ny head før merge.

### 26.10 – Full QA: Plukk og tell følger faktisk Tallvika-inngang

`Laria QA` på `e473021` feilet i `tests/laria-pick-play.browser.playwright.js:13` etter at både iPhone og iPad i Chromium hadde bestått alle 10 verdenene, matte, fire oppdrag og lagring. Testen startet med å kalle `window.openMultiplicationLab()` programmatisk og forsøkte deretter å klikke Gangemagis gamle sekundærknapp `[data-gm-action="classic"]` nedenfor mobilens første skjerm; WebKit fikk `locator.click Timeout` før `Plukk og tell` ble nådd. Den godkjente Tallvika-forsiden gir nå en **direkte synlig Gangetabellen-inngang**, og denne gamle, programmatisk åpnede omveien var ikke lenger representativ for barnets hovedflyt.

**Retting:** Den eksisterende omfattende testen åpner nå Matte fra Home, klikker det illustrerte `Gangetabellen`-kortet i Tallvika, og krever umiddelbart aktiv 10×10-tabell med 100 ruter og valgt `table`-modus før `Plukk og tell` åpnes. Nøyaktig samme barnesynlige inngang brukes etter reload, slik at progresjon og lagring fortsatt verifiseres. Ingen produktkode, illustrasjon, spillmotor eller andre fag er endret av denne QA-rettelsen. Full WebKit/Chromium-test på nyeste commit kreves før merge, og feilen er ikke skjult med `force`, høyere timeout eller `continue-on-error`.



### 26.10: Full QA – samlebokens reelle, synlige avatar etter ugyldig lagring

Full `Laria QA` på `f9fa707` hadde 10 av 11 workflow-kontroller grønne, men `laria-mapboard` feilet i `tests/laria-collection-persistence.playwright.js:169` på en usynlig `svg.laria-fox-wardrobe-placed` under `#home-screen` etter at testen med vilje skrev ugyldige samlingsdata og lastet inn siden. Både denne testen og selve `laria-fox-wardrobe.js` er byteidentiske med produksjons-`main`. Den låste Home v15 er godkjent som **trollbasert**, og `.bc12-fox` er bevisst visuelt skjult. Det gamle Home-overlayet er derfor ikke et meningsfullt kriterium for hva barnet faktisk kan se.

**Testrettelse uten produktendring:** Etter rekonstruert samling og ny innlasting må barnets valgte `girl`-profil fortsatt være lagret. I Home v15 åpnes den **synlige** samleboken og deretter `Min rev`, som skal vise nøyaktig én `svg[data-avatar="girl"]` og ingen ikke-utgitte klær. For eldre Home-visninger beholdes kravet om én korrekt sammensatt rev direkte på Hjem. Tidligere testkrav til opptjente eiendeler, avvisning av falske data, frivillig utstyr, all læringshistorikk og ingen dobbeltutbetaling er beholdt uendret.

**Kvalitetsport:** Full QA må bestå på den nye eksakte HEAD før merge. Rettelsen må aldri brukes som begrunnelse for å overse reelt datatap eller for å kalle statiske troll fullverdige levende premiumfigurer.
