import {TestBed} from "@angular/core/testing";
import {Subject} from "rxjs";
import {ApiService} from "src/app/shared/services/api.service";
import {MicrophoneArrayRosbridgeService} from "./microphone-array-rosbridge.service";
import {
    MicrophoneArrayService,
    MicrophoneArrayViewModel,
} from "./microphone-array.service";

const TUNING_READ_ORDER = [
    "preset",
    "led_mode",
    "led_brightness",
    "led_color",
    "vad_led",
    "AGCONOFF",
    "AGCMAXGAIN",
    "AGCDESIREDLEVEL",
    "AGCTIME",
    "HPFONOFF",
    "ECHOONOFF",
    "STATNOISEONOFF",
    "STATNOISEONOFF_SR",
    "NONSTATNOISEONOFF",
    "NONSTATNOISEONOFF_SR",
] as const;

interface RecordedRead {
    name: string;
    subject: Subject<unknown>;
}

describe("MicrophoneArrayService", () => {
    let service: MicrophoneArrayService;
    let reads: RecordedRead[];

    beforeEach(() => {
        reads = [];
        const rosbridge = jasmine.createSpyObj(
            "MicrophoneArrayRosbridgeService",
            ["connect", "disconnect", "getParameter", "setParameter"],
        );
        rosbridge.getParameter.and.callFake((name: string) => {
            const subject = new Subject<unknown>();
            reads.push({name, subject});
            return subject.asObservable();
        });

        TestBed.configureTestingModule({
            providers: [
                MicrophoneArrayService,
                {
                    provide: MicrophoneArrayRosbridgeService,
                    useValue: rosbridge,
                },
                {
                    provide: ApiService,
                    useValue: jasmine.createSpyObj("ApiService", ["get"]),
                },
            ],
        });
        service = TestBed.inject(MicrophoneArrayService);
    });

    afterEach(() => {
        for (const read of reads) {
            if (!read.subject.closed) {
                read.subject.complete();
            }
        }
    });

    function prefixed(name: string): string {
        return `/doa_publisher:${name}`;
    }

    function answer(index: number, value: unknown): void {
        reads[index].subject.next(value);
        reads[index].subject.complete();
    }

    it("requests one tuning parameter at a time, in TUNING_READ_ORDER", () => {
        const subscription = service.getTuning().subscribe();

        expect(reads.length).toBe(1);
        expect(reads[0].name).toBe(prefixed(TUNING_READ_ORDER[0]));

        for (let index = 0; index < TUNING_READ_ORDER.length; index++) {
            expect(reads.length).toBe(index + 1);
            expect(reads[index].name).toBe(prefixed(TUNING_READ_ORDER[index]));
            answer(index, index);
        }

        expect(reads.map((read) => read.name)).toEqual(
            TUNING_READ_ORDER.map((name) => prefixed(name)),
        );
        subscription.unsubscribe();
    });

    it("maps the sequential answers onto the same view model", () => {
        let viewModel: MicrophoneArrayViewModel | undefined;
        service.getTuning().subscribe((value) => {
            viewModel = value;
        });

        const answers: unknown[] = [
            "Standard",
            "off",
            16,
            "#000000",
            1,
            0,
            31.6,
            0.005,
            1,
            2,
            1,
            0,
            1,
            1,
            0,
        ];
        for (let index = 0; index < answers.length; index++) {
            expect(reads.length).toBe(index + 1);
            answer(index, answers[index]);
        }

        expect(viewModel).toEqual({
            preset: "Standard",
            ledMode: "off",
            ledBrightness: 16,
            ledColor: "#000000",
            vadLed: true,
            agcEnabled: false,
            agcMaxGain: 31.6,
            agcDesiredLevel: 0.005,
            agcTime: 1,
            highPassFilter: 2,
            echoEnabled: true,
            stationaryNoiseSuppression: false,
            stationaryNoiseSuppressionSr: true,
            nonStationaryNoiseSuppression: true,
            nonStationaryNoiseSuppressionSr: false,
        });
    });

    it("stops the sequence when a read fails and surfaces that cause", () => {
        const errors: Error[] = [];
        let viewModel: MicrophoneArrayViewModel | undefined;
        service.getTuning().subscribe({
            next: (value) => {
                viewModel = value;
            },
            error: (error: Error) => errors.push(error),
        });

        answer(0, "Standard");
        answer(1, "off");
        expect(reads.length).toBe(3);
        expect(reads[2].name).toBe("/doa_publisher:led_brightness");

        const cause = new Error(
            "Reading /doa_publisher:led_brightness timed out after 2500 ms.",
        );
        reads[2].subject.error(cause);

        expect(reads.length).toBe(3);
        expect(viewModel).toBeUndefined();
        expect(errors).toEqual([cause]);
    });
});
