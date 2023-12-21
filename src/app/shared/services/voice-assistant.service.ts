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
    throwError,
} from "rxjs";
import {UrlConstants} from "./url.constants";
import {SidebarService} from "../interfaces/sidebar-service.interface";
import {SidebarElement} from "../interfaces/sidebar-element.interface";
import {VoiceAssistantMsg} from "../ros-message-types/voiceAssistant";
import {RosService} from "./ros-service/ros.service";

@Injectable({
    providedIn: "root",
})
export class VoiceAssistantService implements SidebarService {
    personalities: VoiceAssistant[] = [];
    personalitiesSubject: BehaviorSubject<VoiceAssistant[]> =
        new BehaviorSubject<VoiceAssistant[]>([]);
    uuidSubject: Subject<string> = new Subject<string>();
    voiceAssistantActiveStatus: boolean = false;
    voiceAssistantActiveStatusSubject: Subject<boolean> =
        new Subject<boolean>();
    constructor(
        private apiService: ApiService,
        private rosService: RosService,
    ) {
        this.getAllPersonalities();
        this.subscribeVoiceAssistantTopic();
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

        //FIXME ab in die pipe @christopher
        personalities.forEach((m) => {
            newPersonalities.push(
                new VoiceAssistant(
                    m.personalityId,
                    m.name,
                    m.gender,
                    m.pauseThreshold,
                    m.description,
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

    subscribeVoiceAssistantTopic() {
        this.rosService.voiceAssistantReceiver$.subscribe((message) => {
            this.voiceAssistantActiveStatus =
                JSON.parse(message).activationFlag ?? false;
            this.voiceAssistantActiveStatusSubject.next(
                this.voiceAssistantActiveStatus,
            );
        });
    }
    toggleVoiceAssistantActivation() {
        this.rosService.sendVoiceActivationMessage({
            activationFlag: !this.voiceAssistantActiveStatus,
        } as VoiceAssistantMsg);
    }
}
