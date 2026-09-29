/**
 * A device discovered by the backend's Tinkerforge enumeration
 * (GET /bricklet/connected). This describes what is physically attached,
 * not what the hardware profile expects.
 */
export interface ConnectedBricklet {
    /** Display name from the Tinkerforge library, e.g. "Servo Bricklet 2.0". */
    name: string;
    uid: string;
    /**
     * Lowercase port letter of the board the device is plugged into, or an
     * empty string for a device that has no port (the carrier board itself).
     */
    port: string;
    /** UID of the board this device is attached to; empty for the carrier. */
    parentUid: string;
    deviceIdentifier: number;
}
