# Stabilisering av sesjon og usynkroniserte endringer

## Implementert

- Synkoperasjoner tilhører en bestemt innlogging og husholdning. Utlogging/kontobytte ugyldiggjør dem, avbryter forespørsler der det støttes og forkaster sene svar.
- Utlogging låses umiddelbart. SDK-feil, timeout eller Keychain-feil gir ikke en falsk bekreftelse. En ikke-hemmelig sperremarkering hindrer automatisk gjeninnlogging etter omstart frem til eksplisitt, vellykket opprydding og innlogging.
- Keychain-operasjoner serialiseres. Opprydding venter bak en allerede startet skriving; nye auth-skrivinger tillates ikke mens appen er låst.
- Etter bekreftet utlogging, utløp eller identitetsbytte lastes dokumentet på nytt for å fjerne private modulcacher og gamle dialoger. Normal synk gir ingen slik omstart.
- Usynkroniserte endringer journalføres lokalt for en bestemt bruker og husholdning før forsinket nettlagring. Etter kaldstart må konto, medlemskap og samtykkestatus bekreftes mot serveren før journalen kan vises eller spilles av. Helt frakoblet kaldstart viser ikke uverifiserte private data; journalen beholdes til nettet er tilbake.
- En kvittering i eksisterende husholdnings-JSON gjør gjentakelse av en allerede lagret operasjon trygg når serversvaret gikk tapt. Ingen ny SQL-tabell eller migrering kreves.
- Kvotefeil i enhetslagringen gir varsel om å holde appen åpen. Tidligere privat journal spilles ikke av ved endret samtykkestatus, husholdningsbytte eller utlogging.
- Den gamle oppstartshjelperen kopierer ikke lenger rått serverinnhold over gjenopprettede endringer. Den blokkerer heller ikke lagringskøen.
- Kontosletting bruker også den sikre utloggingen.

## Verifikasjon

Kjør `npm run test:node`. Atferdstestene i `session-runtime`, `native-storage-runtime` og `hydration-safety-runtime` utfører faktiske JavaScript-forløp med kontrollerte server- og Keychain-svar. De dekker sene svar, omstart, tapt svar etter lagring, feil ved opprydding, lokale kvotefeil, samtidige endringer og oppstart. De erstatter ikke testing av ekte Supabase-kontoer og fysisk iPhone.

## Publisering og manuell aktivering

`Continuous smoke checks` har en Pages-kjede som krever grønne Node- og nettlesertester på samme commit. For å aktivere den må en repo-administrator velge **Settings > Pages > Build and deployment > Source > GitHub Actions**. Kjør deretter workflowen fra main. Inntil dette er gjort, kan GitHubs gamle branch-publisering fortsatt publisere uavhengig av testresultatet. Workflowen sier uttrykkelig fra om dette; den endrer ikke administratorinnstillingen selv.

Anbefalt branch-regel: krev pull request og vellykkede `smoke`-kontroller på main. iOS-workflowen bygger også pull requests som endrer native kode eller pakkede webfiler.

## Fortsatt gjenstående

- Fysisk iPhone: Keychain under låsing, appbytte/tvangsavslutning, to kontoer og to enheter, nettutfall/gjenoppkobling og utlogging.
- Supabase Leaked Password Protection er fortsatt utsatt; ingen Pro-bestilling eller backendinnstilling er endret.
- Offentlig SMTP, bekreftet behandlingsansvarlig/supportkontakt, signering og TestFlight må avklares separat. Ingen juridiske eller driftsmessige fakta er antatt i denne rettingen.
