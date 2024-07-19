import {ProgramOutputLine} from "./program-output-line";

// a 'ProgramOutput'-object represents the complete logs
// of a running program, that one would expect to see in an
// interactive terminal, i.e. it contains both the content
// written to stdout/stderr by the program, as well as the
// content written to stdin by the user.
// The 'lastLine'-field represents the last line of logs,
// IF the last line is an output-line, i.e. if the
// last line is something that was written to stdout/stderr.
// If however the last line resulted from the user writing
// to stdin, this field is undefined

export type ProgramOutput = {
    lines: ProgramOutputLine[];
    lastLine?: ProgramOutputLine;
};
