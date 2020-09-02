module.exports = {
    "env": {
        "browser": true,
        "es2020": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "indent": [
            "error",
            4
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "always"
        ],
        "curly": ["warn", "multi"],
        "dot-notation": "error",
        "no-extra-parens": "warn",
        "no-implicit-coercion": "warn",
        "no-magic-numbers": ["error", { "ignore" : [] } ],
        "no-useless-return": "error",
        "no-var": "error",
        "object-curly-spacing": ["warn", "always"],
        "object-property-newline": ["warn", { "allowAllPropertiesOnSameLine" : true } ],
        "prefer-const": "warn",
        "space-infix-ops": "warn",
    }
}
