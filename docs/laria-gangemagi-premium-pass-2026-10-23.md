# Læria / Gangemagi – Premium-pass 23.10.2026

## Grunnlag

- Startpunkt: `main` på `4535eaa86deba8357ae5a45762492cd00e078915`.
- Visuell kontrakt: `docs/LARIA-GANGEMAGI-PREMIUM-ILLUSTRASJON-LAST-2026-10-23.md`.
- Den godkjente Tallenga-illustrasjonen er ikke lagt inn som binær fil i repoet. Arbeidet bruker derfor bare eksisterende, originale Tallenga-/Gangemagi-ressurser; ingen ekstern eller generisk illustrasjon er hentet inn.

## Konkrete avvik som ble prioritert

1. Den spillbare scenen brukte den generelle matteverdenen som bakgrunn, ikke den dedikerte Tallenga-markedsscenen.
2. Jordbærkassen hadde riktig interaksjon, men fremsto visuelt som en sekundær handlingsknapp i stedet for en fysisk kilde i markedet.
3. Mellomtilstanden i matematikken var tekstlig korrekt, men viste ikke samtidig de faktiske gruppetallene som ligger bak addisjonen.
4. Marked, kurver, jordbærkasse og rev hadde mindre tydelig felles komposisjon enn referansens brede Tallenga-scene.

## Implementert

- Den originale `gangemagi-tallenga-market-v1.svg` er nå markedsbakgrunnen.
- Kurvene er løftet fram som hovedobjekter med varm gyllen gyldig-/valgt-markering ved trykk og dra.
- Jordbærkassen er beholdt som samme ekte drag-/trykk-kontroll, men er visuelt integrert i markedet og ikke lenger duplisert som en ekstra handling under scenen.
- Mattefeltet viser alltid de reelle kurvtallene mens barnet fyller: for eksempel `3 + 2 + 0 = 5`. Multiplikasjonens svar vises først når like grupper faktisk er fylt.
- Egen responsiv komposisjon er lagt til for telefon: revens tilbakemelding øverst, deretter marked, kurver og fysisk jordbærkasse.

## Bevarte spillregler

Personlig rev, åtte oppdrag, drag/trykk/fjern/angre/hint, fri lek, Markedsbok, Gangetabellen, lagret fremgang og matematikkmotoren er beholdt uendret.

## Kontrollstatus

- Bestått: syntakskontroll, diff-kontroll og 15 Gangemagi-node-/motor-/interaksjonstester.
- Blokkert i dette arbeidsmiljøet: Playwrights Chromium og WebKit var ikke installert. Nedlasting av binærene fra Playwright CDN returnerte ugyldige/tomme arkivdata. Derfor ble det **ikke** produsert eller påstått faktiske før-/etterbilder her.
- Følgelig er visuell acceptance-test på iPad/iPhone og Chromium/WebKit fortsatt en åpen blocker. Dette må gjøres med den vedlagte originale referanse-PNG-en før PR-en kan anses klar for merge.

## Foreløpig kvalitetsvurdering

Retningen er tydeligere og nærmere den låste komposisjonen: handlingen er samlet rundt markedet, og den konkrete matematikken er mer synlig. Den er ikke premiumgodkjent ennå. Spesielt må en menneskelig side-ved-side-kontroll verifisere visuell tetthet, proporsjoner og første-fold på iPad liggende før videre beslutning.


## 23. oktober – visuell Tallenga-oppgradering
- Laget `laer-litt-mer/gangemagi-tallenga-market-premium-20261023.svg` som nytt illustrert miljø basert på eksisterende Tallenga-SVG, med steinbro, markedsbaldakiner, blomster, varmere lys og landskapsdybde. Ingen falske kurver, tall, oppgaveknapper eller rev er bakt inn i bakgrunnen.
- Koblet nytt miljø til den ekte Gangemagi-scenen i `gangemagi-dagens-oppdrag-v1.css`. iPad-oppdragstavlens vertikale padding er redusert for å gi større visuell plass til de interaktive kurvene.
- Ingen endringer i JavaScript, matematikk, personlig rev eller progresjon.
- Fremdeles draft. Chromium/WebKit- og skjermbildekontroll på commit `70b496d` er nødvendig før ny visuell vurdering, merge eller publisering.
