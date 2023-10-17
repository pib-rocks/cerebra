import {TestBed} from "@angular/core/testing";

import {VoiceAssistantService} from "./voice-assistant.service";

describe("VoiceAssistantService", () => {
    let service: VoiceAssistantService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(VoiceAssistantService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
