import {TestBed} from "@angular/core/testing";

import {ProgramCodeResolver} from "./program-code.resolver";

describe("ProgramCodeResolver", () => {
    let resolver: ProgramCodeResolver;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        resolver = TestBed.inject(ProgramCodeResolver);
    });

    it("should be created", () => {
        expect(resolver).toBeTruthy();
    });
});
