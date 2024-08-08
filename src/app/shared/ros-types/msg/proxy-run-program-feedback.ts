import {ProgramOutputLine} from "./program-output-line";

export interface ProxyRunProgramFeedback {
    proxy_goal_id: string;
    mpid: number;
    output_lines: ProgramOutputLine[];
}
