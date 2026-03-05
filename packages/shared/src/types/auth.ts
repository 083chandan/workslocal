export interface ApiKey {
  readonly id: string;
  readonly userId: string;
  readonly keyHash: string;
  readonly prefix: string;
  readonly name: string;
  readonly lastUsedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface ApiKeyCreateInput {
  readonly name: string;
}

export interface ApiKeyCreateResponse {
  readonly key: string;
  readonly id: string;
  readonly prefix: string;
  readonly name: string;
  readonly createdAt: Date;
}
