export interface User {
  readonly id: string;
  readonly email: string;
  readonly defaultDomain: string;
  readonly createdAt: Date;
}

export interface UserCreateInput {
  readonly id: string;
  readonly email: string;
  readonly defaultDomain?: string;
}
