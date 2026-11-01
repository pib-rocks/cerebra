import {StdMessageHeader} from "./std-message-header";

export type JointStateMessage = {
    header: StdMessageHeader;
    name: string[];
    position: number[];
};
