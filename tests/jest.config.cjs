const {join} = require("path");

const rootDir = join(__dirname, "..");

/** @type {import('jest').Config} */
module.exports = {
    preset: "jest-preset-angular",
    rootDir,
    setupFilesAfterEnv: [join(rootDir, "tests/setup/jest.setup.js")],
    testMatch: ["<rootDir>/tests/unit/**/*.spec.ts"],
    moduleNameMapper: {
        "^src/(.*)$": "<rootDir>/src/$1",
        "\\.(css|scss|sass|less)$": "<rootDir>/tests/setup/styleMock.js",
        "\\.(html)$": "<rootDir>/tests/setup/htmlMock.js",
    },
    transform: {
        "^.+\\.(ts|mjs|js|html)$": [
            "jest-preset-angular",
            {
                tsconfig: "<rootDir>/tests/tsconfig.json",
            },
        ],
    },
    transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$|blockly|marked)"],
    collectCoverageFrom: [
        "src/app/shared/services/**/*.ts",
        "src/app/program/**/*.ts",
        "!src/app/**/*.spec.ts",
    ],
    coverageDirectory: "<rootDir>/tests/coverage",
};
