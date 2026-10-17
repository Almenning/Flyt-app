# Læria nattkontroll uten AI-kvote

## Formål
Automatisk teknisk kvalitetssikring fra GitHub Actions, ikke selvstendig AI-koding.

## Oppsett
- Kjøres fra GitHub Actions ved UTC 21:17, 00:17, 03:17 og 06:17. Dette tilsvarer 23:17/22:17, 02:17/01:17, 05:17/04:17 og 08:17/07:17 i Norge, avhengig av sommer-/vintertid.
- Manuell start med workflow_dispatch.
- Tester siste main ved oppstart med Node, WebKit og Chromium.
- Ordjakt, Gangemagi, reiseflyt, Basecamp og enhetskontroll.
- Lagrer logger, skjermbilder og resultatoversikt i Actions-artefakter i 14 dager.
- Oppretter eller oppdaterer én GitHub-issue med siste rapport. Eventuelle tester som feiler markeres i rapporten.
- Endrer ikke kildekode eller appdata; fletting og produksjonspublisering er eksplisitt utelatt.

## Begrensninger
- Dette bruker ikke Codex, ChatGPT Work eller et betalt AI-API. GitHub Actions har egne ressurs- og policybegrensninger.
- GitHub scheduled workflows kan være forsinket, spesielt ved høy belastning.
- WebKit i CI er ikke Safari på fysisk iPad/iPhone.
- En bestått teknisk test innebærer ikke at illustrasjonene er premiumgodkjent.
- Issue oppdateres ved hver kjøring. Gamle kjøringer finnes i Actions-historikken og tilhørende artefakter.

## Hvordan aktivere
Når workflow-filen er flettet inn i standardgrenen main blir den planlagte kjøringen aktiv. Den kan også kjøres manuelt fra Actions-fanen.
