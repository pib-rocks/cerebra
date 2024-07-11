export interface EncryptTokenRequest {
    token: string;
    password: string;
}

export interface EncryptTokenResponse {
    successful: boolean;
}
