export enum ExecutionState {
    RUNNING,
    FINISHED,
    NOT_STARTED,
}

export interface ProgramState {
    executionState: ExecutionState;
    exitCode?: number;
}
