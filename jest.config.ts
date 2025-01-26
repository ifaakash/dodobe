export default {
    preset: "ts-jest",
    testEnvironment: "node",
    verbose: true,
    setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
    testMatch: ["**/*.test.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    transform: {
        "^.+\\.ts$": "ts-jest",
    },
};
