# todo

En beständig uppgiftslista i `.claude/todos/`, som både jag och du läser och skriver.

## Listan

En fil per uppgift, `.claude/todos/<id>.md`:

```markdown
---
id: fixa-ripgrep-sokvagen
status: open
created: 2026-09-19
---

Sätt todo-tree.ripgrep.ripgrep till /usr/bin/rg.

Detaljer på raderna efter rubriken, om det behövs.
```

`status` är `open`, `doing` eller `done`. Rubriken är brödtextens första rad —
det finns inget `title:`-fält.

**Så här använder du den:**

- Läs med `ls .claude/todos/` eller `grep -l 'status: open' .claude/todos/*.md`.
- Lägg till genom att skapa en ny fil. Filnamnet utan `.md` blir `id`.
- Ändra läge genom att skriva om raden `status:` — **och inget annat i filen**.
  Texten kan vara handskriven, och den ska överleva.

**Den här listan är inte din TodoWrite-lista.** TodoWrite är kortlivad och dör med
sessionen: använd den för stegen inom en körning. Den här katalogen är det som ska
finnas kvar imorgon. När något dyker upp som inte blir gjort idag hör det hemma här.

## Förståelsebroms

Det här projektet finns för att bygghastigheten sprungit ifrån inlärningen. Koden
skrivs fort; att begripa den tar lika lång tid som det alltid har gjort. Därför
gäller följande i det här repot, och det väger tyngre än att komma vidare snabbt:

**När du förklarat något och jag kvitterar med "jag förstår", "okej", "aha" eller
liknande — ställ en kontrollfråga innan vi går vidare.** En enda fråga, om det som
just förklarades, formulerad så att jag måste säga det med egna ord. Skriv ingen
kod förrän jag svarat.

Sitter svaret inte: förklara enklare och ställ **samma fråga igen**. Sitter det
fortfarande inte: förklara som för ett barn, och ställ frågan igen. Stegen är en
loop, inte en rutschkana — varje förklaring följs av frågan tillbaka.

Sista steget går uppåt. När bilden sitter: be mig säga det i kodens termer. En
metafor jag kan återberätta men inte koppla till en rad kod är inte förståelse.

En gissning räcker för att gå ner ett steg. "Vet inte" gör det inte — det är
ansträngningen att leta i minnet som får något att fastna, så jag ska alltid
försöka svara först, även när svaret blir fel.
