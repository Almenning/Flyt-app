# Læria Engelsk / Kinnaklova – visuell kunstkontroll

**Dato:** 26. oktober 2026  
**Vurdert PR:** [#229](https://github.com/Almenning/Flyt-app/pull/229)  
**Eksakt vurdert commit:** `eb3754c89b5d712e318efa935c4fcf8eb6f5a80f`  
**Beslutning:** **IKKE GODKJENT FOR PUBLISERING**. Komposisjonen er fortsatt låst og delgodkjent. Kunstporten skal forbli lukket.

## Vurdert materiale

1. Låst originalillustrasjon i Læria Library: `laria_kinnaklova_visual_reference_locked_except_trolls_20261026.png` (1672 × 941 px). Referansehash er registrert i `LARIA-KINNAKLOVA-VISUAL-LOCK-2026-10-26.json`. Råbyte-materialisering var ikke tilgjengelig, så SHA-256 er **ikke uavhengig kontrollert i denne vurderingen**.
2. Fotoreferansen `Kinn kyrkje og Kinnaklova - foto Visit FjordKysten(1).jpg`, for topografi og landemerker.
3. Tidligere billedvarianter: `Oppdag Kinnaklova med trollbarna.png`, `Oppdag Kinnaklova med trollene(1).png`, `Oppdag Kinnaklova med trollene.png`, `kinnaklova-mask-v2-preview.png`. Disse er **ikke** godkjente mastere. De to alternative motivene endrer perspektiv, skilt eller figuridentitet; maske-preview har fortsatt avviste troll.
4. Karakterreferansen `locked-troll-source-pose-comparison.png`, med låste kildefiler og identitet for storesøster, lillesøster og lillebror. In-world-pilot av storesøster ble vurdert som separat art, ikke som bevis for godkjent integrasjon.
5. Faktiske automatiserte WebKit- og Chromium-skjermbilder i [GitHub Actions-artifact for commit `eb3754c`](https://github.com/Almenning/Flyt-app/actions/runs/40380138946/artifacts/12679076557), blant annet `webkit-ipad-landscape-firstfold.png`, `webkit-ipad-portrait-firstfold.png`, `webkit-iphone-portrait-firstfold.png`, `webkit-ipad-landscape-reading.png` og `webkit-iphone-portrait-reading.png`. Dette er nettlesersimulatorer, ikke fysiske iOS-enheter.

## Kunstfaglig bedømmelse

| Kriterium | Beslutning | Faktisk funn |
| --- | --- | --- |
| Kinnaklovas landskapsform, Kinn kyrkje og lokalisering | **DELGODKJENT / LÅST** | Den opprinnelige illustrasjonen bevarer gjenkjennelig kløft/tvillingtopper, kirke, gravsted, klokketårn, sjø og rødt hus. Det er denne komposisjonen som skal beholdes, ikke en nytolkning. |
| 2.5D-illustrativ helhet, lys og farge | **DELGODKJENT / LÅST** | Sterk dybde, lesbar silhuett og konsistent lys/farge i originalen. Eventuelle retusjer skal ikke endre dette. |
| Aktivitetsplassering, malte skilt, sti, tittel og logo | **DELGODKJENT / LÅST** | Originalen har en samlet visuell fortellerstruktur med Words, Sentences, Reading og stiplet sti. Skiltene skal forbli identiske. |
| Tre karakterer og identitet | **IKKE GODKJENT** | Originalens tre troll er eksplisitt forkastet og fortsatt innbakt i referansebildet. Godkjente kildetroll er ikke vist ferdig integrert i en ren Kinnaklova-scene. |
| Retusj / pikselintegritet | **IKKE DOKUMENTERT** | Renset, tapsfri Kinnaklova-master mangler i repository. Uten kandidat kan verken lokale maskeforandringer eller bevaring av låste skilt dokumenteres. |
| Ferdig Kinnaklova-hub på iPad | **IKKE GODKJENT** | WebKit-skjermbildet viser en stor lys plassholder med melding om manglende låst illustrasjon, etterfulgt av fungerende aktivitetskort. Det er ikke en ferdig premium-eventyrscene. |
| Ferdig Kinnaklova-hub på iPhone | **IKKE GODKJENT** | Telefonvisningen viser samme plassholder. Kortene er lesbare, men den bærende visuelle opplevelsen mangler. |
| Engelsk Reading-kort og teksthierarki | **FUNKSJONELL VISUELL KONTROLL BESTÅTT** | Historien kommer før spørsmålet, svarflater og opplesningsknapp er synlige på de vurderte WebKit-skjermbildene. Oppgavescenens generiske eventyrhavn er ikke samme sted som Kinnaklova; helhetlig sceneretning må vurderes ved sluttreview. |

## Konklusjon og beslutning

**Publiseringsgodkjenning NEI.** Ikke sett `implementation.clean_master_visual_approved` eller `implementation.release_approval` til `true`. Ikke fjern `kinnaklova-art-release-gate` og ikke flett PR #229 til `main` på grunnlag av funksjonelle grønne tester. Vurderingen over fornyer **ikke** brukerens karaktergodkjenning; de tre originale trollene forblir eneste autoriserte identitetskilder.

## Nøyaktig gjenstående akseptanse

1. Legg frem **råfilen** til den låste originalen og et renset 1672×941-bilde i et autorisert arbeidsmiljø.
2. Fjern samtlige tre avviste troll og ekstremiteter; reparer kun bakgrunnen innenfor avgrensede masker uten å endre skiltene. Kjør `tools/kinnaklova/verify_locked_scene.py` på den faktiske rensede filen og den faktiske originalen.
3. Integrer de **identitetsgodkjente** storesøster-, lillesøster- og lillebror-kildene som separate lag. Kontroller stil, perspektiv, belysning, skygger, størrelsesforhold og at ingen godkjente detaljer dekkes.
4. Ta nye skjermbilder fra eksakt HEAD i WebKit, iPhone/iPad stående og liggende. Godkjenn **faktisk ferdig bilde** på samtlige; kontroller også at berøringsflater treffer de malte skiltene og at mobilkort fortsatt fungerer.
5. Først etter visuell godkjenning, samsvar mellom faktisk eksportert asset og SHA-256, samt grønn relevant CI, kan release-flaggene vurderes satt til `true` og PR publiseres.

**Ingen nye motiver, trollvarianter eller pikselmodifiserte landemerker er godkjent gjennom denne kontrollen.**
