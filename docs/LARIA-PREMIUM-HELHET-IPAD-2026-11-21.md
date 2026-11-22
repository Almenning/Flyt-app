# Læria – helhetlig premiumløft, iPad først

**Beslutning:** 21. november 2026  
**Status:** Låst arbeidsprioritering; ikke godkjent design, ikke publiseringsklart.  
**Referanse:** `main` ved oppstart `630b98b467cdb8a7e5a8050099c9a0b77e12e7c1`.  
**Prosjektformål:** «Barn har lyst til å åpne Læria, foreldre har tillit.»

**Ny eierbeslutning 22.11.2026:** Lesekroken beholdes i nåværende apputgave. Visuelle alternativer A–D fra PR #261 er forkastet og skal ikke implementeres. Lesekroken er **ikke** automatisk fasit for alle andre fag. Oppstartsskjermen er første forbedringsområde. Trollanimasjonene er fortsatt på pause.

## 1. Ny arbeidsprioritering

Trollanimasjonene er **satt på pause**. Behold identiteter og kildekunst, men ikke produser eller integrer nye TrollActor-klipp. PR #258 forblir draft, uten merge/publisering. De midlertidige størrelses-/plasseringsvariantene av Storesøster (A/B/C) er ikke godkjent produksjonsdesign.

Lærias neste leveranse er én samlet, rolig premiumopplevelse fra oppstart via Hjem og fagforsider til oppgave, mestring, samling og tilbake. Hjem v16 og allerede låste fagmotiver er **fasit for designretning**; illustrasjoner skal ikke byttes, regenereres eller males over av nye UI-etterligninger.

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

1. **Oppstart som faktisk hører hjemme i Læria.** Bruk eksisterende varmt treverk, krem og avrundede former fra Hjem/fag, samme logo og konsistent knappespråk; behold alle figurer, navn, klassevalg, validering og lokal lagring. Ikke tegn ny figur, ny bakgrunn eller nye fjell.
2. **Behold Lesekroken som den er.** Ikke viderefør visuelle forslag fra PR #261, og ikke bruk den som tvungen mal for andre aktiviteter. Rett bare funksjonsfeil om slike faktisk oppdages.
3. **Vurder særskilt andre aktivitetstyper ut fra faktiske skjermbilder.** Engelsk, Gangemagi, Brøklab og Geografi kan ha ulike pedagogiske oppsett, men må dele grunnleggende typografi, knappekvalitet og navigasjonslogikk. Ikke kopier Lesekroken ukritisk.
4. **Undersøk og harmoniser mellomskjermer.** Skaff eksakt-head skjermbilder av Reisen, Utforsk, Samlebok, Mine troll og belønningsdialoger på iPad. Rett bare reelle stil- eller navigasjonsbrudd, og behold fungerende samlings-/progresjonslogikk.
5. **Kvalitet og publiseringssperrer.** Verifiser 1024×1366, 820×1180, 1366×1024 og 1180×820 i WebKit/Chromium; ingen hvit overscroll, overlappende skilt, doble knapper, utilsiktet klipping eller falsk læringsprogresjon. Uavhengige kunstgodkjenninger/release-porter for Kinnaklova, Nordlysleiren og en faktisk barnetest må fortsatt gjennomføres.

Denne prioriteringen gjelder **designarbeidet**, ikke tillatelse til å hoppe over eksisterende release-gates. Dersom UI-justering krever endret låst illustrasjon, stopp og krev ny visuell kildegodkjenning.

## 4. Felles visuell kontrakt

- Naturtre / to-stolpe-skilt, varme kremtoner og tydelig, mørk typografi fra eksisterende godkjente UI-ressurser; **ingen ny parallell komponentfamilie**.
- Ingen konkurrerende navigasjon; de fire fagene beholder samme venstre skiltlogikk. Hjem v16 beholder sine særskilt godkjente malte UI-elementer og reelle DOM-klikkflater.
- Oppgaveområdet er roligere enn bakgrunnen: høyt tekstkontrastnivå, minimum 44×44 CSS-px berøringsmål, synlig fokus og god skjermleserstøtte.
- Behold valgt troll hvis eksisterende stabilt; **ingen animasjonsutvikling** eller dominans som skjuler oppgaver. Trollidentitet og source assets uendret.
- Læringsinnhold, navigasjonsruter, barneprogresjon, sikkerhet/personvern og HverdagsOss uendret.
- iPad først. Ikke optimaliser iPhone/desktop parallelt før første iPad-pilot er visuelt godkjent.

## 5. Neste utførbare etappe og godkjenningsport

**Første kodeleveranse:** én avgrenset PR fra oppdatert `main` som forbedrer **oppstartsskjermen**. Lesekroken, låste illustrasjoner, læringsinnhold og andre fag forblir uendret. Visuell forhåndsgodkjenning i begge iPad-retninger kreves før implementering utover en isolert prototype.

Kriterier for pilotens «klar til visuell vurdering»:
1. Før/etter-bilder fra **samme** PR-head, faktiske WebKit/Chromium-visninger iPad stående og liggende. Bilder merkes commit og enhet.
2. Valg av navn, klassetrinn og låst trollkarakter, validering, tilgjengelighet, lagring og overgang til Hjem virker uten overlapping eller utilsiktet scrolling.
3. Gjenbruk etablerte Læria-knapper, treverk og farger uten ny bakgrunnskunst eller doble navigasjonskontroller.
4. Automatiske eksisterende innloggings-/oppstarts-, lagrings-, navigasjons- og feil-/offline-tester bestås; eventuelle røde tester beskrives presist.
5. Eksplisitt eiergodkjenning av de faktiske iPad-bildene **før** endringene rulles videre til andre flater.

**Publisering:** Verken denne planen, en grønn oppstartspilot eller eldre grønn trolltest gir tillatelse til merge eller publisering. Siste beslutning tas etter samlet release-kontroll.

## 6. Tydelig ut av scope nå

- Nye trollanimasjoner, ny avatarstil eller ny figurkunst.
- Nye fjell, fjorder, bygninger, UI-frie erstatningsmotiver eller «forbedret» kildemaleri.
- Ny pedagogisk progresjonsmodell, nye spillmoduser eller nye kommersielle funksjoner.
- Full redesignet app i én commit eller blind import fra åpne eldre PR-er.

**Arbeidsprinsipp:** Én ekte, ferdig godkjent referanseflate før utrulling. Kvalitet må sees og prøves, ikke bare være grønn i testlogg.
