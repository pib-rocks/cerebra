export class CameraSetting {
    resolution: string;
    refreshRate: number;
    qualityFactor: number;
    isActive: boolean;
    resX: number;
    resY: number;

    constructor(
        resolution: string,
        refreshRate: number,
        qualityFactor: number,
        isActive: boolean,
        resX: number,
        resY: number,
    ) {
        this.resolution = resolution;
        this.refreshRate = refreshRate;
        this.qualityFactor = qualityFactor;
        this.isActive = isActive;
        this.resX = resX;
        this.resY = resY;
    }
}
