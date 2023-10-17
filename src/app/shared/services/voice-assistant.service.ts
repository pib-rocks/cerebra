import {Injectable} from "@angular/core";
import {ApiService} from "./api.service";
import {
    VoiceAssistant,
    parseVoiceAssistantToDto,
} from "../types/voice-assistant";
import {catchError, tap, throwError} from "rxjs";
import {UrlConstants} from "./url.constants";

@Injectable({
    providedIn: "root",
})
export class VoiceAssistantService {
    personalities: VoiceAssistant[] = [];

    constructor(private apiService: ApiService) {}

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
                this.personalities = response[
                    "voiceAssistantPersonalities"
                ] as VoiceAssistant[];
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
                this.personalities = response[
                    "voiceAssistantPersonalities"
                ] as VoiceAssistant[];
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
                console.log(response);
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
                console.log(response);
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
            .subscribe((response) => {
                console.log(response);
            });
    }
}
