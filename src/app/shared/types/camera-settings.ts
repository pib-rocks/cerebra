export class CameraSetting {
    resolution: string;
    refreshRate: number;
    qualityFactor: number;
    isActive: boolean;

    constructor(
        resolution: string,
        refreshRate: number,
        qualityFactor: number,
        isActive: boolean,
    ) {
        this.resolution = resolution;
        this.refreshRate = refreshRate;
        this.qualityFactor = qualityFactor;
        this.isActive = isActive;
    }
}
