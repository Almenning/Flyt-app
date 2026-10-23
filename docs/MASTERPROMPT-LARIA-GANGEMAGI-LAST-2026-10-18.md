# MASTERPROMPT – LÆRIA GANGEMAGI
## Låst designfasit – full implementering til premiumkvalitet
**Dato:** 18. oktober 2026  
**Prosjekt:** Læria  
**GitHub:** https://github.com/Almenning/Flyt-app  
**Referanse:** Vedlagte illustrasjon `gangemagi_i_tallengas_hage.png`

---

# 1. OPPDRAGET

Du skal gjennomføre en fullstendig visuell og interaksjonsmessig ombygging av **Gangemagi** i Læria.

Den vedlagte illustrasjonen er nå **låst og godkjent som designfasit**.

Oppgaven er ikke å finne på et nytt design. Oppgaven er å realisere det godkjente designet i en faktisk fungerende app.

Sluttresultatet skal fremstå som en gjennomarbeidet, kommersiell premiumaktivitet for barn i alderen 6–9 år.

**Dette er ikke en inspirasjonsillustrasjon. Det er en konkret visuell spesifikasjon som skal følges så tett som teknisk mulig.**

Eksisterende Gangemagi skal ikke bare pyntes på. Dagens visuelle struktur skal erstattes der den avviker fra fasiten.

Spillmotor, læringslogikk, lagret progresjon, belønninger og eksisterende funksjoner skal bevares eller forbedres.

# 2. UFRAVIKELIGE REGLER

1. **Designfasiten er bindende.** Ikke endre stil, fargepalett, komposisjon, illustrasjonsspråk eller hovedhierarki etter eget skjønn.
2. **Ingen halvveis implementering.** Resultatet skal ikke være dagens Gangemagi med en ny bakgrunn eller større oppgavetekst.
3. **Ikke bruk hele illustrasjonen som et statisk bakgrunnsbilde.** Kurver, jordbær, tekst, knapper, rev og progresjon må være ekte, interaktive elementer.
4. **Ikke hardkod ett oppdrag.** Det visuelle systemet skal fungere for alle åtte eksisterende oppdrag og fri lek.
5. **Ingen funksjonalitet skal forsvinne.** Bevar progresjon, Markedsbok, belønninger, personlig rev, opplesning, hint, angre og klassisk Gangetabellen.
6. **Ingen endring av andre fag eller aktiviteter.** Arbeidet skal isoleres til Gangemagi.
7. **Ingen nye designretninger eller alternative forslag.** Den visuelle beslutningen er tatt.
8. **Ingen påstand om ferdigstillelse uten faktiske tester og skjermbilder.**

Ved konflikt mellom eksisterende CSS og designfasiten skal eksisterende layout omarbeides. Ikke bygg opp stadig flere overstyringer som skjuler rotårsaken.

# 3. VISUELL FASIT

## 3.1 Overordnet stil

Gangemagi skal oppleves som et levende, håndillustrert jordbærmarked i Tallenga.

Det visuelle uttrykket skal være:

- Eventyrlig, varmt og lekent.
- Premium 2.5D med dybde, lys, skygger og detaljer.
- Håndtegnet og malerisk, uten tilfeldig blanding av illustrasjonsstiler.
- Tydelig, intuitivt og tilpasset barn i 2. klasse.
- En sammenhengende spillverden, ikke separate generiske kort og informasjonspaneler.

Bruk den vedlagte illustrasjonen som direkte referanse for komposisjon, farger, materialer og proporsjoner.

Det skal ikke innføres et alternativt minimalistisk grensesnitt.

## 3.2 Toppseksjonen

Følg illustrasjonen:

- Læria-identitet og tilbakeknapp øverst.
- «Gangemagi» sentralt og tydelig.
- Undertittelen «Et lite matteeventyr».
- Oppdragsfremgang øverst til høyre, for eksempel «Oppdrag 4 av 8».

Dagens store overskrift, beskrivelsesavsnitt og modusvelger skal ikke ta opp den plassen de gjør nå.

Fri lek, Markedsbok og klassisk Gangetabellen skal fortsatt være tilgjengelige gjennom en naturlig sekundær navigasjon, uten å ødelegge det låste hoveddesignet.

## 3.3 Oppdragstavlen

Dette er ett av skjermens viktigste elementer.

Gjenskap den store illustrerte tretavlen med varm pergamentflate, blomsterdekor og tydelig overskrift:

**Dagens oppdrag**

Eksempel:

**Fyll 3 kurver med  
4 jordbær i hver.**

Tallene og handlingen skal dominere visuelt.

Under teksten skal det være tre illustrerte steg, slik designfasiten viser:

**1. Velg en kurv**  
Illustrasjon av en kurv og en hånd som peker.

**2. Legg i jordbær**  
Illustrasjon av et jordbær som legges i en kurv.

**3. Se at 3 × 4 = 12**  
Illustrasjon av tre fylte kurver.

Alle tall og instruksjoner skal være dynamiske og samsvare med aktivt oppdrag.

Oppdragstavlen skal ikke erstattes av dagens lille tekstpanel.

## 3.4 Den personlige reven

Den store, levende reven skal stå til venstre for oppdraget slik illustrasjonen viser.

**Viktig:** Illustrasjonens rev er en stilreferanse, ikke en ny standardrev.

Bruk barnets faktisk valgte jente- eller gutterev fra Lærias eksisterende profilsystem.

Reven skal:

- Ønske barnet velkommen.
- Forklare første handling.
- Reagere når barnet velger en kurv.
- Heie når jordbær legges i.
- Tilby hint ved behov.
- Juble når oppdraget er fullført.
- Kunne lese opp instruksjoner.

Reaksjoner skal være synlige, levende og kontekstavhengige.

Dialogen skal presenteres i en illustrert snakkeboble som harmonerer med referansen.

Ingen statisk rev som bare står ved siden av et informasjonspanel.

# 4. SELVE SPILLMEKANIKKEN

Dette punktet er kritisk.

**Et barn skal forstå hvordan Gangemagi fungerer uten å måtte lese en bruksanvisning.**

Den sentrale spillopplevelsen skal følge denne flyten:

### Steg 1 – Velg en kurv

Barnet ser tre store, tomme kurver.

Reven sier:

«Trykk på en kurv for å starte!»

Når barnet trykker på en kurv:

- Kurven markeres med en varm, myk lysglød.
- Reven reagerer.
- Barnet ser tydelig hvilken kurv som er aktiv.
- Det skal ikke være tvil om hva som nettopp skjedde.

### Steg 2 – Legg i jordbær

Barnet trykker på den store knappen:

**🍓 Plukk et jordbær**

Ett synlig jordbær legges i den valgte kurven, med en kort og tilfredsstillende animasjon.

Barnet kan trykke igjen for å legge til flere.

Kurven skal vise ekte illustrerte jordbær, ikke abstrakte prikker eller tomme plassholdere.

Barnet kan velge en annen kurv når det ønsker.

Det skal også være mulig å angre.

**Dette skal være én konsekvent interaksjonsmodell.** Ikke behold dagens konkurrerende oppførsel der kurvtrykk og jordbærknappen har ulike, dårlig forklarte funksjoner.

Endringer i interaksjonen skal håndteres i spillogikken uten å ødelegge lagring eller eksisterende progresjon.

### Steg 3 – Oppdag matematikken

Matematikken oppdateres umiddelbart.

Eksempel:

0 + 0 + 0 = 0

1 + 0 + 0 = 1

4 + 2 + 0 = 6

4 + 4 + 4 = 12

Når gruppene er like store og inneholder jordbær, kan multiplikasjonen forklares naturlig.

Når alle tre kurvene inneholder fire jordbær, skal barnet oppleve en tydelig fullføringsfeiring:

**3 × 4 = 12**

Reven jubler. Kurvene får en kort, magisk feiring. Den opptjente blomsten synliggjøres.

Deretter blir «Neste oppdrag» tilgjengelig.

Feiringen skal være umiddelbar, gledelig og pedagogisk meningsfull.

# 5. KURVENE OG SPILLVERDENEN

Kurvene skal være store, vakre, illustrerte flettede kurver som i referansebildet.

De skal stå fysisk i Tallengas marked, ikke i generiske UI-paneler.

Krav:

- Tydelige kurvetiketter.
- Synlige og lett tellbare jordbær.
- Store trykkflater.
- Tydelig markering av valgt kurv.
- Ingen visuell overlapp mellom jordbær og tellere.
- Naturlig plassering, dybde og skygger.
- Animasjoner som føles myke og levende.

Bakgrunnen skal gjenskape den maleriske landsbyen, blomsterprakten, markedsstemningen og den varme belysningen fra fasiten.

Bruk selvstendige illustrasjonsressurser som harmonerer med fasiten.

Bakgrunnen må ikke gjøre oppgaven eller kurvene vanskelige å lese.

# 6. MATEMATIKK OG KNAPPER

Nederst i spillscenen skal den illustrerte matematikkvisningen følge referansen:

- «Dette lager du».
- Store, tydelige tall.
- Oppdatert regnestykke.
- Visuell progresjon, eksempelvis «0 av 12».
- Jordbær som fylles inn etter hvert.

Under spillscenen skal følgende knapper følge samme formgivning som i illustrasjonen:

**Hint – Angre – Plukk et jordbær**

«Plukk et jordbær» er den tydelige hovedhandlingen.

Knappen skal knyttes til valgt kurv, og første gangs bruk skal være selvforklarende.

Før en kurv er valgt, skal grensesnittet tydelig invitere til valg av kurv.

Knappene skal ha ekte funksjonalitet, stor nok trykkflate og tilstandstilpasset respons.

Ikke introduser ekstra kontrollpaneler.

# 7. RESPONSIVT PREMIUMDESIGN

Designfasiten viser mobil i stående format.

Den visuelle retningen skal også fungere på:

- iPhone 320 × 568.
- iPhone 390 × 844.
- iPhone i liggende format.
- iPad i stående format.
- iPad i liggende format.
- Mac og større nettleservinduer.

**iPad liggende skal prioriteres som en fullverdig premiumopplevelse.**

På større skjermer skal markedet få mer rom, ikke bare bli en oppskalert mobilkolonne.

På små skjermer skal hierarkiet beholdes. Illustrasjon, tekst og kontroller kan tilpasses størrelsen, men ingen kritisk funksjon skal forsvinne.

Ikke press hele referansebildet inn på en liten iPhone ved å gjøre tekst og knapper uleselige. Bruk intelligent, responsiv komposisjon og nødvendig scrolling, med tydelig tilgang til primærhandlingen.

Minimum trykkflate for sentrale kontroller: 44 × 44 CSS-piksler.

Ingen horisontal side-scrolling, avkuttede elementer eller overlapp.

# 8. TEKNISK IMPLEMENTERING

Repository:

https://github.com/Almenning/Flyt-app

Før arbeidet starter:

1. Kontroller gjeldende `main`, relevante Gangemagi-filer og status i PR #181.
2. Kontroller eksisterende oppgaver og kvalitetskrav i GitHub-sak #186.
3. Unngå parallelle endringer i de samme filene uten samordning.
4. Opprett eller viderefør en isolert utviklingsgren.
5. Lagre denne masterprompten uendret i `docs/`.
6. Legg den låste illustrasjonen under versjonskontroll som designreferanse hvis den er tilgjengelig og kan brukes lovlig.
7. Opprett en løpende arbeidslogg i `docs/`.

Ikke baser utviklingen på antakelser om tidligere PR-er. Kontroller faktisk status først.

Bruk eksisterende motor, data og profiltilkobling der det er hensiktsmessig.

Ny scene skal bygges med reelle DOM-/SVG-/Canvas-elementer, ikke en falsk interaktiv skjerm over et statisk bilde.

Eksisterende lagret progresjon må fortsatt fungere etter oppgraderingen.

Alle nye illustrasjoner skal være originale eller ha nødvendige bruksrettigheter.

# 9. ABSOLUTTE KVALITETSKRAV

Følgende skal være oppfylt før løsningen kan regnes som ferdig:

### Visuell kvalitet

- [ ] Skjermen har samme overordnede komposisjon som den låste illustrasjonen.
- [ ] Tretavlen, landsbyen, reven og kurvene fremstår som ett sammenhengende visuelt univers.
- [ ] Oppgaveteksten er visuelt dominerende.
- [ ] Kurvene er store og tydelige.
- [ ] Matematikkvisningen matcher designfasiten.
- [ ] Knappene matcher referansens stil og hierarki.
- [ ] Ingen tilfeldige moderne standardkort eller fremmede designkomponenter er introdusert.

### Funksjonalitet

- [ ] Barnet kan velge kurv.
- [ ] Barnet kan fylle valgt kurv.
- [ ] Jordbærene vises og telles riktig.
- [ ] Regnestykket oppdateres riktig.
- [ ] Hint fungerer.
- [ ] Angre fungerer.
- [ ] Reven reagerer.
- [ ] Alle åtte oppdrag fungerer.
- [ ] Fri lek fungerer.
- [ ] Markedsbok og belønninger fungerer.
- [ ] Lagret progresjon bevares.
- [ ] Klassisk Gangetabellen er fortsatt tilgjengelig.

### Brukervennlighet

- [ ] Første handling er åpenbar.
- [ ] Det er tydelig hvilken kurv som er valgt.
- [ ] Barnet ser hva som skjer ved hvert trykk.
- [ ] Barnet forstår sammenhengen mellom antall kurver, jordbær og regnestykke.
- [ ] Ingen nødvendig handling er skjult av layouten.

# 10. OBLIGATORISK TESTING

Ta **faktiske skjermbilder fra implementert app**, ikke AI-genererte konseptbilder.

Bruk Playwright med Chromium og WebKit.

Dokumenter:

1. Start av oppdrag.
2. Valg av første kurv.
3. Første jordbær.
4. Delvis fylte kurver.
5. Tre fullt fylte kurver.
6. Fullføring og feiring.
7. Overgang til neste oppdrag.
8. Fri lek og retur.
9. Gjenoppretting av lagret progresjon.

Gjennomfør visuell sammenligning mellom implementerte skjermbilder og den låste illustrasjonen.

Kontroller særlig iPad liggende, iPad stående og iPhone stående.

**Grønne tester alene er ikke tilstrekkelig.**

Koden kan fungere teknisk samtidig som produktet fremstår visuelt middelmådig.

Dette skal ikke godkjennes som premium bare fordi testene passerer.

# 11. ARBEIDSPROSESS OG PUBLISERING

Arbeid systematisk:

**Fase 1: Kartlegging**  
Identifiser komponenter, dataflyt, layout og rotårsaker til dagens avvik.

**Fase 2: Visuell hovedscene**  
Implementer designfasiten som et ekte, responsivt grensesnitt.

**Fase 3: Spillinteraksjon**  
Knytt kurvvalg, jordbær, matematikk, reven og feiringen til den nye scenen.

**Fase 4: Premiumfinpuss**  
Forbedre illustrasjonskvalitet, typografi, animasjoner, responsivitet og tilgjengelighet.

**Fase 5: Kvalitetssikring**  
Test alle oppdrag, enheter, lagring og eksisterende funksjoner.

**Fase 6: Publisering**  
Når kvalitetskravene er oppfylt, flett godkjent kode og verifiser faktisk publisering i GitHub Pages.

Gjør regelmessige commits. Oppdater arbeidsloggen etter vesentlige steg.

Ikke stopp etter å ha produsert en plan, et designforslag eller en prototype. Fortsett gjennom implementering og testing innenfor den aktive arbeidsøkten.

Dersom sesjonen avsluttes, skal gren, commits og arbeidslogg gjøre videreføring mulig uten å starte på nytt.

Ikke publiser en løsning som ikke består kvalitetskravene. Behold den som draft med konkrete, dokumenterte mangler.

# 12. DEFINISJON AV FERDIG

Gangemagi er ikke ferdig når oppgavene teknisk kan gjennomføres.

Gangemagi er ferdig når:

**1. Den faktiske appen visuelt ligger svært tett på den låste illustrasjonen.**

**2. Et barn i 2. klasse intuitivt forstår hva det skal gjøre, uten forklaring fra en voksen.**

**3. Spillet gir tydelig, levende og meningsfull respons på barnets handlinger.**

**4. Funksjonalitet, progresjon og øvrige deler av Læria er bevart.**

**5. Faktiske skjermbilder, funksjonstester og publisert versjon er kontrollert.**

Ikke erstatt dette målet med en enklere versjon.

Ikke presenter en kosmetisk forbedring som en fullstendig redesign.

Ikke opprett enda et parallelt konsept.

## ENDELIG INSTRUKS

**Bygg Gangemagi slik den låste illustrasjonen viser. Gjør den fullt spillbar, intuitiv og responsiv. Bevar eksisterende funksjonalitet. Test den faktiske løsningen. Publiser først når kvalitetskravene er oppfylt.**

**Den vedlagte illustrasjonen er fasiten. Ikke redesign fasiten. Realiser den.**