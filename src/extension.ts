import * as vscode from 'vscode';
import { TodoTree, type Node } from './tree.js';
import { create, setStatus, todosDir } from './todos.js';

export function activate(context: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const tree = new TodoTree(root);

  const view = vscode.window.createTreeView<Node>(TodoTree.viewId, {
    treeDataProvider: tree,
    // Utan det här håller VS Code kryssrutornas läge själv, i minnet. Sanningen
    // ligger i filerna, så vi tar hand om varje klick och läser om därifrån.
    manageCheckboxStateManually: true,
  });

  const refresh = async (): Promise<void> => {
    await tree.refresh();
    const waiting = tree.waiting();
    view.badge = waiting > 0 ? { value: waiting, tooltip: `${waiting} att göra` } : undefined;

    // En tom panel ska säga varför den är tom. Utan det går det inte att skilja
    // "inga uppgifter" från "letar på fel ställe", vilket är den enda frågan man
    // faktiskt har när ingenting syns.
    view.message = !root
      ? 'Ingen mapp öppen. Uppgifter sparas per projekt.'
      : tree.count() === 0
        ? `Inga uppgifter i ${todosDir(root)}`
        : undefined;
  };

  view.onDidChangeCheckboxState(async (event) => {
    for (const [node, state] of event.items) {
      if (node.kind !== 'item') continue;
      try {
        tree.markWrite();
        await setStatus(node.todo, state === vscode.TreeItemCheckboxState.Checked ? 'done' : 'open');
      } catch (error) {
        vscode.window.showErrorMessage(`Kunde inte spara uppgiften: ${String(error)}`);
      }
    }
    await refresh();
  });

  context.subscriptions.push(
    view,
    vscode.commands.registerCommand('todo.refresh', () => refresh()),
    vscode.commands.registerCommand('todo.add', async () => {
      if (!root) {
        vscode.window.showWarningMessage('Öppna en mapp först — uppgifter sparas per projekt.');
        return;
      }

      const title = await vscode.window.showInputBox({
        prompt: 'Vad ska göras?',
        placeHolder: 'En rad. Detaljer skriver du i filen efteråt.',
      });
      if (!title?.trim()) return;

      try {
        tree.markWrite();
        const file = await create(root, title);
        await refresh();
        // Öppna direkt: rubriken är sällan hela uppgiften, och det är nu man
        // kommer ihåg resten.
        await vscode.window.showTextDocument(vscode.Uri.file(file));
      } catch (error) {
        vscode.window.showErrorMessage(`Kunde inte skapa uppgiften: ${String(error)}`);
      }
    }),
  );

  if (root) {
    // Den här bevakaren är hela poängen: agenten skriver filerna utanför
    // editorn, och panelen ska visa det utan att du trycker på något.
    //
    // Mönstret utgår från projektroten, inte från todos-katalogen. En bevakare
    // på en katalog som ännu inte finns väcks inte när den skapas, och då
    // syns aldrig den allra första uppgiften i ett nytt projekt.
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(root, '.claude/todos/*.md'),
    );
    const onChange = () => {
      if (tree.selfWrote()) return;
      void refresh();
    };
    watcher.onDidCreate(onChange);
    watcher.onDidChange(onChange);
    watcher.onDidDelete(onChange);
    context.subscriptions.push(watcher);
  }

  void refresh();
}

export function deactivate(): void {
  // Inget att städa: allt ligger i context.subscriptions.
}
