export interface JwtPayload {
  userId: number;
  email: string;
  positionId: number;
  positionName: string;
  permissions: string[];
}
