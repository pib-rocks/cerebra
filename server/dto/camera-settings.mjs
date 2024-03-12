export class CameraSettings {
    constructor(resolution, refeshRate, qualityFactor, resX, resY) {
        this.resolution = resolution;
        this.refeshRate = refeshRate;
        this.qualityFactor = qualityFactor;
        this.resX = resX;
        this.resY = resY;
    }

    static getCameraSettings(cammeraSettings) {
        return new CameraSettings(
            cammeraSettings.resolution,
            cammeraSettings.refeshRate,
            cammeraSettings.qualityFactor,
            cammeraSettings.resX,
            cammeraSettings.resY,
        );
    }
}
export default CameraSettings;
