import * as ROSLIB from "roslib";
import {Observable, ReplaySubject} from "rxjs";
import {MotorSettingsMessage} from "../../ros-types/msg/motor-settings-message";
import {MotorSettingsError} from "../../error/motor-settings-error";
import {ApplyMotorSettingsResponse} from "../../ros-types/srv/apply-motor-settings";
import {ExistTokenResponse} from "../../ros-types/srv/exist-token";

export function serviceErrorText(error: unknown): string {
    if (typeof error === "string" && error.trim() !== "") {
        return error;
    }
    if (error instanceof Error && error.message.trim() !== "") {
        return error.message;
    }
    if (error == null) {
        return "Token service error";
    }
    return String(error);
}

function replaySubject$<T>(): ReplaySubject<T> {
    return new ReplaySubject<T>(1);
}

export function emitReplayOnce$<T>(value: T): Observable<T> {
    const subject = replaySubject$<T>();
    subject.next(value);
    subject.complete();
    return subject.asObservable();
}

export function callRosServiceReplay$<Req extends object, Res, T>(
    service: ROSLIB.Service<Req, Res> | undefined,
    request: Req,
    options: {
        missingServiceError?: string;
        mapSuccess: (response: Res) => T;
        mapError?: (error: unknown) => Error;
    },
): Observable<T> {
    const subject = replaySubject$<T>();
    if (service === undefined) {
        subject.error(
            new Error(
                options.missingServiceError ?? "ROS service is undefined",
            ),
        );
        return subject.asObservable();
    }

    service.callService(
        request,
        (response) => {
            try {
                subject.next(options.mapSuccess(response));
                subject.complete();
            } catch (error) {
                subject.error(
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        },
        (error) => {
            const mapped = options.mapError?.(error);
            subject.error(mapped ?? new Error(serviceErrorText(error)));
        },
    );
    return subject.asObservable();
}

export function callRosServiceBooleanFallback$<Req extends object, Res>(
    service: ROSLIB.Service<Req, Res> | undefined,
    request: Req,
    readSuccessful: (response: Res) => boolean,
): Observable<boolean> {
    const subject = replaySubject$<boolean>();
    if (service === undefined) {
        subject.next(false);
        subject.complete();
        return subject.asObservable();
    }

    service.callService(
        request,
        (response) => {
            subject.next(readSuccessful(response));
            subject.complete();
        },
        () => {
            subject.next(false);
            subject.complete();
        },
    );
    return subject.asObservable();
}

export function callRosServiceVoidWhenSuccessful$<
    Req extends object,
    Res extends {successful: boolean},
>(
    service: ROSLIB.Service<Req, Res>,
    request: Req,
    failureMessage: string,
): Observable<void> {
    const subject = replaySubject$<void>();
    service.callService(
        request,
        (response) => {
            if (response.successful) {
                subject.next();
                subject.complete();
            } else {
                subject.error(new Error(failureMessage));
            }
        },
        (error) => {
            subject.error(new Error(serviceErrorText(error)));
        },
    );
    return subject.asObservable();
}

export function callRosServiceExistToken$(
    service:
        | ROSLIB.Service<Record<string, never>, ExistTokenResponse>
        | undefined,
): Observable<ExistTokenResponse> {
    return callRosServiceReplay$(
        service,
        {},
        {
            missingServiceError: "Token service is undefined",
            mapSuccess: (response) => response,
        },
    );
}

export function callApplyMotorSettings$(
    service: ROSLIB.Service<
        {motor_settings: MotorSettingsMessage},
        ApplyMotorSettingsResponse
    >,
    motorSettingsMessage: MotorSettingsMessage,
): Observable<MotorSettingsMessage> {
    const subject = replaySubject$<MotorSettingsMessage>();
    try {
        service.callService(
            {motor_settings: motorSettingsMessage},
            (response) => {
                if (response["settings_applied"]) {
                    if (response["settings_persisted"]) {
                        subject.next(motorSettingsMessage);
                        subject.complete();
                    } else {
                        subject.error(
                            new MotorSettingsError(motorSettingsMessage, true),
                        );
                    }
                } else {
                    subject.error(
                        new MotorSettingsError(motorSettingsMessage, false),
                    );
                }
            },
            (errorMsg) => {
                subject.error(new Error(errorMsg));
            },
        );
    } catch (error) {
        subject.error(error);
    }
    return subject.asObservable();
}
