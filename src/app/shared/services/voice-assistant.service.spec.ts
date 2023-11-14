import {TestBed} from "@angular/core/testing";
import {VoiceAssistantService} from "./voice-assistant.service";
import {RosService} from "../ros.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../types/voice-assistant";
import {ApiService} from "./api.service";
import {BehaviorSubject} from "rxjs";

describe("VoiceAssistantService", () => {
    let service: VoiceAssistantService;
    let apiService: ApiService;
    const eva = {
        personalityId: "8f73b580-927e-41c2-98ac-e5df070e7288",
        name: "Eva",
        gender: "Female",
        description: "",
        pauseThreshold: 0.8,
    } as VoiceAssistant;
    const thomas = {
        personalityId: "8b310f95-92cd-4512-b42a-d3fe29c4bb8a",
        name: "Thomas",
        gender: "Male",
        description: "",
        pauseThreshold: 0.8,
    } as VoiceAssistant;
    const klaus = new VoiceAssistant(
        "8f73b580-927e-41c2-98ac-e5df070e7222",
        "klaus",
        "Male",
        0.8,
        "",
    );

    const res = {voiceAssistantPersonalities: [eva, thomas]};
    const observableOfKlaus = new BehaviorSubject<VoiceAssistant>(klaus);
    const observableOfTwo = new BehaviorSubject<{
        voiceAssistantPersonalities: VoiceAssistant[];
    }>(res);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [VoiceAssistantService, RosService, ApiService],
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(VoiceAssistantService);
        apiService = TestBed.inject(ApiService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should return all personalities from database", () => {
        const spyOnGetAllPersonalities = spyOn(
            apiService,
            "get",
        ).and.returnValue(observableOfTwo);
        service.getAllPersonalities();
        expect(spyOnGetAllPersonalities).toHaveBeenCalled();
        expect(service.personalitiesSubject.getValue().length).toBe(2);
        expect(service.personalities.length).toBe(2);
    });

    it("should return a created personality form db", () => {
        const spyOnCreatePersonality = spyOn(
            apiService,
            "post",
        ).and.returnValue(observableOfKlaus);
        service.createPersonality(klaus);
        const index = service.personalities.findIndex(
            (i) => i.personalityId === klaus.personalityId,
        );
        expect(spyOnCreatePersonality).toHaveBeenCalled();
        expect(service.personalities[index].description).toBe(
            klaus.description,
        );
        expect(service.personalities[index].pauseThreshold).toBe(
            klaus.pauseThreshold,
        );
        expect(service.personalities[index].name).toBe(klaus.name);
        expect(service.personalities[index].personalityId).toBe(
            klaus.personalityId,
        );
    });

    it("should return an updated personality form db", () => {
        const evaUpdate = eva;
        evaUpdate.description = "asdasdadasd";
        const observableOfUpdatedEva = new BehaviorSubject<VoiceAssistant>(
            evaUpdate,
        );
        const spyOnUpdatePersonality = spyOn(apiService, "put").and.returnValue(
            observableOfUpdatedEva,
        );
        service.updatePersonalityById(evaUpdate);
        expect(spyOnUpdatePersonality).toHaveBeenCalled();
        // expect(service.personalityByIdResponse!).toBe(evaUpdate);
    });

    it("should return 204", () => {
        const emptyObservable = new BehaviorSubject<any>(undefined);
        const spyOnDeletePersonality = spyOn(
            apiService,
            "delete",
        ).and.returnValue(emptyObservable);
        service.deletePersonalityById(eva.personalityId);
        expect(spyOnDeletePersonality).toHaveBeenCalled();
    });
});
