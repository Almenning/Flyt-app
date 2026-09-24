# Personvernarkitektur

Oppdatert 24. september 2026.

## Samtykkenivåer

- Generell personvernaksept kreves for konto, husholdning og synkronisering.
- Sensitivt samtykke er valgfritt og kreves bare for den private innsjekken «Mellom dere», som kan behandle opplysninger om lyst, intimitet og seksualliv.
- Hjem, Gjøre, vanlig dagsform, Sett og ordinær Belønning fungerer uten sensitivt samtykke.
- «Nærhet» som et ordinært dagsformbehov regnes ikke som den sensitive innsjekken.

## Standardverdier

Nye husholdninger starter uten:

- området `sex`
- statusfeltene `closeness` og `desire`
- intime belønningsforslag

## Databasegrenser

Supabase-migrasjonene `granular_sensitive_consent` og
`close_legacy_sensitive_status_paths`:

- skiller generell aksept fra sensitivt samtykke
- lar opprettelse og tilkobling av husholdning bruke generell aksept
- sperrer både nye og eldre status-RPC-er for sensitive registreringer
- redigerer bort sensitive felt når en bruker uten samtykke henter delt state
- bevarer partnerens skjulte sensitive data ved ordinær lagring
- sletter bare den aktuelle brukerens sensitive status og egenopprettede sensitive hendelser ved tilbaketrekking
- beholder konto, medlemskap, gjøremål, vanlig dagsform, anerkjennelser og ordinær historikk

## Klientatferd

Den generelle personverninformasjonen vises ved behov. Separat sensitivt
samtykke vises først når brukeren aktivt velger å åpne privat innsjekk.
Tilbaketrekking gjøres under Konto og personvern uten at kjerneproduktet
låses.
