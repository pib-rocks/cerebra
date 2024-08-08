// represents one line of logs of a program. May represent a process's output
// to stdout/stderr as well as its input to stdin
export interface ProgramLogLine {
    content: string;
    isError: boolean;
    hasInput: boolean;
}
