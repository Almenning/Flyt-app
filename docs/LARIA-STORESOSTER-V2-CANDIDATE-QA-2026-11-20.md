# Storesøster v2 — kandidatrevisjon, 20. november 2026

**Status: GJENNOMGANGSKANDIDAT / IKKE PRODUKSJONSKLAR.**

Produksjonsarbeidet er videreført fra produkteierens beslutning om én konsistent helfigur før lagdeling. En NY, transparent 1024×1536 helfigur er generert og overført til en 2048×2048 RGBA-master uten strekking. Fra **samme kandidatmaster** er en teknisk 2D-rigg bygget med 13 lagfiler, pivoter, SHA-256-manifest og demonstrasjon av seks tilstander.

Master-PNG SHA-256: `08ab9f8cf3377ef26f173598e61b47e7ff1f048a014ee59e738fd37258c38d5f`.

## Hva er faktisk kontrollert
- 13 separate WebP-lag i identisk 2048×2048 RGBA-koordinatrom, SHA-256 kontrollert.
- Transparent 2048-master, maskebasert oppdeling fra samme kildepiksel og kontroll over leddpunkter.
- Seks tekniske riggposisjoner (`idle`, `wave`, `think`, `help`, `celebrate`, `encourage`) og en 10-bilders animasjonsprøve.
- Lokalt kontrollskript bestod format-/transparens-/hash-/filintegritetssjekk. **Dette er IKKE Chromium/WebKit- eller ekte app-QA.**

## Avviste punkter / arbeid som gjenstår
1. Kandidaten avviker visuelt fra v1 i ansikt, antrekksdetaljer og proporsjoner. **Ingen identitetsgodkjenning er gitt.**
2. Automatiske masker og midlertidig skuldermaling etterlater synlige skjøter ved store armbevegelser. Må retusjeres kunstnerisk fra samme master.
3. Hårbåndblomsten sitter fortsatt i hodelaget; separat `headband-flower` er en **bevisst tom slot**. Dette gjør pakken ufullstendig.
4. Blunk/åpen munn er foreløpig håndtegnede tekniske erstatninger, ikke ferdig godkjente ansiktsvarianter.
5. Ingen lagfiler er lagt i `assets/trollactor2/storesoster-v2/approved/`, og `ownerApproved` forblir **false**.
6. Selve bildepakken er levert som samtalevedlegg til visuell vurdering, **ikke** overført til GitHub-repositoriet. Denne dokumentasjonen er ikke en falsk påstand om at binærressursene ligger i appen.

## Beslutningsporter
A. Visuell godkjenning av korrekt Storesøster-identitet og overmalt, sømløs lagpakke.
B. Eksakt app-integrasjon og ekte WebKit/Chromium iPad stående/liggende med seks animerte reaksjoner og kvalitetsgodkjenning.

**Inntil A og B er bestått skal V1 forbli eneste produksjonskarakter. Ikke merge eller publiser PR #258.**