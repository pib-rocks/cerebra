import {TestBed} from "@angular/core/testing";

import {SaveConfirmationGuardService} from "./save-confirmation-guard.service";

describe("SaveConfirmationGuardService", () => {
    let service: SaveConfirmationGuardService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SaveConfirmationGuardService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
