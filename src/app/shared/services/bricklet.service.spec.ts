import {TestBed} from "@angular/core/testing";

import {BrickletService} from "./bricklet.service";
import {provideHttpClient} from "@angular/common/http";
import {provideHttpClientTesting} from "@angular/common/http/testing";

describe("BrickletService", () => {
    let service: BrickletService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(BrickletService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
