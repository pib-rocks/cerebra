import {SolidStateRelayState} from "../msg/solid-state-relay-state";

export interface SetSolidStateRelayStateRequest {
    solidStateRelayState: SolidStateRelayState;
}

export interface SetSolidStateRelayStateResponse {
    successful: boolean;
}
