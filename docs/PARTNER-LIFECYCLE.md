# Partnerlivssyklus

## Produksjonsregel ved frakobling

«Koble fra partner» er en husholdningsoperasjon, ikke kontosletting.

- Begge medlemskap fjernes atomisk ved at den delte husholdningen slettes.
- All tilgang til husholdningsstate, status og hendelser opphører i samme transaksjon.
- Den aktive invitasjonskoden forsvinner med husholdningen og kan ikke brukes igjen.
- Begge profiler og innlogginger beholdes.
- Begge brukere kan deretter opprette eller bli med i en ny husholdning.

Den gamle fellesstaten kopieres ikke til hver sin konto. Staten inneholder innhold fra begge brukere, og en automatisk kopi ville gitt uforutsigbar tilgang til tidligere partners data. Brukeren får denne konsekvensen forklart og må skrive `KOBLE FRA` før operasjonen utføres.

En minimal sikkerhetslogg lagrer husholdnings-ID, berørte konto-ID-er, initiativtaker og tidspunkt i inntil 90 dager. Den inneholder ikke gjøremål, meldinger, historikk eller annet husholdningsinnhold, og er ikke tilgjengelig fra klienten.

## Invitasjoner

- Nye koder har 12 heksadesimale tegn og 48 bits tilfeldighet.
- Koden utløper etter sju dager.
- Koden blir ugyldig etter vellykket innmelding.
- «Lag ny invitasjonskode» ugyldiggjør forrige kode.
- Bare en husholdning med nøyaktig ett medlem kan lage kode.
- Rotasjon kan ikke gjentas oftere enn hvert 30. sekund.
- Mislykkede innmeldinger begrenses til åtte forsøk per 15 minutter per innlogget konto. Deretter blokkeres nye forsøk i 30 minutter.
- Ugyldig, utløpt og allerede brukt kode gir samme eksterne feiltilstand.

## Databasegrense

Migrasjonen `partner_lifecycle_and_secure_invites` innførte:

- `households.invite_created_at` og `households.invite_expires_at`
- `join_household_v2(text)`
- `rotate_household_invite()`
- `disconnect_partner()`
- privat rate-limit-state og privat frakoblingslogg

RPC-ene krever autentisert bruker og gjeldende generell personvernaksept. De private tabellene har RLS aktivert og ingen klienttilgang.

## Verifikasjon

Servertesten bruker to midlertidige kontoer i en transaksjon og ruller tilbake alt testinnhold. Den verifiserer kodebytte, utløp av gammel kode, sammenkobling, frakobling, sletting av fellesdata, bevaring av begge profiler og at begge kan kobles inn i en ny husholdning. En separat transaksjon verifiserer at det åttende ugyldige kodeforsøket aktiverer serverblokkering.
