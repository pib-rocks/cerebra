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
        service.getAllPersonalities();
        expect(spyOnGetAllPersonalities).toHaveBeenCalled();
        expect(service.personalitiesSubject.getValue()).toEqual(
            jasmine.arrayContaining([eva, thomas]),
        );
        expect(service.personalitiesSubject.getValue().length).toBe(2);
        expect(service.personalities).toEqual(
            jasmine.arrayContaining([eva, thomas]),
        );
        expect(service.personalities.length).toBe(2);
    });

    it("should retrun one personality from database", () => {
        const spyOnGetAllPersonalities = spyOn(
            apiService,
            "get",
        ).and.returnValue(observableOfOne);
        service.getPersonalityById(eva.personalityId);
        expect(spyOnGetAllPersonalities).toHaveBeenCalled();
        expect(service.personalityByIdResponse!).toBe(eva);
    });

    it("should retrun a created personality form db", () => {
        const spyOnCreatePersonality = spyOn(
            apiService,
            "post",
        ).and.returnValue(observableOfKlaus);
        service.createPersonality(klaus);
        let index = service.personalities.findIndex(
            (i) => i.personalityId === klaus.personalityId,
        );
        expect(spyOnCreatePersonality).toHaveBeenCalled();
        expect(service.personalities[index]).toBe(klaus);
        expect(service.personalitiesSubject.getValue()[index]).toBe(klaus);
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
        expect(service.personalityByIdResponse!).toBe(klausUpdate);
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
