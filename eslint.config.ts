import { ESLint } from "eslint";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
    {
        // Global ignores
        ignores: [
            "dist/**/*",
            "node_modules/**/*",
            "coverage/**/*",
            "*.js",
            "*.d.ts",
            "test-uploads/**/*",
        ],
    },
    {
        // Base configuration for all TypeScript files
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                project: "./tsconfig.json",
            },
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                global: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            // TypeScript specific rules
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-inferrable-types": "error",
            "@typescript-eslint/prefer-const": "error",
            "@typescript-eslint/no-var-requires": "error",

            // General JavaScript/TypeScript rules
            "no-console": "off", // Allow console for backend logging
            "no-debugger": "error",
            "no-duplicate-imports": "error",
            "no-unused-expressions": "error",
            "prefer-const": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-arrow-callback": "error",

            // Code style
            indent: ["error", 4, { SwitchCase: 1 }],
            quotes: ["error", "double"],
            semi: ["error", "always"],
            "comma-dangle": ["error", "never"],
            "no-trailing-spaces": "error",
            "eol-last": "error",
            "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],

            // Best practices for Node.js/Express
            "no-process-exit": "error",
            "handle-callback-err": "error",
            "no-sync": "warn",

            // MongoDB/Mongoose specific
            "no-new": "off", // Allow new ObjectId() etc.

            // Import organization
            "sort-imports": [
                "error",
                {
                    ignoreCase: false,
                    ignoreDeclarationSort: true,
                    ignoreMemberSort: false,
                },
            ],
        },
    },
    {
        // Test files configuration
        files: ["**/*.test.ts", "**/__tests__/**/*.ts", "**/test/**/*.ts"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                jest: "readonly",
            },
        },
        rules: {
            // Relax some rules for test files
            "@typescript-eslint/no-explicit-any": "off",
            "no-unused-expressions": "off",
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
    {
        // Configuration files
        files: ["*.config.ts", "*.config.js"],
        rules: {
            "@typescript-eslint/no-var-requires": "off",
            "no-console": "off",
        },
    },
    {
        // Middleware and route files - specific rules
        files: ["**/middleware/**/*.ts", "**/routes/**/*.ts"],
        rules: {
            // Allow unused next parameter in middleware
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^(next|_)",
                    varsIgnorePattern: "^_",
                },
            ],
        },
    },
    {
        // Controller files - specific rules
        files: ["**/controllers/**/*.ts"],
        rules: {
            // Controllers often have long methods
            "max-lines-per-function": "off",
            // Allow console.log for debugging in controllers
            "no-console": "off",
        },
    },
];
