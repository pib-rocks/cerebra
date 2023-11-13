export interface Program {
    programNumber?: string;
    name: string;
    program: string;
}

export function cloneProgram(program: Program): Program {
    return {...program};
}
