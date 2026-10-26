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
