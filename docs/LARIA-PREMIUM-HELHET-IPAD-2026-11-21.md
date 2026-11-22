# Læria – helhetlig premiumløft, iPad først

**Beslutning:** 21. november 2026  
**Status:** Låst arbeidsprioritering; ikke godkjent design, ikke publiseringsklart.  
**Referanse:** `main` ved oppstart `630b98b467cdb8a7e5a8050099c9a0b77e12e7c1`.  
**Prosjektformål:** «Barn har lyst til å åpne Læria, foreldre har tillit.»

**Ny eierbeslutning 22.11.2026:** Lesekroken beholdes i nåværende apputgave. Visuelle alternativer A–D fra PR #261 er forkastet og skal ikke implementeres. Lesekroken er **ikke** automatisk fasit for alle andre fag. Oppstartsskjermen er også vurdert som tilfredsstillende og beholdes uendret. **Ikke redesign velfungerende skjermer uten et dokumentert problem.** Trollanimasjonene er fortsatt på pause.

## Ny prioritering 22.11.2026: Matte først

**Eierbeslutning:** Norsk er tilfredsstillende foreløpig, og skal ikke redesignes. Det er **Matte** som ikke oppleves som én helhet. Oppstart og Lesekroken beholdes også som tidligere bestemt. Trollanimasjoner er fortsatt på pause.

### Faktiske funn fra samme kandidatbaserte iPad-skjermserie

- **Tallvika** (låst hovedscene): detaljert fjord/natur, venstrestilt felles treskiltmeny og karakter som separat lag. Behold låst illustrasjon, skiltlogikk og eventyrenes innganger. Kontroll: [Tallvika – WebKit + Chromium](https://github.com/Almenning/Flyt-app/actions/runs/44949938274).
- **Gangemagi**: varm, mer flat/tegnet markedsplass, egne overskrifter, tilbakeknapp, aktivitetskort og tre bunnknapper. Den pedagogiske kjerneinteraksjonen (fylle kurver med jordbær) bør **beholdes**, mens ramme, overskriftshierarki og navigasjon bør vurderes mot Tallvika. Kontroll: [Gangemagi QA](https://github.com/Almenning/Flyt-app/actions/runs/44949938317).
- **Brøklab**: varm tre-/bakstedstil og korrekt brøklæring, men en helt tredje topp- og knappefamilie. På liggende iPad i WebKit-skjermbilde ligger tallkontrollene visuelt **over området med løse kakestykker**. Kode peker på en eksplisitt `translateY(-48px)` og `margin-bottom:-48px` for `fr6-controls` i `fraction-premium-v4.css` på stående bredde/liggende <=900 px høyde. Dette er et konkret rettingskandidat; et mindre/avgrenset panel må ikke skjule kakestykkene eller legge kontrollene nedenfor første skjerm uten test. Kontroll: [Brøklab QA](https://github.com/Almenning/Flyt-app/actions/runs/44949938193).
- **Gangetabellen**: iPad-kontroll av den reelle 10×10-skjermen igangsatt i [PR #262](https://github.com/Almenning/Flyt-app/pull/262). **Ikke konkluder om denne skjermen før bildet er vurdert.**

### Ny arbeidsrekkefølge

1. Lag sammenlignbare iPad-bilder av Tallvika og alle tre aktivitetene på samme eksakte PR-head, stående og liggende, med faktisk navigasjon og retur til Tallvika.
2. Definer **felles, avgrenset Matte-UI-kontrakt** for tilbakeknapp, Læria-identitet, overskrifter, panelmateriale, knappespesifikasjon, kontrast og progresjon. Behold ulike læringsspill og godkjent illustrasjonskunst; ikke mal om Gangemagi/Brøklab bare for å gjøre bildene like.
3. Rett Brøklab-landskapets påviste kontrolloverlapp uten å skjule løse biter eller miste første-interaksjon, med WebKit/Chromium 1180×820 og 1366×1024. Dokumenter før/etter.
4. Gjør **én** review-only visuell pilot på utvalgt aktivitet, med skjermbilder og faktisk funksjonstest; eier godkjenner før bred utrulling til øvrige Matte-flater.
5. Norsk, Lesekroken, oppstart og trollanimasjonsarbeid er utenfor scope. Ingen merge eller publisering uten godkjenningsporter.

### Hvorfor ikke en helt ny redesign

Tallvika har allerede en godkjent visuell identitet. Læreverdien i jordbærkurvene og brøkkaken må ikke ofres for kosmetisk enhet. Vi retter først den **felles brukeropplevelsen** og de dokumenterte bruddene, ikke hele den kunstneriske innpakningen samtidig.

## 1. Ny arbeidsprioritering

Trollanimasjonene er **satt på pause**. Behold identiteter og kildekunst, men ikke produser eller integrer nye TrollActor-klipp. PR #258 forblir draft, uten merge/publisering. De midlertidige størrelses-/plasseringsvariantene av Storesøster (A/B/C) er ikke godkjent produksjonsdesign.

Lærias neste leveranse er en **konkret kvalitetsgjennomgang av gjenstående flater**, fra Reisen/Utforsk og samling til fagaktiviteter, mestring og tilbakeflyt. Lesekroken og oppstart er vurdert av eier og skal ikke redesignes. Hjem v16 og allerede låste fagmotiver er **fasit for designretning**; illustrasjoner skal ikke byttes, regenereres eller males over av nye UI-etterligninger.

Dette sporet holdes **atskilt** fra PR #258 og fra HverdagsOss. Ikke gjenbruk gamle, åpne redesign-PR-er ukritisk. Jobb fra oppdatert `main` i små, verifiserbare etapper.

## 2. Faktisk visuell basis, med kildebegrensninger

### Skjermbilder kontrollert

Fra GitHub Actions **Læria – låst felles visuell identitet** på kandidatcommit `f99c8fa8d4844f288171270788a7c375db157ef8`, WebKit iPad, 1366×1024 og 1024×1366:
- Hjem (Grovanova), Norsk (Eggenipa), Matte (Tallvika), Engelsk (Kinnaklova), Geografi (Nordlysleiren).
- Kjøring og kildeartifakt: https://github.com/Almenning/Flyt-app/actions/runs/44949633702/artifacts/14724564090

Fra **Læria Premium Beta – TrollActor og enheter**, samme kildecommit, WebKit iPad begge retninger:
- Oppstart/valg av figur, én faktisk Lesekroken-oppgavescene.
- Kjøring og kildeartifakt: https://github.com/Almenning/Flyt-app/actions/runs/44949633604/artifacts/14724767297

**Viktig:** Dette er tester av en **PR-kandidat**, ikke bevis for at de samme skjermene er publisert eller at alle visuelle godkjenningsporter er grønne. QA-montasjens Geografi-rute var tom på stående iPad, men den separate ekte Geografi-PNG-en er korrekt. Feilen er i montasje-/utvalgsvisningen, ikke et dokumentert tomt Geografi-skjermbilde.

### Verifiserte observasjoner

| Flate | Observasjon | Konsekvens |
| --- | --- | --- |
| Hjem v16 | Fyldig illustrert landskap, naturtre, tydelig navigasjon, helskjerm på iPad. | **Visuell fasit.** Ikke bygg nytt formspråk. |
| Fire fagforsider | Tilsvarende landskap og venstrestilte skilt, men ulik grad av typografisk konsistens, overskriftshierarki og karakterdominans. | Standardiser **komponenter/typografi**, ikke de låste landskapene. |
| Lesekroken (Norsk) | Varm krem-/treramme og lesbar oppgave. Produkteier er fornøyd med nåværende utseende. | **Behold uendret**. Ikke bruk Lesekroken som tvungen universell designmal. |
| Oppstart / velg eventyrvenn | Sterkt avvik: blek, hvitliggjort scenebakgrunn, standardkort med blå/lilla UI og gul CTA med rakett. | **Tydeligste umiddelbare stilbrudd.** Knyt oppstart visuelt til Hjem uten å gjøre valg og tekst vanskelig å bruke. |
| Utforsk, Reisen, Samlebok, Mine troll, Brøklab, Gangemagi, geografiaktiviteter | Ingen felles eksakt-head skjermrekke i denne begrensede visuelle kontrollen. | **Ikke konkluder** om designfeil før faktiske skjermbilder fra samme kildecommit er samlet. |

Ikke bruk isolerte screenshots fra egne Samlebok- eller annen feature-PR som bevis for hva som allerede er på `main`.

## 3. De fem viktigste løftene i rekkefølge

1. **Behold Lesekroken og oppstart uendret.** Eier har vurdert begge som tilfredsstillende. Ikke viderefør Lesekroken A–D fra PR #261, og ikke sett i gang ny oppstartsdesign uten konkret dokumentert feil.
2. **Kontroller øvrige flater mot faktiske iPad-bilder.** Skaff eksakt-head-bilder av Reisen, Utforsk, Samlebok, Mine troll, belønninger, overgangene og tilbakeflyt. Ikke baser redesign på løse skisser.
3. **Vurder øvrige aktiviteter hver for seg.** Engelsk, Gangemagi, Brøklab og Geografi kan bruke forskjellige pedagogiske oppsett, men bør ha gjenkjennelig navigasjon, lesbarhet og knappekvalitet. Ikke kopier Lesekroken ukritisk.
4. **Rett påviste feil før kosmetikk.** Prioriter manglende funksjoner, feil navigasjon, dobbel UI, klipping, uheldig scrolling og alvorlige stilbrudd. Dokumenter før-bilde og konkret kriterium for hver endring; jobb skjerm for skjerm.
5. **Bevar publiseringssperrene.** Verifiser 1024×1366, 820×1180, 1366×1024 og 1180×820 i WebKit/Chromium, og gjennomfør kunstgodkjenninger, reell barnetest og eksakt-head QA. Ikke likestill grønne tester med eiergodkjent premium.

Denne prioriteringen gjelder **designarbeidet**, ikke tillatelse til å hoppe over eksisterende release-gates. Dersom UI-justering krever endret låst illustrasjon, stopp og krev ny visuell kildegodkjenning.

## 4. Felles visuell kontrakt

- Naturtre / to-stolpe-skilt, varme kremtoner og tydelig, mørk typografi fra eksisterende godkjente UI-ressurser; **ingen ny parallell komponentfamilie**.
- Ingen konkurrerende navigasjon; de fire fagene beholder samme venstre skiltlogikk. Hjem v16 beholder sine særskilt godkjente malte UI-elementer og reelle DOM-klikkflater.
- Oppgaveområdet er roligere enn bakgrunnen: høyt tekstkontrastnivå, minimum 44×44 CSS-px berøringsmål, synlig fokus og god skjermleserstøtte.
- Behold valgt troll hvis eksisterende stabilt; **ingen animasjonsutvikling** eller dominans som skjuler oppgaver. Trollidentitet og source assets uendret.
- Læringsinnhold, navigasjonsruter, barneprogresjon, sikkerhet/personvern og HverdagsOss uendret.
- iPad først. Ikke optimaliser iPhone/desktop parallelt før første iPad-pilot er visuelt godkjent.

## 5. Neste utførbare etappe og godkjenningsport

**Første leveranse:** en evidensbasert oversikt fra oppdatert `main` over gjenstående **Reisen, Utforsk, Samlebok, Mine troll, belønninger og oppgaveoverganger**. Få med faktiske WebKit-skjermbilder i begge iPad-retninger. Identifiser de høyest prioriterte *konkrete* avvikene; foreslå først deretter en isolert feilretting. Ikke endre oppstart, Lesekroken, låste illustrasjoner eller animasjoner.

Kriterier for pilotens «klar til visuell vurdering»:
1. Før/etter-bilder fra **samme** PR-head, faktiske WebKit/Chromium-visninger iPad stående og liggende. Bilder merkes commit og enhet.
2. Dokumenter konkret avvik og konsekvens før det foreslås kodeendring; ingen generell redesign av skjermflater eier er fornøyd med.
3. Behold etablert navigasjon, låst kunst, lærerikt innhold, validering, lagring og tastatur-/berøringsfunksjon.
4. Automatiske eksisterende tester for navigasjon, læringsprogresjon og offline/fallback bestås; røde tester beskrives presist.
5. Vis reelle før/etter-bilder i begge iPad-retninger for eiergodkjenning **før** endringen rulles til andre flater.

**Publisering:** Verken denne planen, en grønn oppstartspilot eller eldre grønn trolltest gir tillatelse til merge eller publisering. Siste beslutning tas etter samlet release-kontroll.

## 6. Tydelig ut av scope nå

- Nye trollanimasjoner, ny avatarstil eller ny figurkunst.
- Nye fjell, fjorder, bygninger, UI-frie erstatningsmotiver eller «forbedret» kildemaleri.
- Ny pedagogisk progresjonsmodell, nye spillmoduser eller nye kommersielle funksjoner.
- Full redesignet app i én commit eller blind import fra åpne eldre PR-er.

**Arbeidsprinsipp:** Én ekte, ferdig godkjent referanseflate før utrulling. Kvalitet må sees og prøves, ikke bare være grønn i testlogg.
