export class CameraSettings {
    resolution: string;
    refreshRate: number;
    qualityFactor: number;
    isActive?: boolean;
    resX: number;
    resY: number;

    constructor(
        resolution: string,
        refreshRate: number,
        qualityFactor: number,
        resX: number,
        resY: number,
        isActive?: boolean,
    ) {
        this.resolution = resolution;
        this.refreshRate = refreshRate;
        this.qualityFactor = qualityFactor;
        this.isActive = isActive ?? false;
        this.resX = resX;
        this.resY = resY;
    }
}
