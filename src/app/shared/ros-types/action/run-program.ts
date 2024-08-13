import {ProgramOutputLine} from "../msg/program-output-line";

export interface RunProgramRequest {
    program_number: string;
}

export interface RunProgramResult {
    exit_code: number;
}

export interface RunProgramFeedback {
    mpid: number;
    output_lines: ProgramOutputLine[];
}
