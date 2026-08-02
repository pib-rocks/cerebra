declare module "speech-to-element/dist/types/options" {
    export interface WebSpeechOptions {
        language?: string;
    }

    export interface AzureOptions {
        retrieveToken?: () => Promise<string | void>;
        subscriptionKey?: string;
        token?: string;
        region: string;
        language?: string;
        endpointId?: string;
        deviceId?: string;
        stopAfterSilenceMs?: number;
    }

    export interface Translations {
        [key: string]: string;
    }

    export interface TextColor {
        interim?: string;
        final?: string;
    }

    export interface Commands {
        stop?: string;
        pause?: string;
        resume?: string;
        reset?: string;
        removeAllText?: string;
        commandMode?: string;
    }
}
