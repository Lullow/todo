import * as vscode from 'vscode';
import { readTodos, type Status, type Todo } from './todos.js';

interface Group {
  kind: 'group';
  status: Status;
  label: string;
  todos: Todo[];
}

interface Item {
  kind: 'item';
  todo: Todo;
}

export type Node = Group | Item;

/** Pågående överst: det är det man ska tillbaka till. Klara sist och hopfällda. */
const GROUPS: Array<{ status: Status; label: string }> = [
  { status: 'doing', label: 'Pågår' },
  { status: 'open', label: 'Öppna' },
  { status: 'done', label: 'Klara' },
];

export class TodoTree implements vscode.TreeDataProvider<Node> {
  public static readonly viewId = 'todo.panel';

  private todos: Todo[] = [];
  private readonly changed = new vscode.EventEmitter<void>();
  public readonly onDidChangeTreeData = this.changed.event;

  /**
   * När panelen själv skrev senast.
   *
   * En avbockning ändrar en `.md`-fil, vilket väcker filbevakaren, som läser om
   * och ritar om — ovanpå omritningen avbockningen redan gjort. Utan spärren
   * blinkar trädet till vid varje klick.
   */
  private lastWrite = 0;

  public constructor(private readonly root: string | undefined) {}

  public markWrite(): void {
    this.lastWrite = Date.now();
  }

  public selfWrote(): boolean {
    return Date.now() - this.lastWrite < 1000;
  }

  /** Allt som lästes in, oavsett läge. Skiljer tom katalog från fel katalog. */
  public count(): number {
    return this.todos.length;
  }

  /** Antal som återstår, för märket på ikonen i aktivitetsfältet. */
  public waiting(): number {
    return this.todos.filter((todo) => todo.status !== 'done').length;
  }

  public async refresh(): Promise<void> {
    this.todos = this.root ? await readTodos(this.root) : [];
    this.changed.fire();
  }

  public getChildren(node?: Node): Node[] {
    if (!node) {
      // Tomma grupper visas inte alls — en rubrik utan innehåll är bara brus.
      return GROUPS.map(({ status, label }) => ({
        kind: 'group' as const,
        status,
        label,
        todos: this.todos.filter((todo) => todo.status === status),
      })).filter((group) => group.todos.length > 0);
    }

    if (node.kind === 'group') {
      return node.todos.map((todo) => ({ kind: 'item' as const, todo }));
    }

    return [];
  }

  public getTreeItem(node: Node): vscode.TreeItem {
    if (node.kind === 'group') {
      const item = new vscode.TreeItem(
        node.label,
        node.status === 'done'
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded,
      );
      item.description = String(node.todos.length);
      item.contextValue = `group:${node.status}`;
      return item;
    }

    const { todo } = node;
    const item = new vscode.TreeItem(todo.title, vscode.TreeItemCollapsibleState.None);
    item.id = todo.id;
    item.checkboxState = todo.status === 'done'
      ? vscode.TreeItemCheckboxState.Checked
      : vscode.TreeItemCheckboxState.Unchecked;

    // Datumet står till höger så man ser hur länge något legat. Klara uppgifter
    // behöver det inte — de är redan ur vägen.
    if (todo.status !== 'done') item.description = todo.created;

    item.tooltip = new vscode.MarkdownString(
      todo.detail ? `**${todo.title}**\n\n${todo.detail}` : todo.title,
    );
    item.contextValue = `todo:${todo.status}`;
    item.command = {
      command: 'vscode.open',
      title: 'Öppna uppgiften',
      arguments: [vscode.Uri.file(todo.path)],
    };
    return item;
  }
}
