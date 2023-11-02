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
    personalities: VoiceAssistant[] = [];
    personalitiesSubject: BehaviorSubject<VoiceAssistant[]> =
        new BehaviorSubject<VoiceAssistant[]>([]);

    constructor(private apiService: ApiService) {
        this.getAllPersonalities();
    }

    updatePersonalityById(updatePersonality: VoiceAssistant) {
        const index = this.personalities.findIndex(
            (p) => p.personalityId === updatePersonality.personalityId,
        );
        this.personalities[index] = updatePersonality;
        this.personalitiesSubject.next(this.personalities.slice());
    }

    setPersonalities(personalities: VoiceAssistant[]) {
        this.personalities = personalities;
        this.personalitiesSubject.next(this.personalities.slice());
    }

    addPersonality(personality: VoiceAssistant) {
        this.personalities.push(personality);
        this.personalitiesSubject.next(this.personalities.slice());
    }

    deletePersonality(id: string) {
        this.personalities.splice(
            this.personalities.findIndex((p) => p.personalityId === id),
            1,
        );
        this.personalitiesSubject.next(this.personalities.slice());
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
                console.log(this.personalities);
                console.log(response);
            });
    }

    getPersonalityById(id: string) {
        console.log(`/${id}`);
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
                this.updatePersonality(response as VoiceAssistant);
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
                this.addPersonality(response as VoiceAssistant);
            });
    }

    updatePersonality(personality: VoiceAssistant) {
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
                this.updatePersonality(response as VoiceAssistant);
            });
    }

    deletePersonalityById(id: string) {
        console.log(`/${id}`);
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
