# TrollActor 2.0 – teknisk beslutning

## Funn

V1 bruker én låst WebP per karakter og animerer hele flaten med CSS-transform.
Det gir liv, men ikke tydelige armbevegelser, blikk, munnformer eller en
karakterspesifikk reaksjonsregi. De eksisterende filene kan derfor ikke bli en
ekte lagdelt animasjon uten at ny karakterkunst godkjennes.

## Anbefaling

Bruk lagdelt 2D med DOM/CSS/Web Animations API, ikke canvas eller Lottie som
første produksjonsløsning. Det er lett å teste, fungerer i WebKit på iPad og
animerer bare `transform`/`opacity` på 5–7 lag. Hold én aktiv TrollActor per
scene og respekter `prefers-reduced-motion`.

| Lag | Ny, godkjent kildekunst som kreves |
| --- | --- |
| Base | kropp/bein, transparent PNG/WebP |
| Armer | venstre/høyre arm, egne transparenter med skulderpivot |
| Hode | hode/hår, separat fra kropp |
| Ansikt | øyne åpen/blunk, øyenbryn, munn nøytral/smil/åpen |
| Tilbehør | storesøsters lilla hårbånd som egen valgfri detalj |
| Scene | separat skygge, aldri en del av karakterillustrasjonen |

## Tilstander

| Tilstand | Regi | Krever nye lag |
| --- | --- | --- |
| Idle | pust, blunk, liten vektforskyvning | ansikt + kropp |
| Vinke | høyre arm vinker, smil | arm + ansikt |
| Tenke | hodehelling, blikk opp | hode + øyne/øyenbryn |
| Hjelpe | mild fremoverbevegelse, åpen hånd | arm + ansikt |
| Juble | begge armer opp, hopp, stort smil | begge armer + ansikt |
| Oppmuntre | myk nikk, varmt smil | hode + ansikt |

## Prototype og godkjenningsport

`trollactor2-prototype.js` aktiveres bare med
`?trollactor2-prototype=1`. Den bruker den nåværende Storesøster-WebP helt
uendret og merker ansikts-/armlag som skjulte, manglende slots. Den er altså en
teknisk livssyklus- og ytelsesprototype, ikke ny karakterkunst.

Før produksjon: Produkteier godkjenner en visuell layer-pack for Storesøster,
deretter eksporteres de tre identitetene med samme pivoter og filnavnsmønster.
Ingen eksisterende karakterfil erstattes før den godkjenningen.
