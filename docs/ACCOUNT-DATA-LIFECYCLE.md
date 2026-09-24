# Konto, logout og lokal datahåndtering

## Lokal enhet

Husholdningsstate leses ikke lenger fra en global enhetscache ved oppstart.
Når en innlogget husholdning trenger en kortvarig lokal kopi, ligger den under
`flyt_state_v6:<user_id>:<household_id>`. Den brukes aldri før Supabase har
identifisert både bruker og husholdning.

Følgende data slettes ved logout, frakobling og kontosletting:

- `flyt_state_v5` og alle `flyt_state_v6:*`-oppføringer
- private oppgavelister
- lokale historikkmarkeringer og dagsform-popupmarkeringer
- lokal modus og Supabase-økten

Service-worker-cachen inneholder kun versjonerte appfiler. Den lagrer ikke
API-svar eller husholdningsdata.

## Logout med endringer som ikke er synkronisert

Logout stopper pågående lagring, fjerner lokale persondata og avslutter bare
den lokale Supabase-økten (`scope: 'local'`). Ulagrede endringer forkastes
bevisst: det er tryggere enn å la privat data bli liggende på en delt enhet.

## Kontosletting

`delete_my_account()` bruker `auth.uid()` som autoritativ identitet. Den:

- sletter brukerens egne strukturerte rader (status, tilbakemeldinger,
  profilkort, planer, treningsdata og eldre relasjonssignaler)
- fjerner brukerens medlemskap
- beholder partnerens konto og medlemskap
- fjerner eller anonymiserer brukerens referanser fra delt JSON-state
- sletter `profiles` og til slutt `auth.users`

Nye state-hendelser får `actorUserId`, mens `memberIds` knytter historisk
visningsnavn til stabil konto-ID. Eldre state som kun har visningsnavn renses
med en kontrollert kompatibilitetsregel.

## Testet serverflyt

Testet i transaksjoner som rulles tilbake:

1. sensitivt samtykke trekkes tilbake: bare egen sensitiv status slettes,
   ordinær partnerstatus beholdes
2. sletting med partner: slettet konto, medlemskap og egne data forsvinner;
   partnerens konto, medlemskap og egne anerkjennelse beholdes
3. sletting uten partner: konto og solo-husholdning slettes
