export class cameraSettings{
    constructor(resolution, refeshRate, qualityFactor, resX, resY){
        this.resolution = resolution;
        this.refeshRate = refeshRate;
        this.qualityFactor = qualityFactor;
        this.resX = resX;
        this.resY = resY;
    }

    getCameraSettings(cs){
        return new cameraSettings(cs.resolution, cs.refeshRate, cs.qualityFactor, cs.resX, cs.resY);
    }
}
export default cameraSettings