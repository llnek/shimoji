(function (global, undefined) {
  "use strict";
  let MojoH5=global.MojoH5;

  MojoH5.Math=function(Mojo) {

    let _ = Mojo.u,
        _pool = _.jsVec();

    Mojo.matrix2d = () => {
      return _pool.length > 0
        ? _pool.pop().identity() : new Mojo.Matrix2D();
    };
    Mojo.defType("Matrix2D",{
      init: function(source) {
        if(source) {
          this.m = [];
          this.clone(source);
        } else {
          this.m = [1,0,0,0,1,0];
        }
      },
      identity: function() {
        let m = this.m;
        m[0] = 1; m[1] = 0; m[2] = 0;
        m[3] = 0; m[4] = 1; m[5] = 0;
        return this;
      },
      clone: function(mx) {
        for(let i=0;i<this.m.length;++i)
        this.m[i]=mx.m[i];
        return this;
      },
      mult: function(mx) {
        let a = this.m, b = mx.m;
        let m11 = a[0]*b[0] + a[1]*b[3];
        let m12 = a[0]*b[1] + a[1]*b[4];
        let m13 = a[0]*b[2] + a[1]*b[5] + a[2];
        let m21 = a[3]*b[0] + a[4]*b[3];
        let m22 = a[3]*b[1] + a[4]*b[4];
        let m23 = a[3]*b[2] + a[4]*b[5] + a[5];

        a[0]=m11; a[1]=m12; a[2] = m13;
        a[3]=m21; a[4]=m22; a[5] = m23;
        return this;
      },
      rotate: function(rad) {
        if(rad === 0) { return this; }
        let m=this.m,
            cos = Math.cos(rad),
            sin = Math.sin(rad);
        let m11 = m[0]*cos  + m[1]*sin;
        let m12 = m[0]*-sin + m[1]*cos;
        let m21 = m[3]*cos  + m[4]*sin;
        let m22 = m[3]*-sin + m[4]*cos;
        m[0] = m11; m[1] = m12; // m[2] == m[2]
        m[3] = m21; m[4] = m22; // m[5] == m[5]
        return this;
      },
      rot: function(deg) {
        return this.rotate(Math.PI * deg / 180);
      },
      scale: function(sx,sy) {
        if(sy === undefined) { sy = sx; }
        let m = this.m;
        m[0] *= sx;
        m[1] *= sy;
        m[3] *= sx;
        m[4] *= sy;
        return this;
      },
      translate: function(tx,ty) {
        let m = this.m;
        m[2] += m[0]*tx + m[1]*ty;
        m[5] += m[3]*tx + m[4]*ty;
        return this;
      },
      transform: function(x,y) {
        return [x * this.m[0] + y * this.m[1] + this.m[2],
                x * this.m[3] + y * this.m[4] + this.m[5]];
      },
      transformPt: function(obj) {
        let x = obj.x, y = obj.y;
        obj.x = x * this.m[0] + y * this.m[1] + this.m[2];
        obj.y = x * this.m[3] + y * this.m[4] + this.m[5];
        return obj;
      },
      transformArr: function(inPt,outPt) {
        let x = inPt[0], y = inPt[1];
        if (outPt === void 0) outPt= [0,0];
        outPt[0] = x * this.m[0] + y * this.m[1] + this.m[2];
        outPt[1] = x * this.m[3] + y * this.m[4] + this.m[5];
        return outPt;
      },
      transformX: function(x,y) {
        return x * this.m[0] + y * this.m[1] + this.m[2];
      },
      transformY: function(x,y) {
        return x * this.m[3] + y * this.m[4] + this.m[5];
      },
      release: function() {
        _pool.push(this);
        return null;
      },
      setContextTransform: function(ctx) {
        let m = this.m;
        // source:
        //  m[0] m[1] m[2]
        //  m[3] m[4] m[5]
        //  0     0   1
        //
        // destination:
        //  m11  m21  dx
        //  m12  m22  dy
        //  0    0    1
        //  setTransform(m11, m12, m21, m22, dx, dy)
        ctx.transform(m[0],m[3],m[1],m[4],m[2],m[5]);
      }
    });

    return Mojo;
  };

})(this);


