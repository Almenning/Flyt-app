# LÆRIA – VISUELL MESTERPLAN: TALLENGA

**Dato:** 25.10.2026  
**Status:** Arbeidsplan for godkjenning. Ikke en visuell godkjenning eller publiseringsbeslutning.  
**Kanonisk utviklingsløp:** draft-PR #220 i Almenning/Flyt-app.  
**Arbeidsprinsipp:** Referanse → kildelag → ferdig design → godkjenning → implementering → verifisering. Ikke motsatt.

## A. Mål og ufravikelige krav

Bygg Tallenga som Lærias første helhetlige premium fagforside for matematikk på iPad, først i liggende format, senere stående iPad og iPhone. Barnet skal møte et sammenhengende, varmt illustrert eventyrlandskap, de tre eksakt godkjente skogstrollene og direkte inngang til **Gangemagi**, **Brøklab** og **Gangetabellen**. **Neste eventyr** er et frivillig tillegg og skal aldri blokkere frilek.

Læringsmotor, oppgave-ID-er, Lagret fremgang, matematikk, gamle reisekart, Kloden/Kartene og øvrige fag skal bevares. Hjems geografisk låste **Grovanova/Kjøsnesfjorden** må ikke blandes med Tallengas **Ryssdalshorn-inspirerte** fjordmotiv. Ingen fiktiv fjellform skal presenteres som korrekt lokalgeografi.

Dette er ikke en oppgave om å legge ytterligere skygger og CSS-overstyringer på nåværende skjerm. Visuelle avvik løses i riktig kilde, ikke ved symptombehandling.

## B. Fasit og kildehierarki

**1. Tallenga: låst komposisjonsretning**  
Prosjektbibliotek: `/Læreapp for barn/Fra dagens reise til magisk Tallenga.png` (1448 × 1086). **Høyre iPad-panel** er designbriefen fra 25. oktober: én luftig fagforside, tre store illustrerte direkteinnganger, et diskret valgfritt neste eventyr, og en helhetlig eventyrscene. Panelbildets figurer er **ikke** karakterfasit: de avviker fra de tre særskilt låste skogstrollene. Feil figurer skal ikke tegnes, klippes ut eller kopieres.

**2. Troll: låst visuell karakteridentitet**  
Prosjektbibliotek (24. oktober):
- `/Læreapp for barn/storesoster.png`, 512 × 1024.
- `/Læreapp for barn/lillesoster.png`, 512 × 1024.
- `/Læreapp for barn/lillebror.png`, 512 × 1024.

Bevar eksakt ansikt, hår, blomster, drakt, farge, kroppsform, proporsjoner og særpreg. Disse større PNG-originalene ble funnet 25. oktober. De er **ikke dokumentert som separate redigerbare anatomiske lag**. At kildene finnes i høyere oppløsning betyr ikke at rigging eller ren integrering er løst.

GitHub-originaler som også bevares byte-eksakt i `laer-litt-mer/assets/skogstroll/`:
- `storesoster.webp` 271 × 420, Git-blob `5d5f80c15e367bbd4600013057c7820a7b2e2adb`
- `lillesoster.webp` 281 × 420, Git-blob `661107cd231a72b14aeca4f7bc3c826130734576`
- `lillebror.webp` 304 × 420, Git-blob `5f92c89319ec372b980c75eb3d538a4f4f851a7c`

Ikke påstå at PNG- og WebP-piksler er identiske før de er sammenlignet systematisk. Beregn checksum når originale PNG-bytefiler kan overføres til arbeidsmiljøet.

**3. Terreng: brukerens fotoreferanse**  
Prosjektbibliotek: `gloppen_ryssdalshorn_2tobbzp6j09l8ad09f23sbsjhv72jof29jt499t5ydijeec8a_6437_800_1200_90-6397-4000-4000-90(1).jpg`. Den reelle fjellformen er formreferanse, ikke en lisens til å erstatte fjorden med et oppdiktet alpemotiv.

**4. Historiske skisser er IKKE produksjonsfasit**  
Før/etter-illustrasjoner, øyeblikksbilder av PR #220 og visuelle armstudier i prosjektbiblioteket er dokumentasjon på idéer/avvik. `00-layer-handoff-preview(2).png` viser konkret manglende skjult arm- og skulderanatomi og er merket IKKE INTEGRER. `Laria_Storesoster_Premium_Armlag_Nytt_Laboratorium.png` er et utkast, ikke en godkjent 2D-rigg.

## C. Én fase av gangen – ingen hopping over portene

### FASE 0 – Stabiliser baseline og lås fasit
**Status: DELVIS UTFØRT – dokumentert 25. oktober.**

Leveranser:
- Behold PR #220 som reversibel teknisk prototype, med standardappen uendret uten `?tallenga=prototype`.
- Denne planen og lenker til eksakte låste bilder dokumenteres sentralt.
- Stopp kosmetiske CSS-kommitter inntil neste visuelle godkjenningsport.
- Sammenlign eksisterende implementasjon med konseptets høyre panel og noter faktiske avvik.

**PORT 0:** Alle vet hvilke filer som er komposisjonsfasit, hvilke som er figurfasit og hvilke som bare er testbilder. Ingen andre skogstroll kan bli lagt inn ved en feil.

### FASE 1 – Skaff produksjonsklare originale illustrasjonslag
**Status: ÅPEN, blokkerer ekte figur- og scenearbeid.**

Leveranser:
- Verifiser PNG-mot-WebP-identitet, oppløsning, eventuell alfa, fot/gresskant og filenes faktiske opphav.
- Søk etter opprinnelige redigerbare arbeidsfiler (PSD/ORA/Rive/SVG/lagdelte kilder) før man rekonstruerer noe.
- Hvis redigerbare kilder mangler: lag et eksplisitt **separat og gjennomgått** tegne-/lagdelingsgrunnlag, uten å finne på eller endre synlige ansikter/klær/proporsjoner. Skjult anatomi som må males må flagges særskilt for godkjenning.
- For storesøster: bakhår, forhår, hode/ansikt (øyne, øyelokk, munn), overkropp, venstre/høyre over- og underarm/hånd, bein/føtter, klær og riktige overlapp. Ingen innebygd gress eller lyshalo.
- Hvert lag leveres med alpha, konsekvent koordinatsystem, pivoter, z-rekkefølge, originalkontroll og målformat.

**PORT 1:** Det finnes én faktisk godkjent, kvalitetssikret lagdelt **storesøster** som både i stillstand og med skilt arm er identisk med låst original, uten hull/halvødelagt anatomi. Ved manglende kilde: STOPP; ingen pseudo-rigg.

### FASE 2 – Ferdig masterillustrasjon for Tallenga
**Status: IKKE GODKJENT.**

Leveranser:
- Lag EN høyoppløselig, sammenhengende iPad-liggende komposisjon med riktig Ryssdalshorn-silhuett, fjord, lysretning, atmosfære, sti/forgrunn og ekte dybde.
- Tre tydelige, store aktivitetsinnganger med særpreget visuelt miljø, ikke tre generiske kort eller tre tilfeldige kartutsnitt.
- Tre godkjente troll sømløst inne i verdenen. Ikke lim flate hele bilder over en ferdig bakgrunn; bakken, skjulende vegetasjon, kontakt, perspektiv og lys må stemme.
- Historiebokaktige premiumknapper med entydig trykkflate og lesbar kontrast. Ikke la figurer blokkere knapper.
- Et frivillig «Neste eventyr» under de tre aktivitetene. Ikke et stort skole-dashboard eller påtvungen oppdragssti.
- Lever kildekunst med bakgrunn, mellomgrunn, karakterplan, forgrunn og interaktive overlegg som separate redigerbare lag.

**PORT 2:** Ett fullskjermsbilde i iPad-liggende godkjennes mot låst konsept, faktisk trollidentitet og terrengreferanse. Vis side-ved-side i 100 % visning og viktige 200 %-utsnitt. Brukerens eksplisitte visuelle godkjenning kreves. Ingen implementering før pass.

### FASE 3 – Levende storesøster: ekte leddanimert pilot
**Status: IKKE GODKJENT.**

Leveranser:
- 2D-puppet i Rive eller tilsvarende hvor individuelle armer, hode, øyne/munn og torso kan beveges uavhengig.
- Fem reelle tilstander: hvile (pust, blunk, blikk), vinke, tenke, hint, juble.
- Utløses av faktiske hendelser i **Gangemagi**. Ingen CSS-bobbing av helfigur, ingen falsk feiring ved feil svar.
- Kontroll av at ansikt, drakt og silhuett forblir de godkjente, og at ledd ikke viser hull/sømmer.
- Redusert bevegelse, ytelse og berøringsinteraksjoner skal støtte barnet.

**PORT 3:** Skjermbilder og videoklipp av alle fem tilstander i WebKit på iPhone og iPad, pluss manuell kontroll i faktisk Safari på fysisk enhet. Ikke kalle piloten ferdig bare fordi en animasjon spiller.

### FASE 4 – Implementer godkjent Tallenga i én kontrollert kodeendring
**Status: IKKE STARTET.**

Leveranser:
- Integrer den godkjente scenen og figuren, ikke en ny tolkning, i eksisterende prosjekt.
- Åpne **Gangemagi / Brøklab / Gangetabellen** direkte. Den gamle reisen skal være mulig å oppsøke, og neste kapittel valgfritt.
- Bevar lagret fremgang over sideoppdatering/retur, spillregler, semantikk, barnets valg, tilgjengelighet og eksisterende data.
- Test i Chromium og WebKit på iPhone, iPad stående/liggende; gjennomfør særskilt Safari på reelle enheter og skjermbilder tatt fra eksakt siste commit.
- Sammenlign testbildene mot godkjent master, ikke bare mot tidligere kode.

**PORT 4:** Ingen blokkeringer i oppstart, spill, lagring eller tilbakegang. Faktiske skjermbilder samsvarer med godkjent master. Personlig godkjenning før merge/publisering.

### FASE 5 – Bruk Tallenga som premiumstandard videre
**Status: VENTER.**

Leveranser:
- Lås gjenbrukbare illustrasjons-, knapp-, dybde- og TrollActor-regler.
- Overfør kontrollert til de andre fagforsidene og aktivitetene, én om gangen.
- Lillesøster og lillebror får egne godkjente riggoppsett og personligheter, ikke kopier av storesøsters bevegelser.
- Bevar spesielt Hjem/Grovanova, Kloden/Kartene og de øvrige funksjonene som særskilte produksjonsbaser.

**PORT 5:** Andre fag og aktiviteter skal dokumentert bruke samme visuelle standard uten at identitet, geografi, læring eller data blir svekket.

## D. Stoppregler, bevis og fremdriftsformat

1. **Ingen nye karaktervarianter.** Originalt ansikt, hår, kropp, drakt og proporsjoner er bindende.
2. **Ingen falsk visuell godkjenning.** En grønn automatisert test er funksjonell evidens, ikke illustrasjonskvalitet.
3. **Ingen ny CSS-redning av feil kildekunst.** Feil kildemateriale repareres i originalkunst.
4. **Ingen PR-spredning.** #220 er kontrollert baseline for Tallenga. Ikke åpne nye parallelle implementasjonsløp for samme visuelle problem uten teknisk nødvendighet.
5. **Ingen merge/publisering uten eksplisitt godkjenning.**
6. **Ingen «jobber i bakgrunnen» uten faktisk opprettet, kontrollert automatisering.** Statusrapportene skal skille hva som er utført fra det som gjenstår.

For hver fase: loggfør i dette dokumentet (a) kilde/commit, (b) faktiske vedlegg, (c) avvik og risiko, (d) automatisk test, (e) visuell vurdering, (f) port **BESTÅTT / IKKE BESTÅTT / BLOKKERT**.

## E. Første neste handling

**FASE 1 først.** Hent ut de tre PNG-originalene fra prosjektbiblioteket til et godkjent, versjonert designkildearkiv; sammenlign dem med WebP og undersøk eksisterende lagstudier. Avklar om original lagfil finnes. Hvis ikke: arbeidet må starte med et godkjent produksjonsklart storesøster-tegningssett. Ikke bruk mer tid på dekorative knapper i PR #220 før denne porten er avklart.
