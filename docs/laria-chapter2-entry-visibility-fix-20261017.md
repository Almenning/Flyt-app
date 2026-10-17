# Læria kapittel 2: feilretting for synlig eventyrinngang

Dato: 17. oktober 2026. PR #169, arbeidsgren `feat/laria-chapter2-easy-start-english-geography-20261017`.

## Reprodusert problem
En dedikert Geography Chapter 2 Playwright/WebKit-test på PR-head `b6a16f6` feilet før kartet kunne åpnes. Knappen `#laria-geography-chapter2-entry` hadde `hidden=false`, publiseringsmetadata `published:true` og `artApproved:true`, men beregnet CSS hadde `display:none`, og den hadde null geometri. Dette viste at den nye kapittelinngangen ikke var tilgjengelig selv om den underliggende kapittelmodellen var aktiv.

## Rotårsak
`laer-litt-mer/laria-responsive-phaseb.css` inneholdt gamle fullskjermsselektorer som skjulte **alle** direkte barn av det låste reisekartets kontainer unntatt originalkartet, via `:not(#journey-map)` / `:not(#geo-journey-map)`. De dekket også de nye, selvstendige knappeinngangene på smale skjermer og i liggende visning. Problemet ble ikke løst ved å fjerne `hidden` i JavaScript.

## Rettelse på utviklingsgrenen
- Unntar bare `#laria-english-chapter2-entry` og `#laria-geography-chapter2-entry` fra disse fire bevisst avgrensede map-only-selektorene.
- Gir de synlige, publiserte inngangene en rolig premiumkort-stil med kontrast, skalerbar tekst, tastaturfokus og berøringsstørrelse. CSS-reglene bruker `:not([hidden])` slik at skriptets skjulte tilstander respekteres.
- Lar det originale reisebildet og dets interaktive markører forbli uendret. Ingen endring av globus, Samlebok, Gangemagi eller brukerfremgang.
- Utvider de to dedikerte Playwright-testene slik at de krever synlige, reelle inngangsknapper med minst 44px høyde og tilstrekkelig bredde, ikke bare at DOM-elementene finnes.

## Verifisering og release-port
Forrige head hadde en bekreftet rød Geography-kjøring. Rettelsen er commitet som `d7225b7`, nye testkrav `2dcc913` og `044d9bc`. På dette tidspunktet er **ny CI ennå ikke bekreftet grønn**. Kontroller eksakt siste head og visuelle WebKit-artifakter før noen merge.

Det finnes også en egen dokumentert kunstport i `docs/laria-chapter2-painterly-candidate-v2.md`. Ikke behandle `artApproved:true` som verifisert kunstgodkjenning bare fordi koden setter flagget; oppfølging av bilder og faktisk opplevelse på iPhone/iPad gjenstår. Draft PR beholdes, og ingen produksjonspublisering gjøres av denne rettelsen.

## Samkjøring og oppfølging etter malerisk bildefeil
- Synkronisert på ekte merge-commit `f3204fa40f38c7bac9311e1e212e41b845a690bc` med oppdatert `main`: beholder Ordjakt med synlig personlig rev og nattkontrollen i `.github/workflows`. PR hadde deretter ingen commits etter `main` som måtte inn.
- Den nye CI-kjøringen på `f3204fa` avdekket at både engelsk og geografis publiserbare malerier falt tilbake til `storybook-v1.svg` i Chromium. De øvrige ferdige kvalitetsjobbene var grønne, men de to spesialtestene feilet. Dette betyr at de nye kartene **ikke var bekreftet lastet**.
- Innlasting er rettet til å vente på et faktisk bilde-`load` eller `error` fremfor å behandle `complete=true` og null naturlig bredde som en feil. Ved reell feil er fallback fortsatt aktiv og registrerer `data-sh-art-failure` / `data-cv-art-failure`.
- Kunstkontrakten var unødig låst til nøyaktig 960×1280 rasterpiksler. Figma-visningen kan være eksportert i en nedskalert 3:4-variant. Ny kontroll aksepterer derfor bilde med korrekt 3:4-forhold og minst 768×1024 piksler, mens v2-SVG fortsatt må være nøyaktig 800×1000. Dette er en **funksjonell** minstekvalitet, ikke endelig godkjenning av malerisk premiumkunst.
- De dedikerte Chromium/WebKit-testene leser nå PNG-header fra GitHub-filene (faktisk bredde/høyde), krever denne dimensjonskontrakten, venter på ferdig bildeavkoding og viser forklaring dersom fallback fortsatt inntreffer.
- Den synlige `INTERN TEST`-merkingen er nå erstattet med `ENGELSK · EVENTYR 2` / `GEOGRAFI · EVENTYR 2` når kapittelet er publiseringsaktivert i utviklingsgrenen. Merkingen finnes fortsatt for upubliserte utviklingsvarianter.
- Safari-kildehenvisninger i `index.html` er versjonsoppdatert. Eksakt siste kode-head ved denne loggføringen er `b0dab47743d023d4c6de86a04f94058c40a4df18`.

**Fortsatt sperret:** Ingen flette/publisering før den nye CI er grønn på eksakt kode, kunstfilene er vurdert i faktisk WebKit-skjermbilde mot Lærias fire låste originalreiser, og appens øvrige tester er grønne. `CHAPTER.published=true` og `artApproved=true` inne i en **Draft**-gren er ikke en reell produksjonsgodkjenning.
