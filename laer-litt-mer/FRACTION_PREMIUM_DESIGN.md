# Læria: Brøklaben (premium) – låst design og akseptansekriterier

**Produktgrunnlag:** Bruker har godkjent seks illustrasjoner 8. oktober 2026. Originalene er bevart i brukerens bibliotek under `Læria/Brøklaben/Laria_Broklaben_Laste_Illustrasjoner_2026-10-08.zip`.

## Formål
Brøklaben skal være et morsomt, forståelig, taktilt og faglig korrekt sted barnet selv vil utforske. Udir-tilknytningen skal sikre faglig verdi, ikke presse barn gjennom nivåer. Repetisjon, fri utforsking og mestring er verdifull aktivitet. Alt innhold er åpent. Mestring skal anbefale, ikke låse.

## Syv skjermflyter, seks illustrasjonsreferanser

1. **Oversikt** (låst illustrasjon #1): seks store aktivitetskort inne i et varmt illustrert verksted / bakeri, Læria-reven nederst.
2. **Utforsk brøker** (illustrasjon #2): startet med 3/4 i en stor sirkel. Bytt mellom sirkel, stripe, rutenett og målebeger. Velg teller/nevner og vanlige brøker. Grafikken oppdateres umiddelbart.
3. **Bygg en brøk** (illustrasjon #3): ekte brøkbiter på trebrett. Legg til deler via trykk eller dra-og-slipp, juster teller/nevner, trykk på sektor for å legge til / fjerne, se riktig brøktall.
4. **Like mye?** (illustrasjon #4): visuelt sammenlign like og ulike mengder; eksempler som 1/2 = 2/4, 3/4 ≠ 2/3. Barnet velger om mengdene er like, får skånsom respons og kan prøve et nytt eksempel. Banken inneholder 16 blandede brøkpar, fordelt på åtte like og åtte ulike, slik at et fast gjettesvar ikke gir uttelling.
5. **Sorter brøker** (tilgjengelig fra oversiktsillustrasjon): tre brøker sorteres fra minst til størst med drag-and-drop eller store pilknapper. Sammenlign brøkverdier eksakt, uten flyttallsavrundingsfeil.
6. **Brøk, prosent og desimal** (illustrasjon #5): fysiske eksempler med 1/2 = 50 % = 0,5 og flere valg. Periodiske desimaltall vises som tilnærminger, aldri som eksakt likhet.
7. **Min mestring** (illustrasjon #6): dokumenterer de faktiske brøkene og sammenhengene barnet har forsøkt eller oppdaget. Ingen oppdiktede poeng, falske ferdighetsmålinger eller innholdslåser.

## Visuell retning
Låst formspråk: Læria-eventyrverden, varmt treverk, kremfarget pergament, dempet korall/grønn/blå, romlig dybde og sympatisk Læria-rev. For 1.–2. trinn er trykkflater store og scenene konkrete; 3.–4. og senere kan komprimeres. Ikke tilfeldig regnbuegrafikk eller sterile hvite regneark.

**Viktig om referansebilder:** Seks illustrasjoner er designfasit for stil, scenekomposisjon og pedagogisk betydning, ikke en bildefil som legges over en side med usynlige klikkfelt. Faktiske interaksjoner implementeres som SVG/HTML/CSS, med god kontrast og navigasjon. Ytterligere illustrasjonsarbeid kan gi enda tettere visuell likhet med originalene.

## Lagring og kompatibilitet
- Gamle `state.fractionLab.completed` og graded `answerLog`/`sessionLog` røres ikke.
- Nye oppdagelser lagres lokalt i `laria_fraction_premium_v1`, med reelle unike handlinger fordelt på utforsking, bygging, likhet, sortering og omregning.
- `fraction-lab-back`, `openFractionLab` og `data-explore-release=explore-rc1` beholdes for Basecamp og andre ruter.
- Ingen endringer i kloden eller gangetabellen.

## QA / go-no-go før deling med barn
1. Sjekk alle sju skjermer i Chromium + WebKit for iPhone og iPad.
2. Ingen feil i aritmetikk, visuell deling, sorte­ringsrekkefølge, prosent- eller desimalvisning.
3. Hjelp og feilsvar skal være vennlige; barnet skal alltid kunne prøve på nytt.
4. Ingen horisontal sidescroll eller trykkflater under 44 px. Tester av dra/trykk, tilbakeknapper og lagring.
5. Sjekk bred `tests/laer-litt-mer.playwright.js`, Basecamp og eksisterende skoleprogresjon.
6. Sjekk skjermbilder opp mot illustrasjonene. Feil eller manglende grafikknivå må beskrives konkret, ikke markeres som fullført.

## Implementasjon
`laer-litt-mer/fraction-premium-v2.js`, `laer-litt-mer/fraction-premium-v2.css`, browser QA `tests/laria-fraction-premium.playwright.js`.

## Visuell gjennomgang 9. oktober 2026: illustrasjon mot kode

Ved sammenligning av de seks låste illustrasjonene med faktiske Safari-skjermbilder fra den første Brøklaben ble tre vesentlige mangler funnet:

1. **Miljø:** Den første kodeversjonen brukte en utvisket standardmattebakgrunn i stedet for et illustrert brøkverksted.
2. **Aktiviteter:** De seks menyillustrasjonene var overforenklede gjentakelser av den samme brøksirkelen eller typografiske tegn.
3. **Fysiske objekter:** Byggeskjermens løse brikker var Unicode-sirkler, ikke visuelt håndgripelige sektorer.

### Ny forbedring v3

- Eget illustrert **bakeri- og verkstedmiljø** `fraction-workshop-scene.svg`, med hyller, krukker, vindu mot eventyrlandskap, epler, pai og trebenk. Miljøet er en atmosfærisk bakgrunn, ikke et skjermbilde med falske knapper.
- Seks distinkte SVG-illustrasjoner for startskjermens aktiviteter, basert på visuell retning i de godkjente konseptene. Hver illustrasjon er dekorativ, mens selve aktivitetsknappen forblir ekte HTML.
- Ved bygging er hver løs sektor nå en brøkbit som viser riktig brøkdeling for valgt nevner. Både dra-og-slipp og trykk-alternativ er beholdt.
- Større og tydeligere reveguide, tre-/papirtekstur med dybde og mer kontrast.
- Ved vellykket sammenligning vises en synlig «Aha!»-oppdagelse. Mestring har en sti som viser **faktisk besøkte** aktiviteter, ikke en låst løype eller oppdiktet fullføring.
- Opprinnelig læringslogikk og lagring beholdes uendret. Ingen endringer i kloden eller andre fag.
- Cache-versjon er oppdatert for Safari/PWA.

**Akseptanse:** Bildekvaliteten er forbedret og skal verifiseres med nye skjermbilder på iPhone/iPad mot referansene. Dette er ikke et løfte om pikselidentisk gjengivelse av konseptillustrasjonene: dem kan kreve dedikerte høyoppløselige illustrasjonsressurser. Ikke marker full visuell likhet uten bildeinspeksjon og tilbakemelding fra barnet.


## Visuell kvalitetsrunde v4 – opp mot låste seks illustrasjoner

Bruker har presisert at v3 fortsatt ikke oppfyller uttrykket fra de seks låste referansene. Ved direkte sammenligning av ref-bildene med v3-skjermbilder fra WebKit (iPhone/iPad) var særlig disse avvikene synlige:

1. **Hjemmet var for flatt**: Få fysiske bakeridetaljer i forgrunnen, og reven framstod for liten og løsrevet fra verden.
2. **Utforskingen var for teknisk**: abstrakte tekstsymboler i visningsvalg, tallbrøker uten visuelle miniatyrer, og en liten brøksirkel uten revevenn ved læringsobjektet.
3. **Byggingen var for kontrollpreget**: brøkbildet og de løse bitene trengte mer fysisk rom, en tydelig arbeidsflate og en direkte forklaring.
4. **Noe av undervisningen manglet sammenheng mellom ting og symbol**: Barnet skal kunne velge et visuelt bilde av en brøk før det begynner å regne med symbolene.

### Gjennomført i v4
- Egen detaljert SVG-illustrasjon `fraction-bakery-foreground-v4.svg` som *dekorasjon*, med ekte paiillustrasjon, epler, bok, brøkbiter, serveringsbrett, løv og duk. Ingen usynlige knapper over en statisk designskjerm.
- Hjemmekortene får forbedret romfølelse og faktisk fortelling i omgivelsene. Reven er tydeligere knyttet til scenen.
- Fire nye SVG-miniatyrer for sirkel, stripe, rutenett og målebeger erstatter generiske Unicode-symboler i utforskingen.
- De sju vanlige brøkvalgene viser matematisk korrekte miniatyrbrøksirkler sammen med teller/nevner.
- Den store utforskingsscenen får en fysisk brett-/tre-ramme, reven og en kort matematisk korrekt støtteboble *inne i scenen*, ved siden av den interaktive brøkfiguren.
- Brøkbyggingen får tydeligere fysisk arbeidsflate, større kakediagram og gode berøringsmål.
- Ekte oppdagelsesantall i toppstripen erstatter den dekorative etiketten. Ingen oppdiktet antall stjerner.
- Eldre fag og kloden berøres ikke; ingen innholdssperrer, tvangsrunder eller overtakelse av barnets favorittaktivitet.

**Produktakseptanse:** V4 er en ny visuell forbedring, ikke garanti om full 3D-identitet med originalillustrasjonene. Godkjenn først når nye screenshots fra iPhone/iPad WebKit og Chromium er undersøkt konkret og den brede regresjonen er grønn. Første barnebeta skal bygge på dette og prøve om barn velger å fortsette frivillig.
