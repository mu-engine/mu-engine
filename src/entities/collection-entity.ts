import { Entity } from "./entity";
import { BaseEntity } from "./base-entity";

import {
  EntityAddEventData,
  EntityDestroyEventData,
} from "../events/entity-event";

export class CollectionEntity extends BaseEntity {
  private _collection: { [id: number ]: Entity | undefined };

  constructor() {
    super();
    this._collection = {};

    this.last((event: string, data: any) => {
      for (let e in this._collection) {
        const entity = this._collection[e];

        if (entity !== undefined) {
          if (entity.send(event, data)) {
            return true;
          }
        }
      }

      return false;
    });

    this.on("put", (ev: EntityAddEventData) => {
      this.put(ev.target);
    });

    this.on("remove", (ev: EntityDestroyEventData) => {
      this.remove(ev.target);
    });
  }

  put(entity: Entity): this {
    if (entity.parent === undefined) {
      this._collection[entity.id] = entity;
      entity.parent = this;
    }

    return this;
  }

  remove(entity: Entity): this {
    if (entity.parent === this) {
      delete entity.parent;
      delete this._collection[entity.id];
    }

    return this;
  }
}
