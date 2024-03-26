export enum ExecutionState {
    NOT_STARTED = 0, // program has never executed since loading the page
    STARTING = 1, // execution of program has been requested, but no goal-handle received yet
    RUNNING = 2, // executing
    FINISHED_SUCCESSFUL = 3, // program has finished successfully (exit code = 0)
    FINISHED_ERROR = 4, // program finished with errors (exit-code != 0)
    INTERRUPTED = 5, // execution of program was interrupted by user
}

export interface ProgramState {
    executionState: ExecutionState;
    exitCode?: number;
}
