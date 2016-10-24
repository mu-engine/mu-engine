import "./poly";

import { Callback } from "./runtime";
import { Event as RenderEvent } from "./render";
import { Event as IntervalEvent } from "./interval";
import Engine, { Entity } from "./engine";
import { Circle } from "./shape";

enum Property {
 EXPIRE = 0,
 X,
 Y,
 STROKE,
 FILL,
 COUNT,
}

const circle = (new Circle(1)).path();

export default function Particle(): (cb: Callback<Engine>) => Callback<Engine> {
  let particles = [];
  let colors = [];
  let colorIndex: { [ k: string ]: number } = {};
  let count = 0;

  return (cb: Callback<Engine>): Callback<Engine> => {
    return (event: Object) => {
      let tmp = cb(event);

      if (event instanceof IntervalEvent) {
        tmp.runIterator([ "position", "emitter" ],
                        (engine, entity) => {
          if (checkDuty(event.t, event.dt, entity)) {
            const stroke = calcColor(entity, "stroke", colors, colorIndex);
            const fill = calcColor(entity, "fill", colors, colorIndex);
            const emitCount = entity.getIn([ "emitter", "count" ]);
            const lifetime = entity.getIn([ "emitter", "lifetime" ]);

            for (let i = 0; i < emitCount; ++i) {
              count = create(event.t,
                             count,
                             particles,
                             calcPos(entity, "x", "nudgeX"),
                             calcPos(entity, "y", "nudgeY"),
                             lifetime,
                             stroke,
                             fill);
            }
          }

          return engine;
        });

        count = recycle(event.t, particles, count);
      } else if (event instanceof RenderEvent) {
        draw(event.ctx, particles, count, colors);
      }

      return tmp;
    };
  };
}

function checkDuty(t: number, dt: number, entity: Entity): boolean {
  const f = 1000 / entity.getIn([ "emitter", "frequency" ]);
  const t1 = t % f;
  const t0 = (t - dt) % f;

  return t1 < t0;
}

function create(t: number,
                count: number,
                particles: number[],
                x: number,
                y: number,
                lifetime: number,
                stroke: number,
                fill: number): number {
  const index = count * Property.COUNT;

  count += 1;
  if (particles.length < count * Property.COUNT) {
    particles.length += Property.COUNT;
  }

  particles[index + Property.EXPIRE] = t + lifetime;
  particles[index + Property.X] = x;
  particles[index + Property.Y] = y;
  particles[index + Property.STROKE] = stroke;
  particles[index + Property.FILL] = fill;

  return count;
}

function recycle(t: number, particles: number[], count: number): number {
  for (let i = 0; i < count; ++i) {
    const index = i * Property.COUNT;

    while (particles[index + Property.EXPIRE] < t) {
      count -= 1;

      if (i < count) {
        particles.copyWithin(index,
                             Property.COUNT * count,
                             Property.COUNT * (count + 1));
      } else {
        break;
      }
    }
  }

  return count;
}

function draw(ctx: CanvasRenderingContext2D,
              particles: number[],
              count: number,
              colors: string[]): void {
  for (let i = 0; i < count; ++i) {
    const index = i * Property.COUNT;

    ctx.save();
    ctx.translate(particles[index + Property.X],
                        particles[index + Property.Y]);
    if (particles[index + Property.FILL]) {
      ctx.fillStyle = colors[particles[index + Property.FILL]];
      ctx.fill(circle);
    }
    if (particles[index + Property.STROKE]) {
      ctx.strokeStyle = colors[particles[index + Property.STROKE]];
      ctx.stroke(circle);
    }
    ctx.restore();
  }
}

function calcColor(entity: Entity,
                   field: string,
                   colors: string[],
                   colorIndex: { [ k: string ]: number }): number {
  const c = entity.getIn([ "emitter", field ]);

  if (c) {
    if (!colorIndex[c]) {
      colorIndex[c] = colors.length;
      colors.push(c);
    }

    return colorIndex[c];
  } else {
    return -1;
  }
}

function calcPos(entity: Entity, field: string, nudgeField: string): number {
  const pos = entity.getIn([ "position", field ]);
  const nudge = entity.getIn([ "emitter", nudgeField ]);

  if (nudge !== 0) {
    return pos + (2 * Math.random() * nudge) - nudge;
  } else {
    return pos;
  }
}