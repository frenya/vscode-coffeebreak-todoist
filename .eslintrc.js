module.exports = {
  "parser": "babel-eslint",
  "env": {
    "node": true,
    "es6": true,
    "browser": true,
    "meteor": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended"
  ],
  "globals": {
    "Promise": true,
    "describe": true,
    "before": true,
    "beforeEach": true,
    "it": true
  },
  "parserOptions": {
    "ecmaFeatures": {
      "arrowFunctions": true,
      "blockBindings": true,
      "classes": true,
      "defaultParams": true,
      "destructuring": true,
      "forOf": true,
      "generators": false,
      "modules": true,
      "objectLiteralComputedProperties": true,
      "objectLiteralDuplicateProperties": false,
      "objectLiteralShorthandMethods": true,
      "objectLiteralShorthandProperties": true,
      "spread": true,
      "superInFunctions": true,
      "templateStrings": true,
      "jsx": true
    },
  },
  "rules": {
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 }
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "single"
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ],
    "key-spacing": [
      "error",
      {
        "beforeColon": false,
        "afterColon": true,
        "mode": "strict"
      }
    ],
    "object-curly-spacing": [
      "error",
      "always"
    ],
    "no-unused-vars": [
      "error",
      {
        "vars": "all",
        "args": "none",
        "ignoreRestSiblings": true,
        "varsIgnorePattern": "React|Meteor"
      }
    ],
    "react/prop-types": [
      "warn",
      {
        "ignore": [ "children" ]
      }
    ]
  }
};
