import GenertateId from "../util/generateId.mjs";

export class Program{
    constructor(name, visual, programNumber){
        this.name = name;
        this.visual = visual;
        this.programNumber = programNumber;
    }
    static getProgram(program){
        return new Program(program.name, program.visual, program.programNumber);
    }

    static newProgram(name, visual){
        return new Program(name, visual, GenertateId.genertateId(), "");
    }

    static returnCode(program){
        return {"visual" : program.visual};
    }
}
export default Program