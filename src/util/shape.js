export function shapeFor(entity) {
  let mask = entity.position.mask;

  if (!(mask instanceof Polygon || mask instanceof Circle)) {
    const width = entity.position.width;
    const height = entity.position.height;

    mask = new Polygon([
      [ 0, 0 ],
      [ width - 1, 0 ],
      [ width - 1, height - 1 ],
      [ 0, height - 1 ],
    ]);
  } else {
    mask = mask.clone();
  }

  const x = entity.position.x;
  const y = entity.position.y;
  const rotate = entity.position.rotate;

  mask = mask.rotate(rotate).translate(x, y);

  if (mask instanceof Circle) {
    mask = mask.translate(mask._radius, mask._radius);
  }

  return mask;
}

export function fromBounds(bounds) {
  return new Polygon([
    [ bounds.left, bounds.top ],
    [ bounds.right, bounds.top ],
    [ bounds.right, bounds.bottom ],
    [ bounds.left, bounds.bottom ],
  ]);
}

export class Polygon {
  constructor(verticies) {
    this._verticies = verticies;
  }

  clone() {
    const verticies = new Array(this._verticies.length);

    for (let i = 0; i < verticies.length; i += 1) {
      verticies[i] = [ this._verticies[i][0], this._verticies[i][1] ];
    }

    return new Polygon(verticies);
  }

  translate(x, y) {
    for (let v of this._verticies) {
      v[0] += x;
      v[1] += y;
    }

    return this;
  }

  rotate(r) {
    if (isNaN(r) || r == null || r === 0) {
      return this;
    }

    const dim = this.dimensions();
    const x = dim.width / 2;
    const y = dim.height / 2;
    const c = Math.cos(r);
    const s = Math.sin(r);

    const const1 = -c * x + s * y + x;
    const const2  = -s * x - c * y + y;

    for (let v of this._verticies) {
      v[0] = c * v[0] - s * v[1] + const1;
      v[1] = s * v[0] + c * v[1] + const2;
    }

    return this;
  }

  normals() {
    let prev = (this._verticies.length > 0 ?
                this._verticies[this._verticies.length - 1] :
                null);
    const normals = new Array(this._verticies.length);

    for (let i = 0; i < this._verticies.length; i += 1) {
      const v = this._verticies[i];

      normals[i] = [ v[1] - prev[1], prev[0] - v[0] ];
      prev = v;
    }

    return normals;
  }

  project(axis) {
    const memo = [ Infinity, -Infinity ];

    for (let v of this._verticies) {
      const dot = axis[0] * v[0] + axis[1] * v[1];

      memo[0] = Math.min(dot, memo[0]);
      memo[1] = Math.max(dot, memo[1]);
    }

    return memo;
  }

  dimensions() {
    const bounds = this.bounds();

    return {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    };
  }

  bounds() {
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    for (let v of this._verticies) {
      left = Math.min(v[0], left);
      right = Math.max(v[0], right);
      top = Math.min(v[1], top);
      bottom = Math.max(v[1], bottom);
    }

    return {
      left: left,
      right: right,
      top: top,
      bottom: bottom,
    };
  }

  minimum(left, right) {
    let min = Infinity;

    for (let i = 0; i < this._verticies.length; ++i) {
      const j = (i === this._verticies.length - 1) ? 0 : i + 1;
      const a = this._verticies[i];
      const b = this._verticies[j];

      if (a[0] <= right && b[0] >= left) {
        if (a[0] === b[0] || a[1] === b[1]) {
          min = Math.min(a[1], b[1], min);
        } else {
          const slope = (b[1] - a[1]) / (b[0] - a[0]);
          const int = a[1] - (slope * a[0]);
          const cap = Math.min(a[1], b[1])

          min = Math.min(Math.max((slope * left) + int, cap),
                         Math.max((slope * right) + int, cap), min);
        }
      }
    }

    return min;
  }

  path() {
    const path = new Path2D();
    let last = (this._verticies.length > 0 ?
                this._verticies[this._verticies.length - 1] :
                null);

    path.moveTo(last[0], last[1]);
    for (let v of this._verticies) {
      path.lineTo(v[0], v[1]);
    }

    return path;
  }
}

export class Circle {
  constructor(radius, x, y) {
    this._radius = radius;
    this._x = x;
    this._y = y;
  }

  clone() {
    return new Circle(this._radius, this._x, this._y);
  }

  translate(x, y) {
    this._x += x;
    this._y += y;

    return this;
  }

  rotate(r) {
    return this;
  }

  normals(other) {
    if (other instanceof Circle) {
      const x = other._x - this._x;
      const y = other._y - this._y;

      return [ [ x, y ] ];
    } else if (other instanceof Polygon) {
      let normal = null;
      let magnitude = Infinity;

      for (let v of other._verticies) {
        let x = v[0] - this._x;
        let y = v[0] - this._y;
        let d = Math.sqrt(x * x + y * y);

        if (d < magnitude) {
          normal = [ x, y ];
          magnitude = d;
        }
      }

      return [ normal ];
    } else {
      throw new Error("unsupported shape");
    }
  }

  project(axis) {
    const dot = axis[0] * this._x + axis[1] * this._y;

    return [ dot - this._radius, dot + this._radius ];
  }

  dimensions() {
    return {
      width: this._radius * 2,
      height: this._radius * 2,
    };
  }

  bounds() {
    return {
      left: this._x - this._radius,
      right: this._x + this._radius - 1,
      top: this._y - this._radius,
      bottom: this._y + this._radius - 1,
    };
  }

  path() {
    const path = new Path2D();

    path.ellipse(this._x, this._y, this._radius, this._radius, 0, 0, 2 * Math.PI);

    return path;
  }
}
