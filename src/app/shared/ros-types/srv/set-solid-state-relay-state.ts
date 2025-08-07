import {SolidStateRelayState} from "../msg/solid-state-relay-state";

export interface SetSolidStateRelayStateRequest {
    solid_state_relay_state: SolidStateRelayState;
}

export interface SetSolidStateRelayStateResponse {
    successful: boolean;
}
