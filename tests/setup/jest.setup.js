const {setupZoneTestEnv} = require("jest-preset-angular/setup-env/zone");

setupZoneTestEnv();

beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
    jest.restoreAllMocks();
});
