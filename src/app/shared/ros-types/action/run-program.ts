export interface RunProgramRequest {
    program_number: string;
}

export interface RunProgramResult {
    exit_code: number;
}

export interface RunProgramFeedback {
    output_line: string;
    is_stderr: boolean;
}
