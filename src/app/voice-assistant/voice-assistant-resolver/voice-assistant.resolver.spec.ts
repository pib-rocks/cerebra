import {TestBed} from "@angular/core/testing";
import {ResolveFn} from "@angular/router";

import {voiceAssistantResolver} from "./voice-assistant.resolver";

describe("voiceAssistantResolver", () => {
    const executeResolver: ResolveFn<boolean> = (...resolverParameters) =>
        TestBed.runInInjectionContext(() =>
            voiceAssistantResolver(...resolverParameters),
        );

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it("should be created", () => {
        expect(executeResolver).toBeTruthy();
    });
});
