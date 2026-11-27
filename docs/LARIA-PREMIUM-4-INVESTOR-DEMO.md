# Læria: investor-demo og faktisk skjermbevis

Denne sekvensen bruker den faktiske appen. Den simulerer ikke betaling, barnets mestring eller fremgang. Bruk et nytt privat nettleservindu og den syntetiske profilen **Demo Læria**, 2. trinn, med Lillesøster. Ikke bruk en virkelig barneprofil.

## Fire minutter som viser hva produktet kan

1. **La publikum møte Læria som ny bruker.** Velg Lillesøster og 2. trinn på den ordinære oppstartsskjermen. Gå inn i Grovanova. Vis forskjellen mellom et fagskilt, Reisen og Fortsett reisen der disse er synlige.
2. **Vis én læringssløyfe.** Åpne Matte, og trykk «Gangemagi». Velg et bær og en kurv, så investoren ser mengden endre seg. Gå tilbake og åpne «Neste eventyr». Løs den korte økta, og vis ekte reiseprogresjon etter fullføring. Hvis tiden er knapp, vis ett svar og si tydelig at resten av økta ikke ble gjennomført.
3. **Vis en oppdagelse uten press.** Åpne Geografi, deretter Kloden. Søk på Norge og bruk «Lær mer om Norge». Vis hva barnet kan finne på egen hånd, uten å omtale landet som «mestret». Hvis atlaset ikke er klart, bruk Land og flagg, ikke en skjermdump som erstatter appen.
4. **Avslutt hos familien.** Vis Samleboken og Mine troll. Åpne voksenområdet med et langt trykk. Presenter observerbar aktivitet som øving, ikke bevis på læring. Eventuell abonnementsskjerm vises uten å gjennomføre eller love kjøp.

**Hva vi vil undersøke hos ekte brukere:** Om et barn finner en aktivitet uten instruksjon, forstår hva som skjedde etter et svar, og vil åpne appen igjen; om foreldrene forstår hva appen tilbyr uten at lokal progresjon fremstilles som en sikker pedagogisk vurdering. Ambisjonen om minst 1 000 betalende familier er et mål, ikke et resultat.

## Gjenta målinger og skjermbilder

Kjør fra repository-roten. Ha Playwright med Chromium og WebKit installert i testmiljøet.

```sh
python3 -m http.server 8765 --bind 127.0.0.1
# I en annen terminal:
QA_URL='http://127.0.0.1:8765/laer-litt-mer/?app=laria' \
  LARIA_DEMO_SHOTS=/tmp/laria-demo \
  node tests/laria-premium4-investor-demo.playwright.js
```

Standard: iPad stående 820 × 1180, iPad liggende 1180 × 820, iPhone 390 × 844 med mobil- og berøringsemulering, Mac/PC 1440 × 900. Velg `LARIA_DEMO_ENGINE=chromium` eller `webkit` for ett motorløp. `LARIA_DEMO_VIEWPORT=820x1180,390x844` velger størrelser. `LARIA_DEMO_EXTENDED=1` legger til de øvrige definerte iPad-, telefon- og PC-formatene. `LARIA_CHROMIUM_PATH` kan peke til eksisterende Chromium.

Skjermbildene er urørte bilder fra fungerende nettleser og navngitt med nettlesermotor, CSS-viewport, orientering og commitprefiks. JSON-manifestet inneholder full SHA, hvert observerte skjermsteg, eventuelt avvik og HTTP-feil fra den lokale appen. Start serveren fra samme, ren kandidatcommit som testen kjøres fra. Testen bruker ingen nye feature flags, oppretter profilen gjennom brukergrensesnittet, sperrer eksterne nettverkskall og kjører med redusert bevegelse og service worker deaktivert. Atlas/geografi bruker da dataene som følger appen. Det verifiserer ikke iOS-lyd, native ytelse, service worker/offline, betaling, ekstern databerikelse eller fysisk berøring.

Ikke presenter en kjøring med feil som en grønn kvalitetsport. Hold benchmark, visuell vurdering og de faktiske passerte brukerhandlingene adskilt. Investordemo erstatter ikke lanseringsgodkjenning.
