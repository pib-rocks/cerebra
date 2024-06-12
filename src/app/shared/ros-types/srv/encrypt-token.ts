export interface EncryptTokenRequest {
    token: string;
    password: string;
}

export interface EncryptTokenResponse {
    is_successful: boolean;
}
