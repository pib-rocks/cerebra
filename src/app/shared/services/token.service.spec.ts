import {TestBed, fakeAsync, tick} from "@angular/core/testing";

import {
    TokenService,
    UNKNOWN_TOKEN_STATUS,
    normalizeTokenStatus,
} from "./token.service";
import {RosService} from "./ros-service/ros.service";
import {BehaviorSubject, of, Subject, throwError} from "rxjs";
import {createServiceSpy} from "src/app/shared/testing/create-service-spy";

describe("TokenServiceService", () => {
    let tokenService: TokenService;
    let rosService: jasmine.SpyObj<RosService>;
    let connectionStatusSubject: BehaviorSubject<boolean>;

    beforeEach(() => {
        connectionStatusSubject = new BehaviorSubject<boolean>(false);
        const rosServiceSpy = createServiceSpy<RosService>(
            "RosService",
            ["checkTokenExists"],
            {
                connectionStatus$: connectionStatusSubject.asObservable(),
            },
        );
        // A connection event calls checkTokenExists() synchronously, and the
        // service subscribes to what the ROS call returns. Without a default
        // the spy answers undefined, the service throws inside its own
        // subscription, jasmine reports it in afterAll and karma answers with
        // "Disconnected, because no message in 60000 ms" - which took the whole
        // suite down mid-run (PC-65).
        rosServiceSpy.checkTokenExists.and.returnValue(
            of({token_exists: false, token_active: false}),
        );

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: RosService,
                    useValue: rosServiceSpy,
                },
            ],
        });
        tokenService = TestBed.inject(TokenService);
        rosService = TestBed.inject(RosService) as jasmine.SpyObj<RosService>;
    });

    it("should be created", () => {
        expect(tokenService).toBeTruthy();
    });

    it("starts with an unknown probe, not a missing token", () => {
        let status = UNKNOWN_TOKEN_STATUS;
        tokenService.tokenStatus$.subscribe((value) => {
            status = value;
        });
        expect(status).toEqual({
            tokenExists: null,
            tokenActive: null,
            service: "unknown",
            error: null,
        });
    });

    it("should call rosService.checkTokenExists and publish an available reading", () => {
        const tokenResponse = {token_exists: true, token_active: true};
        rosService.checkTokenExists.and.returnValue(of(tokenResponse));

        const seen: unknown[] = [];
        tokenService.tokenStatus$.subscribe((status) => seen.push(status));

        tokenService.checkTokenExists();

        expect(seen).toContain(
            jasmine.objectContaining({
                tokenExists: null,
                tokenActive: null,
                service: "loading",
                error: null,
            }),
        );
        expect(seen).toContain(
            jasmine.objectContaining({
                tokenExists: true,
                tokenActive: true,
                service: "available",
                error: null,
            }),
        );
        expect(rosService.checkTokenExists).toHaveBeenCalled();
    });

    it("maps transport failure to unavailable without erasing presence", () => {
        rosService.checkTokenExists.and.returnValue(
            throwError(
                () => new Error("Service /get_token_exists does not exist"),
            ),
        );

        const seen: unknown[] = [];
        tokenService.tokenStatus$.subscribe((status) => seen.push(status));

        tokenService.checkTokenExists();

        expect(seen).toContain(
            jasmine.objectContaining({
                tokenExists: null,
                tokenActive: null,
                service: "unavailable",
                error: "Service /get_token_exists does not exist",
            }),
        );
    });

    it("drops stale responses when a newer probe starts", () => {
        const first = new Subject<{
            token_exists: boolean;
            token_active: boolean;
        }>();
        const second = new Subject<{
            token_exists: boolean;
            token_active: boolean;
        }>();
        rosService.checkTokenExists.and.returnValues(
            first.asObservable(),
            second.asObservable(),
        );

        let latest = UNKNOWN_TOKEN_STATUS;
        tokenService.tokenStatus$.subscribe((status) => {
            latest = status;
        });

        tokenService.checkTokenExists();
        first.next({token_exists: true, token_active: true});

        tokenService.checkTokenExists();
        expect(latest.service).toBe("loading");

        second.next({token_exists: false, token_active: false});
        expect(latest).toEqual({
            tokenExists: false,
            tokenActive: false,
            service: "available",
            error: null,
        });

        first.next({token_exists: true, token_active: true});
        expect(latest.tokenExists).toBeFalse();
    });

    it("should check token status when ROS connects", () => {
        spyOn(tokenService, "checkTokenExists");

        connectionStatusSubject.next(true);

        expect(tokenService.checkTokenExists).toHaveBeenCalled();
    });

    it("returns to unknown when ROS disconnects", () => {
        connectionStatusSubject.next(true);
        rosService.checkTokenExists.and.returnValue(
            of({token_exists: true, token_active: true}),
        );
        tokenService.checkTokenExists();

        let latest = UNKNOWN_TOKEN_STATUS;
        tokenService.tokenStatus$.subscribe((status) => {
            latest = status;
        });

        connectionStatusSubject.next(false);
        expect(latest).toEqual(UNKNOWN_TOKEN_STATUS);
    });

    it("transitions from loading to unavailable when /get_token_exists times out", fakeAsync(() => {
        const neverResponds = new Subject<{
            token_exists: boolean;
            token_active: boolean;
        }>();
        rosService.checkTokenExists.and.returnValue(
            neverResponds.asObservable(),
        );

        let latest = UNKNOWN_TOKEN_STATUS;
        tokenService.tokenStatus$.subscribe((status) => {
            latest = status;
        });

        tokenService.checkTokenExists();
        expect(latest.service).toBe("loading");

        tick(TokenService.PROBE_TIMEOUT_MS + 50);

        expect(latest.service).toBe("unavailable");
        expect(latest.tokenExists).toBeNull();
        expect(latest.tokenActive).toBeNull();
        expect(latest.error).toBeTruthy();
    }));
});

describe("normalizeTokenStatus", () => {
    it("treats legacy boolean payloads as an available probe", () => {
        expect(
            normalizeTokenStatus({tokenExists: true, tokenActive: true}),
        ).toEqual({
            tokenExists: true,
            tokenActive: true,
            service: "available",
            error: null,
        });
    });

    it("does not read unavailable service as a missing token", () => {
        expect(
            normalizeTokenStatus({
                tokenExists: false,
                tokenActive: false,
                service: "unavailable",
                error: "down",
            }),
        ).toEqual({
            tokenExists: null,
            tokenActive: null,
            service: "unavailable",
            error: "down",
        });
    });

    it("keeps unknown separate from absence", () => {
        expect(normalizeTokenStatus({})).toEqual({
            tokenExists: null,
            tokenActive: null,
            service: "unknown",
            error: null,
        });
    });
});
