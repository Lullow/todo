---
id: global-uppgiftslista
status: open
created: 2026-09-19
---

Lägg till en global uppgiftslista vid sidan av de projektbundna.

Behovet är belagt: fixa-ripgrep-sokvagen-i-todo-tree ligger i det här projektets
katalog men handlar om VS Code-konfigurationen på maskinen, inte om todo. Den
hamnade där för att det var katalogen som fanns.

Datalagret behöver inte ändras. todosDir(root) bygger <root>/.claude/todos, så
readTodos(os.homedir()) ger ~/.claude/todos/ med samma format, parser och
skrivning. Arbetet ligger i tree.ts och extension.ts: läsa två källor, hålla isär
dem i trädet, och markera vilka rader som är globala. 40-60 rader.

**Vänta tills kor-listan-skarpt-nagra-dagar är avklarad.** Den öppna frågan är
inte om en global lista vore användbar, utan om filerna används alls i stället
för TodoWrite. Två listor innan det är besvarat dubblar ytan på något ingen
kanske skriver till.

**Datan som avgör formen:** notera under tiden vilka uppgifter som känns
felplacerade, och åt vilket håll. Det avgör om globalt ska vara en egen lista, en
grupp i samma panel, eller bara en tagg på en projektuppgift. Den verkliga
kostnaden är inte koden utan valet vid infångning — måste du bestämma var varje
uppgift ska ligga i samma stund som du skriver den, är det den friktionen som
dödar systemet.
