import * as ROSLIB from "roslib";
import {
    callRosServiceBooleanFallback$,
    callRosServiceReplay$,
    callRosServiceVoidWhenSuccessful$,
    emitReplayOnce$,
    serviceErrorText,
} from "./ros-service-call.helper";

describe("ros-service-call.helper", () => {
    it("formats service errors", () => {
        expect(serviceErrorText("boom")).toBe("boom");
        expect(serviceErrorText(new Error("bad"))).toBe("bad");
        expect(serviceErrorText(null)).toBe("Token service error");
    });

    it("completes emitReplayOnce$ after emitting", () => {
        let completed = false;
        emitReplayOnce$("ok").subscribe({
            next: (value) => expect(value).toBe("ok"),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes boolean fallback observables after success and error", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {successful: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {successful: boolean}) => void) =>
                success({successful: true}),
        );
        let completed = false;
        callRosServiceBooleanFallback$(
            service,
            {},
            (r) => r.successful,
        ).subscribe({complete: () => (completed = true)});
        expect(completed).toBeTrue();

        service.callService.and.callFake((_req, _s, error: () => void) =>
            error(),
        );
        completed = false;
        callRosServiceBooleanFallback$(
            service,
            {},
            (r) => r.successful,
        ).subscribe({
            next: (value) => expect(value).toBeFalse(),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes void service calls after a successful response", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {successful: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {successful: boolean}) => void) =>
                success({successful: true}),
        );
        let completed = false;
        callRosServiceVoidWhenSuccessful$(service, {}, "failed").subscribe({
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });

    it("completes replay service calls after mapping success", () => {
        const service = jasmine.createSpyObj<
            ROSLIB.Service<object, {listening: boolean}>
        >("svc", ["callService"]);
        service.callService.and.callFake(
            (_req, success: (res: {listening: boolean}) => void) =>
                success({listening: true}),
        );
        let completed = false;
        callRosServiceReplay$(
            service,
            {},
            {
                mapSuccess: (response) => response.listening,
            },
        ).subscribe({
            next: (value) => expect(value).toBeTrue(),
            complete: () => (completed = true),
        });
        expect(completed).toBeTrue();
    });
});
