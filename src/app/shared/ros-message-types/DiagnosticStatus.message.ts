export interface KeyValue {
    key: string;
    value: string;
}

export interface DiagnosticStatus {
    level: BinaryType;
    name: string;
    message?: string;
    hardware_id: string;
    values: KeyValue[];
}
