# Fase 2–5: implementeringsrekkefølge

## Fase 2 – global chrome og navigasjon

**Først:** AppShell, TopUtilityBar, LariaBackControl og SceneNavRail.  
**Filområder:** `home-*.js/css`, `laria-navigation-v13.*`, `laria-sign-rail-v2.css`, `laria-reference-layout-v1.*`, task-shell.  
**Godkjenningskriterium:** Hjem → alle fire fag → Hjem har identisk semantikk, én synlig returhandling og ingen profil/klasse/innstillingsoverlapp på fem iPad-formater.

## Fase 3 – felles oppgaveopplevelse

**Deretter:** TaskShell, feedback, hint, resultat og troll-safe-zone.  
**Filområder:** `laria-task-scene-v15.*`, `laria-task-feedback-stable-v1.css`, `laria-troll-runtime-v1.*`, Norsk/Engelsk/Matte-adaptere.  
**Godkjenningskriterium:** Én oppgave fra hvert fag har likt chrome, feedback og tilbakeflyt uten endret oppgavelogikk.

## Fase 4 – fagvise unntak og responsiv hardening

**Rekkefølge:** Matte → Norsk → Engelsk → Geografi.  
**Avhengighet:** Fase 2–3 må være visuelt godkjent.  
**Godkjenningskriterium:** WebKit hovedreferanse og Chromium kontroll på 820×1180, 1024×1366, 1180×820, 1024×768 og 1366×1024; deretter fysisk iPad Safari.

## Fase 5 – investor-demo og beta-port

- Frys én SHA.
- Kjør samlet regressjon på samme SHA.
- Gjennomfør fysisk iPad-smoke og kort barnetest.
- Lag en kuratert demo-rute: Hjem → Norsk → Matte → Engelsk → Geografi → Samlebok.
- Først etter dette vurderes TestFlight/beta og senere offentlig release.

## Topp 10 forbedringer

1. Erstatt live Basecamp-dashboard med én godkjent Hjem-opplevelse.
2. Én tilbakekontroll overalt.
3. Én toppmeny med iPad-sikre soner.
4. Venstrestilt to-stolpe navigasjon som regel, ikke modulunntak.
5. Felles oppgaveshell og feedback.
6. Tallvika som sammenhengende mattebakgrunn i alle relevante innganger.
7. Fjern/isolér eldre rev- og avatar-CSS fra trollkontrakten.
8. Løs Nordlysleiren med riktig godkjent kilde før designpolering.
9. Egen fysisk iPad Safari-port.
10. Én investor-demo-SHA, ikke kombinasjon av publisert app og PR-er.
