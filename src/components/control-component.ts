export interface ControlData {
  xAccel: number;
  yAccel: number;
  xSpeed: number;
  ySpeed: number;
  jumpSpeed: number;
  jumpCutoff: number;
}

export class ControlComponent implements ControlData {
  xAccel: number;
  yAccel: number;
  xSpeed: number;
  ySpeed: number;
  jumpSpeed: number;
  jumpCutoff: number;

  constructor(options?: Partial<ControlData>) {
    Object.assign(this, {
      xAccel: 0,
      yAccel: 0,
      xSpeed: 0,
      ySpeed: 0,
      jumpSpeed: 0,
      jumpCutoff: 0,
    }, options);
  }
}
