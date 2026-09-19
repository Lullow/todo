# Uppgifter

En uppgiftslista som ligger i projektet som vanliga markdown-filer, så att både du
och Claude Code kan läsa och ändra den. Panelen i VS Code renderar katalogen och
uppdaterar sig när filerna ändras — oavsett vem som ändrade dem.

## Varför inte Todo Tree

Todo Tree är en read-only scanner över `TODO:`-kommentarer i källkod. Den har ingen
egen state, så den kan inte hålla status, och den tog bort sin filbevakare i
version 0.0.224 till förmån för polling som är avstängd som standard. Senaste
versionen är från april 2023.

Det som behövdes här var något agenten kan *skriva* till, och som syns direkt när
den gör det.

## Formatet

En fil per uppgift i `.claude/todos/`:

```markdown
---
id: fixa-ripgrep-sokvagen
status: open
created: 2026-09-19
---

Sätt todo-tree.ripgrep.ripgrep till /usr/bin/rg.
```

Tre fält, och rubriken är brödtextens första rad. `status` är `open`, `doing` eller
`done`.

Formatet är avsiktligt litet. Allt som går att skriva med en `Edit` på en rad kan
agenten ändra utan att röra resten av filen, och allt som är läsbart i en diff går
att granska i en commit.

## Bygga

Kräver Node 24.

```bash
npm install
npm run deploy      # kompilerar, paketerar och installerar
```

Ladda sedan om fönstret: **Developer: Reload Window**.

F5 fungerar inte i den här uppsättningen, och det finns ingen `launch.json`.
Värdfönstret är ett WSL-fjärrfönster som startar utan mapp; varken en naken
sökväg eller `--folder-uri` fick det att öppna projektet, och utan projektrot
har panelen ingenting att läsa. Konfigurationen togs bort eftersom en trasig
sådan med en hårdkodad hemsökväg är sämre än ingen alls.

## Vad som inte finns än

- Ingen spegling av Claude Codes levande TodoWrite-lista. Den beror på formatet i
  sessionens JSONL, som är odokumenterat och lätt att parsa fel. Den väntar tills
  grunden bevisat sig.
- Inget sätt att sätta `doing` från panelen. Agenten sätter det; du bockar av.
- Ingen sortering eller prioritet utöver "äldst först".
