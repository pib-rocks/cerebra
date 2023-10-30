import {TestBed} from "@angular/core/testing";
import {VoiceAssistantService} from "./voice-assistant.service";
import {HttpClient, HttpHandler} from "@angular/common/http";
import {ApiService} from "./api.service";

fdescribe("VoiceAssistantService", () => {
    let service: VoiceAssistantService;
    let apiSpy: jasmine.SpyObj<ApiService>;
    beforeEach(() => {
        const spy = jasmine.createSpyObj("ApiService", []);

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ApiService,
                    useValue: spy,
                },
                VoiceAssistantService,
            ],
        });

        service = TestBed.inject(VoiceAssistantService);
        apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it("should be created", () => {
        /*         expect(service).toBeTruthy(); */
    });
});
