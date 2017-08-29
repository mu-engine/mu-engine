import { RenderData } from "../components/render-component";
import { RenderEventData } from "../events/render-event";
import { shapeFor, PositionEntity  } from "../util/shape";
import { identity, translate, scale} from "../util/matrix";

export interface RenderEntity extends PositionEntity {
  render: RenderData;
}

export function RenderSystem(entity: RenderEntity): void {
  entity.on("render", (event: RenderEventData) => {
    identity(entity.render.transform);

    if (entity.position.mask != null) {
      entity.render.shape = shapeFor(entity);
      entity.render.shape.translate(-entity.position.x, -entity.position.y);
    } else {
      entity.render.shape = null;
      scale(entity.render.transform, entity.position.width,
                                     entity.position.height);
    }

    translate(entity.render.transform, entity.position.x, entity.position.y);

    event.backend.add(entity.render);
  });
}
