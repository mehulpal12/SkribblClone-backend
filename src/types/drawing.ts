export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawData {
  roomId: string;

  prevPoint: DrawPoint | null;

  currentPoint: DrawPoint;
}