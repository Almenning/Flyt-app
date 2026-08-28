# Flyt – beta readiness 27.08.2026

## Konklusjon

**Klar for en kontrollert, lukket beta med et lite antall håndplukkede par. Ikke klar for bred offentlig lansering ennå.**

Denne gjennomgangen gjelder teknisk stabilitet, konto/innlogging, datatilgang, personvern, sletting og praktisk beta-drift. Den er ikke en juridisk sertifisering eller en full penetrasjonstest.

## Status

| Område | Status | Vurdering |
| --- | --- | --- |
| Supabase drift | 🟢 | Prosjektet er aktivt og friskt. Aktive appkall har i hovedsak svart 200/204. |
| Konto og innlogging | 🟢 | Opprett konto, e-postinnlogging, øktfornyelse, utlogging og glemt passord finnes. |
| Par-kobling | 🟢 | Husholdning opprettes av én bruker og partner kobles på med invitasjonskode. Maks to medlemmer håndheves. |
| Isolasjon mellom husholdninger | 🟢 / 🟡 | RLS og RPC-ene er gjennomgått og avgrenser data etter innlogget bruker/husholdning. En separat dynamisk test med to disponible husholdninger bør gjøres før betaen utvides. |
| Direkte anonym tilgang | 🟢 | Anon har ikke direkte tilgang til husholdnings-, profil- eller statusdata. Unødvendige tabellprivilegier er fjernet. |
| Sensitive samlivsdata | 🟢 | Eksplisitt samtykke kreves før skybasert husholdningsdata kan brukes. Partnerstatus og andre delte kontekster returnerer ikke data uten gjeldende samtykke. |
| Trekke tilbake samtykke | 🟢 | Selvbetjent funksjon finnes. Egen status, egne behov og egne registreringer i de mest sensitive samlivsfunksjonene fjernes, og skyfunksjonen låses frem til eventuelt nytt samtykke. |
| Slette konto | 🟢 / 🟡 | Selvbetjent permanent sletting finnes. Egen konto og egne data fjernes; hvis partneren blir igjen, overføres husholdningen og gjenværende navnehenvisninger anonymiseres. Bør destruktivt ende-til-ende-testes med disponible testkontoer. |
| Personverninformasjon | 🟢 | `privacy.html` forklarer data, formål, deling, samtykke, EU-lagring, sletting og rettigheter, og har nå identitet og kontaktinformasjon for behandlingsansvarlig i betaen. |
| Beta-tilbakemelding | 🟢 | Tilbakemeldingsfunksjon finnes i appmenyen og lagrer melding med begrenset teknisk kontekst. |
| Lokal modus | 🟢 | Lokalmodus er skjult i ordinær beta-inngang slik at testerne faktisk tester par/synk-flyten. |
| Passord i beta-UI | 🟢 / 🟡 | Ny bruker må velge minst 10 tegn i beta-grensesnittet. Supabase-planen tillater foreløpig ikke server-side minimum 10 tegn eller Leaked Password Protection; dette er akseptert som begrenset risiko i en liten, håndplukket beta. |
| Automatisk smoke-test | 🟢 | JavaScript-syntaks, statiske appkontroller, Home-startup og Sett-arkiv testes ved push. |
| GitHub Pages | 🟢 | Siste Pages-deploy er grønn. |
| Samtidige endringer fra to telefoner | 🟡 | Hele husholdningsstaten lagres fortsatt som ett JSON-dokument. Nesten samtidige endringer kan i prinsippet gi siste-skribent-vinner. Må overvåkes i beta og løses før større skala. |
| Legacy + moderne UI | 🟡 | Eldre inline-logikk og nyere UI-moduler eksisterer parallelt. Guard-laget holder dagens aktive flyt stabil, men strukturen øker regresjonsrisiko. |
| Synk | 🟡 | Polling hvert femte sekund fungerer, men er ikke endelig skaleringsarkitektur. |
| Invitasjonskode | 🟡 | 8 heksadesimale tegn er akseptabelt for en liten, håndplukket og autentisert beta, men bør styrkes før bred selvbetjent distribusjon. |

## Endringer gjort før beta

- Innført versjonert beta-samtykke og separat uttrykkelig samtykke for sensitive samlivsopplysninger.
- Skybaserte husholdningsfunksjoner krever gjeldende samtykke.
- Lagt til `Konto og personvern` i appmenyen.
- Lagt til selvbetjent tilbaketrekking av samtykke.
- Lagt til selvbetjent permanent kontosletting.
- Lagt til offentlig personvernside for betaen med behandlingsansvarlig og kontaktinformasjon.
- Skjult lokalmodus fra ordinær beta-inngang.
- Økt minimumslengde på nye beta-passord i grensesnittet til 10 tegn.
- Strammet databaseprivilegier og verifisert at anon ikke har direkte tilgang til husholdningsdata.
- Beholdt eksisterende beta-feedback og automatisk smoke-workflow.

## Før første eksterne par inviteres

1. **Lag fire disponible testkontoer i to separate husholdninger** og verifiser at husholdning A ikke kan lese eller endre husholdning B. Bruk de samme kontoene til å teste samtykketrekking og permanent sletting ende til ende.
2. Når dette er grønt, inviter **3–5 par** først. Utvid til 5–10 par når de første dagene ikke viser data-/synkfeil.

Supabase-funksjonene `Leaked Password Protection` og server-side minimum 10 tegn krever Pro-plan og er derfor utsatt. Flyt-grensesnittet krever fortsatt minst 10 tegn for nye beta-passord.

## Foreslått første betaperiode

**14 dager.** Testerne bør få svært lite instruksjon. Målet er å finne ut om Flyt fungerer som et naturlig system i en vanlig hverdag, ikke om de klarer å følge en opplæringsmanual.

Følg særlig med på:

- at begge i paret kommer inn og kobler seg uten hjelp,
- at begge faktisk bruker appen i løpet av den første uken,
- at minst én parfunksjon utover bare gjøremål blir brukt, for eksempel Sett, status/behov eller Fristelser,
- at ingen opplever tap av data eller data fra feil husholdning,
- om Flyt oppleves å gi bedre oversikt, synliggjøre bidrag og redusere behovet for masing eller muntlig koordinering.

## Kjente forhold som ikke skal «hurtigfikses» før første lille beta

- Normalisering av hele husholdningsstaten.
- Realtime i stedet for polling.
- Full opprydding av legacy-kode.
- App Store-publisering.
- Abonnement/betaling.
- AI-funksjoner.
- Omfattende produktanalyse/telemetri.

Disse tingene bør styres av det vi faktisk lærer fra de første parene. Det er billigere enn å bygge elegant infrastruktur rundt antakelser.