import { Entity } from "../entities/entity";
import { PositionData } from "../components/position-component";
import { shapeFor } from "../modules/shape";
import { Bounds, Dimensions } from "../util/shape";
import { RenderEventData } from "../events/render-event";

export interface CameraConfig {
  camera: {
    bounds: Bounds;
    dimensions: Dimensions;
  };
}

export interface CameraEntity {
  position: PositionData;
}

export function CameraSystem(entity: Entity,
                             target: CameraEntity,
                             config: CameraConfig): void {
  entity.on("prerender", (ev: RenderEventData) => {
    const targetBounds = shapeFor(target).bounds();
    const cameraW = config.camera.dimensions.width;
    const cameraH = config.camera.dimensions.height;

    let [ x, y ] = [
      (targetBounds.left + targetBounds.right) / 2,
      (targetBounds.top + targetBounds.bottom) / 2,
    ];

    x -= cameraW / 2;
    y -= cameraH / 2;

    x = Number((Math.floor(x) + (targetBounds.left % 1)).toFixed(4));
    y = Number((Math.floor(y) + (targetBounds.top % 1)).toFixed(4));

    x = Math.min(Math.max(x, config.camera.bounds.left),
                 config.camera.bounds.right - cameraW + 1);
    y = Math.min(Math.max(y, config.camera.bounds.top),
                 config.camera.bounds.bottom - cameraH + 1);

    ev.viewport.left = x;
    ev.viewport.top = y;
    ev.viewport.right = x + cameraW - 1;
    ev.viewport.bottom = y + cameraH - 1;
  });
}
