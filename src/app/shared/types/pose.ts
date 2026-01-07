export interface PoseDTO {
    name: string;
    poseId: string;
    deletable: boolean;
}

export class Pose {
    name: string;
    poseId: string;
    deletable: boolean = true;
    active: boolean = true;

    constructor(name: string, poseId: string, deletable: boolean = true) {
        this.name = name;
        this.poseId = poseId;
        this.deletable = deletable;
    }
}
