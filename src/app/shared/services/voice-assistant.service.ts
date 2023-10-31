import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {
    VoiceAssistant,
    parseVoiceAssistantToDto,
} from "../types/voice-assistant";
import {BehaviorSubject, catchError, throwError} from "rxjs";
import {UrlConstants} from "./url.constants";

@Injectable({
    providedIn: "root",
})
export class VoiceAssistantService {
    personalityByIdResponse: VoiceAssistant | undefined;
    personalities: VoiceAssistant[] = [];
    personalitiesSubject: BehaviorSubject<VoiceAssistant[]> =
        new BehaviorSubject<VoiceAssistant[]>([]);
    lastSelectedIdSubject: BehaviorSubject<string> =
        new BehaviorSubject<string>("");

    constructor(private apiService: ApiService) {
        this.getAllPersonalities();
    }

    private updatePersonality(updatePersonality: VoiceAssistant) {
        const index = this.personalities.findIndex(
            (p) => p.personalityId === updatePersonality.personalityId,
        );
        this.personalities[index] = updatePersonality;
        this.personalitiesSubject.next(this.personalities.slice());
    }

    private setPersonalities(personalities: VoiceAssistant[]) {
        this.personalities = personalities;
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
        console.log(this.personalities);
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

    getPersonalityById(id: string) {
        this.apiService
            .get(UrlConstants.PERSONALITY + `/${id}`)
            .pipe(
                catchError((err) => {
                    return throwError(() => {
                        console.log(err);
                    });
                }),
            )
            .subscribe((response) => {
                this.personalityByIdResponse = response as VoiceAssistant;
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
                let personality = response as VoiceAssistant;
                this.lastSelectedIdSubject.next(personality.personalityId);
                this.addPersonality(personality);
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
                this.personalityByIdResponse = response as VoiceAssistant;
                this.updatePersonality(response.personalityId);
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
}
