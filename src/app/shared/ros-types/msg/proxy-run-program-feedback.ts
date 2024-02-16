import {ProgramOutputLine} from "./program-output-line";

export interface ProxyRunProgramFeedback {
    proxy_goal_id: string;
    output_lines: ProgramOutputLine[];
}
