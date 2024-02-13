export class Program{
    constructor(name, visual, programNumber){
        this.name = name;
        this.visual = visual;
        this.programNumber = programNumber;
    }
    static getProgram(p){
        return new Program(p.name, p.visual, p.programNumber);
    }

    static newProgram(name, visual){
        return new Program(name, visual, Math.floor(Math.random() * (1000 - 10 + 1) + 10), "");
    }

    static returnCode(program){
        return {"visual" : program.visual};
    }
}
export default Program