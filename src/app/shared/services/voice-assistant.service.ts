import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {
    VoiceAssistant,
    parseDtoToVoiceAssistant,
    parseVoiceAssistantToDto,
} from "../types/voice-assistant";
import {
    BehaviorSubject,
    Observable,
    Subject,
    catchError,
    map,
    throwError,
} from "rxjs";
import {UrlConstants} from "./url.constants";
import {SidebarService} from "../interfaces/sidebar-service.interface";
import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {RosService} from "./ros-service/ros.service";
import {VoiceAssistantState} from "../types/voice-assistant-state";
import {AssistantModel, AssistantModelDto} from "../types/assistantModel";

@Injectable({
    providedIn: "root",
})
export class VoiceAssistantService implements SidebarService {
    voiceAssistantStateObservable: Observable<VoiceAssistantState>;
    personalities: VoiceAssistant[] = [];
    personalitiesSubject: BehaviorSubject<VoiceAssistant[]> =
        new BehaviorSubject<VoiceAssistant[]>([]);
    uuidSubject: Subject<string> = new Subject<string>();
    voiceAssistantActiveStatus: boolean = false;
    assistantModels: AssistantModel[] = [];
    voiceAssistantActiveStatusSubject: Subject<boolean> =
        new Subject<boolean>();

    constructor(
        private apiService: ApiService,
        private rosService: RosService,
    ) {
        this.getAllPersonalities();
        this.getAllAssistantModels();

        this.voiceAssistantStateObservable =
            this.rosService.voiceAssistantStateReceiver$.pipe(
                map((state) => ({
                    turnedOn: state.turned_on,
                    chatId: state.chat_id,
                })),
            );
    }

    setVoiceAssistantState(nextState: VoiceAssistantState) {
        return this.rosService.setVoiceAssistantState({
            turned_on: nextState.turnedOn,
            chat_id: nextState.chatId,
        });
    }

    private updatePersonality(updatePersonality: VoiceAssistant) {
        const index = this.personalities.findIndex(
            (p) => p.personalityId === updatePersonality.personalityId,
        );
        this.personalities[index] = updatePersonality;
        this.personalitiesSubject.next(this.personalities.slice());
    }

    private setPersonalities(personalities: VoiceAssistant[]) {
        const newPersonalities: VoiceAssistant[] = [];

        personalities.forEach((m) => {
            newPersonalities.push(
                new VoiceAssistant(
                    m.personalityId,
                    m.name,
                    m.gender,
                    m.pauseThreshold,
                    m.description,
                    m.assistantModelId,
                ),
            );
        });
        this.personalities = newPersonalities;
        this.personalitiesSubject.next(this.personalities.slice());
    }

    private addPersonality(personality: VoiceAssistant) {
        this.personalities.push(personality);
        this.personalitiesSubject.next(this.personalities.slice());
    }

    private deletePersonality(id: string) {
        this.personalities.splice(
            this.personalities.findIndex((p) => p.personalityId === id),
            1,
        );
        this.personalitiesSubject.next(this.personalities.slice());
    }

    getPersonality(uuid: string) {
        return this.personalities.find((voiceAssistant) => {
            return voiceAssistant.personalityId === uuid;
        });
    }

    getAllPersonalities() {
        this.apiService
            .get(UrlConstants.PERSONALITY)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.setPersonalities(
                    response["voiceAssistantPersonalities"] as VoiceAssistant[],
                );
            });
    }

    getAllAssistantModels() {
        this.apiService
            .get(UrlConstants.ASSISTANT_MODEL)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((respone) => {
                this.assistantModels = [];
                const assistantModelDto = respone[
                    "voiceAssistantModels"
                ] as AssistantModelDto[];
                if (undefined == assistantModelDto) {
                    return;
                }
                this.assistantModels = assistantModelDto.map((dto) =>
                    AssistantModel.parseDtoToAssistantModel(dto),
                );
            });
    }

    createPersonality(personality: VoiceAssistant) {
        this.apiService
            .post(
                UrlConstants.PERSONALITY,
                parseVoiceAssistantToDto(personality),
            )
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.addPersonality(
                    parseDtoToVoiceAssistant(response as VoiceAssistant),
                );
            });
    }

    updatePersonalityById(personality: VoiceAssistant) {
        console.log(personality);
        this.apiService
            .put(
                UrlConstants.PERSONALITY + `/${personality.personalityId}`,
                parseVoiceAssistantToDto(personality),
            )
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.updatePersonality(
                    parseDtoToVoiceAssistant(response as VoiceAssistant),
                );
            });
    }

    deletePersonalityById(id: string) {
        this.apiService
            .delete(UrlConstants.PERSONALITY + `/${id}`)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe(() => {
                this.deletePersonality(id);
            });
    }

    getSubject(): Observable<SidebarElement[]> {
        return this.personalitiesSubject;
    }
}
