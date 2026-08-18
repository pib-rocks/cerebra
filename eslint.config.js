// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const eslintPluginPrettier = require("eslint-plugin-prettier/recommended");

module.exports = tseslint.config(
    {
        ignores: ["projects/**/*", "dist/**/*", "coverage/**/*"],
    },
    {
        files: ["**/*.ts", "**/*.mjs"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...angular.configs.tsRecommended,
        ],
        processor: angular.processInlineTemplates,
        rules: {
            "@angular-eslint/directive-selector": [
                "error",
                {
                    type: "attribute",
                    prefix: "app",
                    style: "camelCase",
                },
            ],
            "@angular-eslint/component-selector": [
                "error",
                {
                    type: "element",
                    prefix: "app",
                    style: "kebab-case",
                },
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            // Disabled: tracked as follow-up (K1 — standalone/zoneless migration)
            "@angular-eslint/prefer-standalone": "off",
            "@angular-eslint/prefer-on-push-component-change-detection": "off",
            "@angular-eslint/prefer-inject": "off",
        },
    },
    {
        files: ["**/*.html"],
        extends: [...angular.configs.templateRecommended],
        rules: {},
    },
    eslintPluginPrettier,
);
