import {TestBed} from "@angular/core/testing";

import {VoiceAssistantService} from "./voice-assistant.service";
import {RosService} from "../ros.service";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {VoiceAssistant} from "../types/voice-assistant";
import {ApiService} from "./api.service";
import {BehaviorSubject} from "rxjs";

describe("VoiceAssistantService", () => {
    let service: VoiceAssistantService;
    let spyOnVoiceAssistant: jasmine.Spy<() => void>;
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
    const klaus = {
        personalityId: "8f73b580-927e-41c2-98ac-e5df070e7222",
        name: "klaus",
        gender: "Male",
        description: "",
        pauseThreshold: 0.8,
    } as VoiceAssistant;
    const res = {voiceAssistantPersonalities: [eva, thomas]};
    const observableOfOne = new BehaviorSubject<any>(eva);
    const observableOfKlaus = new BehaviorSubject<any>(klaus);
    const observableOfTwo = new BehaviorSubject<any>(res);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [VoiceAssistantService, RosService, ApiService],
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(VoiceAssistantService);
        apiService = TestBed.inject(ApiService);
        spyOnVoiceAssistant = spyOn(
            service,
            "getAllPersonalities",
        ).and.callThrough();
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should return all personalities from database", () => {
        const spyOnGetAllPersonalities = spyOn(
            apiService,
            "get",
        ).and.returnValue(observableOfTwo);
        const response = service.getAllPersonalities();
        expect(spyOnGetAllPersonalities).toHaveBeenCalled();
        expect(service.personalities.length).toBe(2);
        expect(service.personalities[0].personalityId).toBe(eva.personalityId);
        expect(service.personalities[0].description).toBe(eva.description);
        expect(service.personalities[0].name).toBe(eva.name);
        expect(service.personalities[0].gender).toBe(eva.gender);
        expect(service.personalities[0].pauseThreshold).toBe(
            eva.pauseThreshold,
        );
        expect(service.personalities[1].personalityId).toBe(
            thomas.personalityId,
        );
        expect(service.personalities[1].description).toBe(thomas.description);
        expect(service.personalities[1].name).toBe(thomas.name);
        expect(service.personalities[1].gender).toBe(thomas.gender);
        expect(service.personalities[1].pauseThreshold).toBe(
            thomas.pauseThreshold,
        );
    });

    it("should retrun one personality from database", () => {
        const spyOnGetAllPersonalities = spyOn(
            apiService,
            "get",
        ).and.returnValue(observableOfOne);
        const response = service.getPersonalityById(eva.personalityId);
        expect(spyOnGetAllPersonalities).toHaveBeenCalled();
        expect(service.personalityByIdResponse!.personalityId).toBe(
            eva.personalityId,
        );
        expect(service.personalityByIdResponse!.description).toBe(
            eva.description,
        );
        expect(service.personalityByIdResponse!.name).toBe(eva.name);
        expect(service.personalityByIdResponse!.gender).toBe(eva.gender);
        expect(service.personalityByIdResponse!.pauseThreshold).toBe(
            eva.pauseThreshold,
        );
    });

    it("should retrun a created personality form db", () => {
        const spyOnCreatePersonality = spyOn(
            apiService,
            "post",
        ).and.returnValue(observableOfKlaus);
        service.createPersonality(klaus);
        let klasuResponse = service.personalities.find(
            (i) => i.personalityId === klaus.personalityId,
        );
        expect(spyOnCreatePersonality).toHaveBeenCalled();
        expect(klasuResponse!.name).toBe(klaus.name);
        expect(klasuResponse!.description).toBe(klaus.description);
        expect(klasuResponse!.pauseThreshold).toBe(klaus.pauseThreshold);
        expect(klasuResponse!.description).toBe(klaus.description);
    });

    it("should return an updated personality form db", () => {
        let klausUpdate = klaus;
        klausUpdate.description = "asdasdadasd";
        const observableOfUpdatedKlaus = new BehaviorSubject<any>(klausUpdate);
        const spyOnUpdatePersonality = spyOn(apiService, "put").and.returnValue(
            observableOfUpdatedKlaus,
        );
        service.updatePersonalityById(klausUpdate);
        expect(spyOnUpdatePersonality).toHaveBeenCalled();
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
