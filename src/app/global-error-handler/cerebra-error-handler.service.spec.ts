import {TestBed} from "@angular/core/testing";

import {CerebraErrorHandler} from "./cerebra-error-handler.service";

describe("GlobalErrorHandlerComponent", () => {
    let errorHandler: CerebraErrorHandler;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [CerebraErrorHandler],
        });
        errorHandler = TestBed.inject(CerebraErrorHandler);
    });

    it("should create", () => {
        expect(errorHandler).toBeTruthy();
    });

    it("should handle errors appropriately", () => {
        let error = null;
        const consoleLogSpy = spyOn(console, "log").and.callThrough();
        errorHandler.handleError(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(
            "An unexpected error has occurred",
        );
        error = new Error("Test error");
        errorHandler.handleError(error);
        expect(consoleLogSpy).toHaveBeenCalledWith(error.message);
    });
});
