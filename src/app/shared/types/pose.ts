export interface PoseDTO {
    name: string;
    poseId: string;
}

export class Pose {
    name: string;
    poseId: string;
    active: boolean = true;

    constructor(name: string, poseId: string) {
        this.name = name;
        this.poseId = poseId;
    }
}
