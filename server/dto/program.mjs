export class program{
    constructor(name, codeVisual, programNumber, pythonCode){
        this.name = name;
        this.codeVisual = codeVisual;
        this.programNumber = programNumber;
        this.pythonCode = pythonCode
    }
    static getProgram(p){
        return new program(p.name, p.codeVisual, p.programNumber, p.pythonCode);
    }

    static newProgram(name, codeVisual){
        return new program(name, codeVisual, Math.floor(Math.random() * (1000 - 10 + 1) + 10), "");
    }

    static returnCode(program){
        return {"visual" : program.codeVisual, "pythonCode" : ""};
    }
}
export default program