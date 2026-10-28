export interface RosCameraPublishHost {
    cameraTimerPeriodTopic?: {publish: (message: {data: number}) => void};
    cameraPreviewSizeTopic?: {
        publish: (message: {data: number[]}) => void;
    };
    cameraQualityFactorTopic?: {publish: (message: {data: number}) => void};
    programInputTopic: {
        publish: (message: {input: string; mpid: number}) => void;
    };
    expressionTopic?: {publish: (message: {data: string}) => void};
    displayTextTopic?: {publish: (message: {data: string}) => void};
}

export function setTimerPeriodOnHost(
    host: RosCameraPublishHost,
    period: number,
): void {
    if (!host.cameraTimerPeriodTopic) {
        console.error("ROS is not connected.");
        return;
    }
    host.cameraTimerPeriodTopic.publish({data: period});
}

export function setPreviewSizeOnHost(
    host: RosCameraPublishHost,
    width: number,
    height: number,
): void {
    if (!host.cameraPreviewSizeTopic) {
        console.error("ROS is not connected.");
        return;
    }
    host.cameraPreviewSizeTopic.publish({data: [width, height]});
}

export function setQualityFactorOnHost(
    host: RosCameraPublishHost,
    factor: number,
): void {
    if (!host.cameraQualityFactorTopic) {
        console.error("ROS is not connected.");
        return;
    }
    host.cameraQualityFactorTopic.publish({data: factor});
}

export function publishProgramInputOnHost(
    host: RosCameraPublishHost,
    input: string,
    mpid: number,
): void {
    host.programInputTopic.publish({input, mpid});
}

export function publishExpressionOnHost(
    host: RosCameraPublishHost,
    expression: string,
): void {
    if (!host.expressionTopic) {
        return;
    }
    host.expressionTopic.publish({data: expression});
}

export function publishDisplayTextOnHost(
    host: RosCameraPublishHost,
    text: string,
): void {
    if (!host.displayTextTopic) {
        return;
    }
    host.displayTextTopic.publish({data: text});
}
