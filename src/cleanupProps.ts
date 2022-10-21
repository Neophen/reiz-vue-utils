import * as vscode from 'vscode';

interface PropType {
  default?: unknown;
  type?: unknown;
}

type PropTypes = Record<string, PropType>;

const toKeysWithDefaults = (types: PropTypes) => (key: string) => {
  const value = types[key];
  const hasDefaultValue =
    value.hasOwnProperty('default') &&
    value.default !== undefined &&
    value.default !== null;

  if (!hasDefaultValue) {
    return key;
  }

  let defaultValue = value.default;
  const isEmptyString = value.default === '';
  if (isEmptyString) {
    defaultValue = `\"\"`;
  }

  if (!isEmptyString && typeof value.default === 'string') {
    defaultValue = `\"${defaultValue}\"`;
  }

  return `${key} = ${defaultValue}`;
};

const getType = (type: unknown) => {
  if (type === String) {
    return 'string';
  }
  if (type === Number) {
    return 'number';
  }
  if (type === Boolean) {
    return 'boolean';
  }
  if (type === Object) {
    return 'Record<string, unknown>';
  }

  return 'unknown';
};

const toKeysWithTypes = (types: PropTypes) => (key: string) => {
  const value = types[key];

  const isOptional = value.hasOwnProperty('default');

  const typeKey = `${key}${isOptional ? '?' : ''}`;

  if (Array.isArray(value.type)) {
    const valueTypes = value.type.map(getType);
    return `${typeKey}: <${valueTypes.join('|')}>[]`;
  }

  return `${typeKey}: ${getType(value.type)}`;
};

const getDefinePropsOutput = (editor: vscode.TextEditor) => {
  const allText = editor.document.getText();
  const regex = /defineProps\(\{([\s\S]*?)\}\)/g;
  const match = regex.exec(allText);
  if (!match || match.length < 2) {
    return;
  }
  const types = eval(`({${match[1]}})`);
  const keys = Object.keys(types);
  const keysWithDefaults = keys.map(toKeysWithDefaults(types)).join(',\n  ');
  const keysWithTypes = keys.map(toKeysWithTypes(types)).join(';\n  ');

  return `const {\n  ${keysWithDefaults}\n} = defineProps<{\n  ${keysWithTypes}\n}>()`;
};

const getDefineEmitsOutput = (editor: vscode.TextEditor) => {
  const allText = editor.document.getText();
  const regex = /defineEmits\(\[([\s\S]*?)\]\)/g;
  const match = regex.exec(allText);

  if (!match || match.length < 2) {
    return;
  }
  const events = eval(`[${match[1]}]`);
  events;

  const toKeysWithTypes = (event: string) => {
    return `(e: '${event}'): void;`;
  };

  const eventsWithTypes = events.map(toKeysWithTypes).join('\n  ');

  return `const emit = defineEmits<{\n  ${eventsWithTypes}\n}>()`;
};

const replaceOldPropsWithNewProps = (
  editor: vscode.TextEditor,
  editBuilder: vscode.TextEditorEdit
) => {
  const output = getDefinePropsOutput(editor);

  if (!output) {
    return;
  }

  const allText = editor.document.getText();
  const regex = /(const props = )*defineProps\(\{([\s\S]*?)\}\)/g;
  const match = regex.exec(allText);
  if (!match || match.length < 2) {
    return;
  }
  const range = new vscode.Range(
    editor.document.positionAt(match.index),
    editor.document.positionAt(match.index + match[0].length)
  );

  editBuilder.replace(range, output);
};

const replaceOldEmitsWithNewEmits = (
  editor: vscode.TextEditor,
  editBuilder: vscode.TextEditorEdit
) => {
  const output = getDefineEmitsOutput(editor);

  if (!output) {
    return;
  }

  const allText = editor.document.getText();
  const regex = /(const emit = )*defineEmits\(\[([\s\S]*?)\]\)/g;
  const match = regex.exec(allText);

  if (!match || match.length < 2) {
    return;
  }

  const range = new vscode.Range(
    editor.document.positionAt(match.index),
    editor.document.positionAt(match.index + match[0].length)
  );

  editBuilder.replace(range, output);
};

const updateScriptTag = (
  editor: vscode.TextEditor,
  editBuilder: vscode.TextEditorEdit
) => {
  const allText = editor.document.getText();
  const regex = /<script ([\s\S]*?)>/g;
  const match = regex.exec(allText);
  if (!match || match.length < 2) {
    return;
  }

  const splitRegEx = /(\s+|\n)/g;
  const insides = match?.[1].trim().replace(splitRegEx, ' ').split(' ');
  if (!insides) {
    return;
  }

  const hasTypescript =
    insides.includes('lang="ts"') || insides.includes(`lang='ts'`);
  if (hasTypescript) {
    return;
  }

  const updatedTag = `<script lang="ts" ${insides.join(' ')}>`;

  const range = new vscode.Range(
    editor.document.positionAt(match.index),
    editor.document.positionAt(match.index + match[0].length)
  );

  editBuilder.replace(range, updatedTag);
};

const removeAllPropsReferences = (
  editor: vscode.TextEditor,
  editBuilder: vscode.TextEditorEdit
) => {
  const allText = editor.document.getText();

  const regex = /props\./g;
  let match = regex.exec(allText);
  while (match) {
    const range = new vscode.Range(
      editor.document.positionAt(match.index),
      editor.document.positionAt(match.index + match[0].length)
    );
    editBuilder.replace(range, '');
    match = regex.exec(allText);
  }
};

export const cleanupProps = () => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  editor.edit((editBuilder) => {
    updateScriptTag(editor, editBuilder);
    replaceOldPropsWithNewProps(editor, editBuilder);
    replaceOldEmitsWithNewEmits(editor, editBuilder);
    removeAllPropsReferences(editor, editBuilder);
  });
};
