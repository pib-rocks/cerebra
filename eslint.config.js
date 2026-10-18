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
        // PC-72: a spec must not assign to a property it declared on a jasmine
        // spy - jasmine's third createSpyObj argument installs a setter spy that
        // silently discards the value (PC-63, PC-64). Assignments on real
        // service instances stay legal; the rule only fires for names declared
        // on a spy in the same file.
        files: ["**/*.spec.ts"],
        plugins: {
            local: {
                rules: {
                    "no-spy-subject-assignment": require("./eslint-rules/no-spy-subject-assignment"),
                    // PC-72 rollout: the third createSpyObj argument is now
                    // banned outright - the helper replaced every call site.
                    "no-three-arg-create-spy-obj": require("./eslint-rules/no-three-arg-create-spy-obj"),
                },
            },
        },
        rules: {
            "local/no-spy-subject-assignment": "error",
            "local/no-three-arg-create-spy-obj": "error",
        },
    },
    {
        files: ["**/*.html"],
        extends: [...angular.configs.templateRecommended],
        rules: {},
    },
    eslintPluginPrettier,
);
