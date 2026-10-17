# Læria: teknisk kapittel-2-gate etter integrasjon

Dette dokumenterer skillet mellom implementert kode og faktisk publisert eventyr.

- Grunnlag: teknisk integrasjon til `main`, commit `7d7bd79` (PR #159). Fire kapitler finnes i kildekoden, men skal ikke vises i ordinær barnenavigasjon.
- Tilgjengelig i intern testing: Norsk `chapter2-preview=1`, Matte `math-chapter2-preview=1`, Engelsk `english-chapter2-preview=1`, Geografi `geography-chapter2-preview=1`.
- Alle `published` og `artApproved`-flagg for kapittel 2 er `false`. Dette skal være uendret frem til innhold, kart, oppgaveflyt og visuell kvalitet er godkjent.
- Testen `tests/laria-four-chapters-integration.playwright.js` kontrollerer nå også normal navigasjon uten testparametere i Chromium og iPhone WebKit. Full test med parametere kontrollerer spillbarhet og progresjon.
- De maleriske, opprinnelige kartene Bokskogen, Tallenga, Ordlandsbyen og Nordlysleiren beholdes uendret.
- Fortellingsdalen har malerisk intern kandidat, mens Mønsterhagen, Setningshavna og Kontinentseilasen trenger premiumgodkjent illustrasjon, nøyaktig kartstopp-geometri og faktisk iPhone/iPad-visuell vurdering før barn får se dem.
- Utviklerflagg er visningssperrer i brukergrensesnittet, ikke en autentiseringsmekanisme. Ikke lagre sensitiv data eller hemmelige ressurser bak URL-parametere.
- Den automatiserte utviklingen skal lese fersk `main` og CI før hvert nytt trinn. Ikke omgå testene eller merk en kandidat som publisert ut fra antagelser.

**Åpning av ordinær barneinngang** krever ny, eksplisitt beslutning, etter godkjent original illustrasjon og beståtte regresjonstester på eksakt commit.
