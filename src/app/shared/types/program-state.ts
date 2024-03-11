export enum ExecutionState {
    NOT_STARTED, // program has never executed since loading the page
    STARTING, // execution of program has been requested, but no goal-handle received yet
    RUNNING, // executing
    FINISHED_SUCCESSFUL, // program has finished successfully (exit code = 0)
    FINISHED_ERROR, // program finished with errors (exit-code != 0)
    INTERRUPTED, // execution of program was interrupted by user
}

export interface ProgramState {
    executionState: ExecutionState;
    exitCode?: number;
}
