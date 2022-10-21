import * as vscode from 'vscode';

const cardComponents = [
  'LoadingCard',
  'SimpleCard',
  'CardWithLoadingBackground',
  'CancelCard',
];

const toComponentImport = (name: string) => {
  const componentName = name.trim();
  if (cardComponents.includes(componentName)) {
    return `import ${componentName} from '~/components/Cards/${componentName}.vue';`;
  }

  if (componentName === 'Transition') {
    return `import { Transition } from 'vue';`;
  }

  if (componentName === 'TransitionGroup') {
    return `import { TransitionGroup } from 'vue';`;
  }

  if (componentName === 'Teleport') {
    return `import { Teleport } from 'vue';`;
  }

  if (componentName === 'RouterLink') {
    return `import { RouterLink } from 'vue-router';`;
  }
  if (componentName === 'RouterView') {
    return `import { RouterView } from 'vue-router';`;
  }

  return `import ${componentName} from '~/components/${componentName}.vue';`;
};

export const cleanupComponents = () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }
  const allText = editor.document.getText();
  const regex = /<([A-Z][\w]+)/g;
  const matches = allText.match(regex);

  const allComponents = Array.from(
    new Set(matches?.map((x) => x.replace('<', '')))
  ).map(toComponentImport);

  // insert allComponents at the top of the file after the first line
  const firstLine = editor.document.lineAt(0);

  editor.edit((editBuilder) => {
    editBuilder.insert(
      new vscode.Position(0, firstLine.range.end.character),
      `\n${allComponents.join('\n')}\n`
    );
  });
};

// write a regex to find the <script> tag with all attributes, unless it has an attribute `lang="ts"`
