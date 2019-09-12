import { ExtensionContext } from 'vscode';

const Utils = {
  context: <ExtensionContext> undefined,

  getContextValue: function (key) { 
    return this.context.workspaceState.get(key);
  },

  setContextValue: function (key, value) {
    return this.context.workspaceState.update(key, value); 
  },

};

export default Utils;
