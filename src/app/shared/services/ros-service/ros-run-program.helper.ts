import * as ROSLIB from "roslib";
import {Observable, Subject, BehaviorSubject, filter, from, map} from "rxjs";
import {
    RunProgramFeedback,
    RunProgramResult,
} from "../../ros-types/action/run-program";
import {GoalHandle} from "../../ros-types/action/goal-handle";
import {
    ProxyRunProgramStartRequest,
    ProxyRunProgramStartResponse,
} from "../../ros-types/srv/proxy-run-program-start";
import {ProxyRunProgramStopRequest} from "../../ros-types/srv/proxy-run-program-stop";
import {ProxyRunProgramFeedback} from "../../ros-types/msg/proxy-run-program-feedback";
import {ProxyRunProgramResult} from "../../ros-types/msg/proxy-run-program-result";
import {ProxyRunProgramStatus} from "../../ros-types/msg/proxy-run-program-status";
import {ListModelsResponse, ModelInfo} from "../../ros-types/srv/list-models";
import {
    ModelActionResponse,
    StartModelRequest,
} from "../../ros-types/srv/start-model";
import {StopModelRequest} from "../../ros-types/srv/stop-model";
import {ModelStatusArray} from "../../ros-types/msg/model-status";

export interface RosRunProgramHost {
    proxyProgramStartService: ROSLIB.Service<
        ProxyRunProgramStartRequest,
        ProxyRunProgramStartResponse
    >;
    proxyProgramStopService: ROSLIB.Service<
        ProxyRunProgramStopRequest,
        Record<string, never>
    >;
    proxyRunProgramFeedbackReceiver$: Subject<ProxyRunProgramFeedback>;
    proxyRunProgramResultReceiver$: Subject<ProxyRunProgramResult>;
    proxyRunProgramStatusReceiver$: Subject<ProxyRunProgramStatus>;
}

export interface RosModelLifecycleHost {
    listModelsService: ROSLIB.Service<
        Record<string, never>,
        ListModelsResponse
    >;
    startModelService: ROSLIB.Service<StartModelRequest, ModelActionResponse>;
    stopModelService: ROSLIB.Service<StopModelRequest, ModelActionResponse>;
    modelStatusReceiver$: BehaviorSubject<ModelStatusArray>;
    detectionClearReceiver$: Subject<string | undefined>;
}

function getfilteredFeedback(
    host: RosRunProgramHost,
    proxyGoalId: string,
): Observable<RunProgramFeedback> {
    return host.proxyRunProgramFeedbackReceiver$.pipe(
        filter((output) => output.proxy_goal_id == proxyGoalId),
    );
}

function getFilteredResult(
    host: RosRunProgramHost,
    proxyGoalId: string,
): Observable<RunProgramResult> {
    return host.proxyRunProgramResultReceiver$.pipe(
        filter((result) => result.proxy_goal_id == proxyGoalId),
    );
}

function getfilteredStatus(
    host: RosRunProgramHost,
    proxyGoalId: string,
): Observable<number> {
    return host.proxyRunProgramStatusReceiver$
        .pipe(filter((status) => status.proxy_goal_id == proxyGoalId))
        .pipe(map((status) => status.status));
}

function getCancelFunction(
    host: RosRunProgramHost,
    proxyGoalId: string,
): () => void {
    return () => {
        host.proxyProgramStopService.callService(
            {proxy_goal_id: proxyGoalId},
            () => undefined,
            () => {
                throw new Error("failed to cancel...");
            },
        );
    };
}

export function runProgramOnHost(
    host: RosRunProgramHost,
    programNumber: string,
): Observable<GoalHandle<RunProgramFeedback, RunProgramResult>> {
    return from(
        new Promise<GoalHandle<RunProgramFeedback, RunProgramResult>>(
            (resolve, reject) => {
                host.proxyProgramStartService.callService(
                    {program_number: programNumber},
                    (response) => {
                        const proxyGoalId = response.proxy_goal_id;
                        resolve({
                            feedback: getfilteredFeedback(host, proxyGoalId),
                            result: getFilteredResult(host, proxyGoalId),
                            status: getfilteredStatus(host, proxyGoalId),
                            cancel: getCancelFunction(host, proxyGoalId),
                        });
                    },
                    (errorMsg) => {
                        reject(new Error(errorMsg));
                    },
                );
            },
        ),
    );
}

export function listModelsOnHost(
    host: RosModelLifecycleHost,
): Observable<ListModelsResponse> {
    return from(
        new Promise<ListModelsResponse>((resolve, reject) => {
            host.listModelsService.callService(
                {},
                (response) => resolve(response),
                (error) => reject(new Error(error)),
            );
        }),
    );
}

export function clearModelPipelineState(host: RosModelLifecycleHost): void {
    host.modelStatusReceiver$.next({models: []});
    host.detectionClearReceiver$.next(undefined);
}

export function callModelActionOnHost<Request extends object>(
    host: RosModelLifecycleHost,
    service: ROSLIB.Service<Request, ModelActionResponse>,
    request: Request,
    modelLifecycleTimeoutSeconds: number,
): Observable<void> {
    return from(
        new Promise<void>((resolve, reject) => {
            service.callService(
                request,
                (response) => {
                    if (response?.success === false) {
                        reject(
                            new Error(
                                response.message || "Model request failed",
                            ),
                        );
                        return;
                    }
                    resolve();
                },
                (error) => reject(new Error(error)),
                modelLifecycleTimeoutSeconds,
            );
        }),
    );
}

export function startModelOnHost(
    host: RosModelLifecycleHost,
    model: ModelInfo,
    owner: string,
    modelLifecycleTimeoutSeconds: number,
): Observable<void> {
    clearModelPipelineState(host);
    return callModelActionOnHost(
        host,
        host.startModelService,
        {
            model_id: model.model_id,
            shaves: model.shaves,
            owner,
        },
        modelLifecycleTimeoutSeconds,
    );
}

export function stopModelOnHost(
    host: RosModelLifecycleHost,
    modelId: string,
    owner: string,
    modelLifecycleTimeoutSeconds: number,
): Observable<void> {
    clearModelPipelineState(host);
    return callModelActionOnHost(
        host,
        host.stopModelService,
        {model_id: modelId, owner},
        modelLifecycleTimeoutSeconds,
    );
}
