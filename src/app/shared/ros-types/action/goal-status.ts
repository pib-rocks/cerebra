export enum GoalStatus {
    REJECT = 1,
    ACCEPT = 2,
    SUCCEED = 3,
    ABORT = 4,
    CANCELED = 5,
}

export const isTerminal = (status: GoalStatus) => {
    return (
        status == GoalStatus.REJECT ||
        status == GoalStatus.SUCCEED ||
        status == GoalStatus.ABORT ||
        status == GoalStatus.CANCELED
    );
};
