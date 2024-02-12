export class CameraSettings{
    constructor(resolution, refeshRate, qualityFactor, resX, resY){
        this.resolution = resolution;
        this.refeshRate = refeshRate;
        this.qualityFactor = qualityFactor;
        this.resX = resX;
        this.resY = resY;
    }

    static getCameraSettings(cs){
        return new CameraSettings(cs.resolution, cs.refeshRate, cs.qualityFactor, cs.resX, cs.resY);
    }
}
export default CameraSettings