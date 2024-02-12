export class cameraSettings{
    constructor(resolution, refeshRate, qualityFactor, resX, resY){
        this.resolution = resolution;
        this.refeshRate = refeshRate;
        this.qualityFactor = qualityFactor;
        this.resX = resX;
        this.resY = resY;
    }

    getCameraSettings(resolution, refeshRate, qualityFactor, resX, resY){
        return new cameraSettings(resolution, refeshRate, qualityFactor, resX, resY);
    }
}
export default cameraSettings