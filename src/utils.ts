import { ExtensionContext } from 'vscode';

const Utils = {
  context: <ExtensionContext> undefined,

  getGlobalContextValue: function (key) { 
    return this.context.globalState.get(key);
  },

  setGlobalContextValue: function (key, value) {
    return this.context.globalState.update(key, value); 
  },

  getContextValue: function (key) { 
    return this.context.workspaceState.get(key);
  },

  setContextValue: function (key, value) {
    return this.context.workspaceState.update(key, value); 
  },

};

export default Utils;
