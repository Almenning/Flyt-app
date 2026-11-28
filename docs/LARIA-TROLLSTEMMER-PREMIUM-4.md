# Læria Premium 4: isolert test av trollstemmer

**Kandidat, ikke en produksjonsaktivering.** PR [#278](https://github.com/Almenning/Flyt-app/pull/278) hadde en separat testflate oppå eldre Hjem. Den var ikke på main `834d3208`. Denne utgaven bruker den nyeste TrollActor-runtime som inngang og beholder all Hjem-kunst og -navigasjon uendret.

## Prøv på fysisk enhet

1. Åpne kandidatens `/laer-litt-mer/?app=laria&lariaTrollVoiceTest=1` på en fysisk iPad, og fullfør eventuell onboarding med en syntetisk lokal profil.
2. På Hjem velger du **Test trollstemmer**. Lytt til hvert troll. Ingen lyd starter når panelet åpnes.
3. Test **Stopp**, bryteren **Stemmetest på** og **Lukk**. Trekk Safari/PWA ut av forgrunnen midt i en replikk. Replikken skal stoppe, og opplesning i en påfølgende læringsoppgave skal virke.
4. Prøv ordinær kandidatadresse uten flagget. Det skal ikke finnes en testknapp, og stemmetestmodulen skal ikke lastes. Gjenta gjerne trykktesten på iPhone.

| Profil | Replikk | Pitch | Rate |
| --- | --- | ---: | ---: |
| Storesøster | Bra jobbet! Du klarte det. | 0,90 | 0,85 |
| Lillesøster | Wow, se på deg! Dette var flott! | 1,25 | 1,00 |
| Lillebror | Hehe, jeg heier på deg! | 1,15 | 1,05 |

Testen prioriterer lokalt bokmål (`nb-NO`), deretter lokal norsk eller nynorsk. Enheten må rapportere `localService === true`. Finnes det ikke en slik stemme, viser den en beskjed og venter på et nytt trykk; ingen ekstern stemme velges. Stemmene hentes på nytt ved trykk, slik at en forsinket stemmeliste ikke trenger en sideoppdatering. Det brukes ingen betalt taleleverandør eller mikrofontilgang, og testen leser ingen opplysninger fra barneprofilen. Stemmevalget og av/på-bryteren gjelder bare denne testflaten.

`SpeechSynthesis.cancel()` tømmer hele nettleserens talekø. Testen venter hvis annen opplesning pågår, avbryter bare det testpanelet selv har startet, og gir slipp på eierskapet før den eksisterende læringsopplesningen selv tømmer køen. Dialogen er tastaturstyrt, har synlig fokus, minst 44 px trykkflater og sikres på navigasjon eller bakgrunnsbytte.

## Automatisert kontroll og godkjenningsgrense

- `node --test tests/laria-troll-voice-audition.test.mjs`: lokal stemmeseleksjon, profiler, kø- og stoppregler, utilgjengelighet og sene hendelser.
- `node tests/laria-troll-voice-audition.playwright.js`: Chromium og WebKit mot ekte app med simulert talegrensesnitt og berøringsviewport 820 × 1180, 1180 × 820 og 390 × 844. Start lokal HTTP-server i repo-roten; standard er port 8765, ev. `LARIA_VOICE_URL`. Med `LARIA_VOICE_SHOTS` og `LARIA_HEAD_SHA` navngis bevis etter commit, motor, viewport og flagg.
- Tekniske tester verifiserer meldinger, replikker, parametre, brukertilstand og lydisolasjon. De beviser ikke at valgt stemme er installert på eierens iPad, at stemmene høres naturlige eller tilstrekkelig forskjellige ut, eller at native iOS/Safari leverer hørbar lyd. Fysisk avlytting og eiergodkjenning gjenstår før ordinær bruk.

Primære referanser: [Web Speech API om lokale stemmer, hendelser og kø](https://wicg.github.io/speech-api/#tts-section) og [WebKits implementasjon av taleaktivering](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/speech/SpeechSynthesis.cpp).
