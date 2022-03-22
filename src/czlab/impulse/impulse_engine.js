// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create module */
  function _module(Core,_V){

    const _2d=gscope["io/czlab/mcfud/geo2d"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const _G=gscope["io/czlab/mcfud/gfx"]();

    const _gravityScale = 5.0;
    const {u:_,is}=Core;

    /**
     * @public
     * @class
     */
    class Mat2{
      constructor(a,b,c,d){
        this.m00= a; this.m01=b;
        this.m10=c; this.m11=d;
        if(a===undefined){
          this.set(0);
        }
      }
      clone(){
        return new Mat2(this.m00, this.m01, this.m10, this.m11)
      }
      set(radians){
        let c = Math.cos(radians);
        let s = Math.sin(radians);
        this.m00 = c; this.m01 = -s;
        this.m10 = s; this.m11 =  c;
        return this;
      }
      abs(){
        return new Mat2(Math.abs(this.m00),
                        Math.abs(this.m01),
                        Math.abs(this.m10),
                        Math.abs(this.m11))
      }
      axisX(){
        return _V.vec(this.m00, this.m10)
      }
      axisY(){
        return _V.vec(this.m01, this.m11)
      }
      transpose(){
        return new Mat2(this.m00, this.m10, this.m01, this.m11)
      }
    }
    /**
     * @public
     * @function
     */
    Mat2.mul=function(a,rhs){
      if(is.vec(rhs))
        return _V.vec(a.m00 * rhs[0] + a.m01 * rhs[1],
                      a.m10 * rhs[0] + a.m11 * rhs[1])
      else
        return new Mat2(a.m00 * rhs.m00 + a.m01 * rhs.m10,
                        a.m00 * rhs.m01 + a.m01 * rhs.m11,
                        a.m10 * rhs.m00 + a.m11 * rhs.m10,
                        a.m10 * rhs.m01 + a.m11 * rhs.m11)
    };

    const _$={
      ePoly:100,
      eCircle: 200,
      Mat2,
      dt: 1.0/60,
      gravity: _V.vec(0, 10*_gravityScale)
    };

    gscope["io/czlab/impulse_engine/shape"](_$,Core,_M,_V,_G,_2d);
    gscope["io/czlab/impulse_engine/body"](_$,Core,_M,_V);
    gscope["io/czlab/impulse_engine/manifold"](_$,Core,_M,_V);
    gscope["io/czlab/impulse_engine/collision"](_$,Core,_M,_V);
    gscope["io/czlab/impulse_engine/scene"](_$,Core,_M,_V,_G,_2d);

    return _$;
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/core"]=function(){
      return _module(gscope["io/czlab/mcfud/core"](),
                     gscope["io/czlab/mcfud/vec2"]())
    }
  }

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /** Create Module */
  function _module(IE,Core,_M,_V,_G,_2d){

    const MaxPolyVertexCount= 64;
    const {Mat2}=IE;
    const {u:_}=Core;

    class Shape{
      constructor(){
        this.body=null;
        this.u = new Mat2();
        // Orientation matrix from model to world
      }
      isCircular(){
        return false
      }
    }

    /**
     * @public
     * @class
     */
    class Circle extends Shape{
      constructor(r){
        super();
        this.radius = r;
      }
      isCircular(){
        return true;
      }
      getAABB(){
        let r= this.body.position[0]+this.radius;
        let l= this.body.position[0]-this.radius;
        let t= this.body.position[1]+this.radius;
        let b= this.body.position[1]-this.radius;
        return new _2d.Rect(l,b,r-l,t-b);
      }
      clone(){
        return new Circle(this.radius);
      }
      initialize(){
        this.computeMass(1.0);
      }
      computeMass(density){
        let r2=this.radius*this.radius;
        this.body.m = Math.PI * r2 * density;
        this.body.I = this.body.m * r2;
        this.body.im = this.body.m ? 1.0/this.body.m : 0.0;
        this.body.iI = this.body.I ? 1.0/this.body.I : 0.0;
      }
      setOrient(radians){
        this.u.set(radians);
        return this;
      }
      draw(ctx){
        ctx.save();
        ctx.strokeStyle=this.body.rgb;
        _G.drawCircle(ctx,this.body.position[0], this.body.position[1],this.radius);
        let r=Mat2.mul(this.u,_V.vec(1,0));
        r=_V.mul(r,this.radius);
        r = _V.add(r, this.body.position);
        ctx.strokeStyle="green";
        _G.drawLine(ctx,this.body.position[0],this.body.position[1],r[0],r[1]);
        ctx.restore();
      }
      getType(){ return IE.eCircle }
    }

    /**
     * @public
     * @class
     */
    class PolygonShape extends Shape{
      constructor(){
        super();
        this.points=[];
        this.normals =[];
      }
      getAABB(){
        let cps=this._calcPoints();
        let minX= Infinity;
        let minY=Infinity;
        let maxX= -Infinity;
        let maxY= -Infinity;
        for(let p,i=0;i<cps.length;++i){
          p=cps[i];
          if(p[0] < minX) minX=p[0];
          if(p[0] > maxX) maxX=p[0];
          if(p[1] < minY) minY=p[1];
          if(p[1] > maxY) maxY=p[1];
        }
        return new _2d.Rect(minX, minY,maxX-minX, maxY-minY);
      }
      initialize(){
        this.computeMass(1.0);
        return this;
      }
      clone(){
        let poly = new PolygonShape();
        poly.u= this.u.clone();
        for(let i = 0; i < this.points.length; ++i){
          poly.points[i]=_V.clone(this.points[i]);
          poly.normals[i]=_V.clone(this.normals[i]);
        }
        return poly;
      }
      computeMass(density){
        // Calculate centroid and moment of interia
        let c= _V.vec(); // centroid
        let area = 0.0;
        let I = 0.0;
        const k_inv3 = 1.0/3;
        const len=this.points.length;
        for(let i1 = 0; i1 < len; ++i1){
          // Triangle vertices, third vertex implied as (0, 0)
          let p1= this.points[i1];
          let i2 = (i1+1)%len;
          let p2= this.points[i2];
          let D = _V.cross(p1, p2);
          let triangleArea = 0.5 * D;
          area += triangleArea;
          // Use area to weight the centroid average, not just vertex position
          c = _V.add(c, _V.mul(_V.add(p1, p2),triangleArea *k_inv3))
          let intx2 = p1[0] * p1[0] + p2[0] * p1[0] + p2[0] * p2[0];
          let inty2 = p1[1] * p1[1] + p2[1] * p1[1] + p2[1] * p2[1];
          I += (0.25 * k_inv3 * D) * (intx2 + inty2);
        }

        c = _V.mul(c,1.0 / area);

        // Translate vertices to centroid (make the centroid (0, 0)
        // for the polygon in model space)
        // Not really necessary, but I like doing this anyway
        for(let i=0; i < len; ++i)
          _V.sub$(this.points[i],c);

        this.body.m = density * area;
        this.body.im = this.body.m ? 1.0/this.body.m : 0.0;
        this.body.I = I * density;
        this.body.iI = this.body.I ? 1.0/this.body.I : 0.0;
        return this;
      }
      setOrient(radians){
        this.u.set(radians);
        return this;
      }
      _calcPoints(){
        let cps=[];
        for(let i=0;i<this.points.length;++i)
          cps.push(_V.add(this.body.position,Mat2.mul(this.u,this.points[i])));
        return cps;
      }
      draw(ctx){
        ctx.save();
        ctx.strokeStyle=this.body.rgb;
        _G.drawPoints(ctx,this._calcPoints());
        ctx.restore();
      }
      getType(){ return IE.ePoly }
      // Half width and half height
      setBox(hw,hh){
        /*
         <----------^
         |          |
         |          |---->
         |          |
         V---------->
             |
             |
             V
         edges go CCW, normals outward [y, -x]
         */
        this.normals.length=0;
        this.points.length=0;
        this.points[0]= _V.vec( -hw, -hh );
        this.points[1]= _V.vec(  hw, -hh );
        this.points[2]= _V.vec(  hw,  hh );
        this.points[3]= _V.vec( -hw,  hh );
        this.normals[0]= _V.vec( 0.0, -1.0);
        this.normals[1]= _V.vec(  1.0,   0.0);
        this.normals[2]= _V.vec(  0.0,   1.0);
        this.normals[3]= _V.vec( -1.0,   0.0);
        return this;
      }
      set(vertices){
        let count=vertices.length;
        // No hulls with less than 3 vertices (ensure actual polygon)
        _.assert(count > 2 && count <= MaxPolyVertexCount);
        //count = Math.min(count, MaxPolyVertexCount);
        // Find the right most point on the hull
        let rightMost = 0;
        let highestXCoord = vertices[0][0];
        for(let x,i = 1; i < count; ++i){
          x = vertices[i][0];
          if(x > highestXCoord){
            highestXCoord = x;
            rightMost = i;
          }
          // If matching x then take farthest negative y
          else if(_.feq(x, highestXCoord)){
            if(vertices[i][1] < vertices[rightMost][1]) rightMost = i;
          }
        }
        let hull=new Array(MaxPolyVertexCount);
        let outCount = 0;
        let indexHull = rightMost;
        for(;;){
          hull[outCount] = indexHull;
          // Search for next index that wraps around the hull
          // by computing cross products to find the most counter-clockwise
          // vertex in the set, given the previos hull index
          let nextHullIndex = 0;
          for(let i = 1; i < count; ++i){
            // Skip if same coordinate as we need three unique
            // points in the set to perform a cross product
            if(nextHullIndex === indexHull){
              nextHullIndex = i;
              continue;
            }
            // Cross every set of three unique vertices
            // Record each counter clockwise third vertex and add
            // to the output hull
            // See : http://www.oocities.org/pcgpe/math2d.html
            let e1 = _V.sub(vertices[nextHullIndex], vertices[hull[outCount]]);
            let e2 = _V.sub(vertices[i], vertices[hull[outCount]]);
            let c = _V.cross( e1, e2 );
            if(c < 0.0)
              nextHullIndex = i;
            // Cross product is zero then e vectors are on same line
            // therefor want to record vertex farthest along that line
            if(_.feq0(c) && _V.len2(e2) > _V.len2(e1))
              nextHullIndex = i;
          }
          ++outCount;
          indexHull = nextHullIndex;
          // Conclude algorithm upon wrap-around
          if(nextHullIndex === rightMost){
            break;
          }
        }
        this.normals.length=0;
        this.points.length=0;
        // Copy vertices into shape's vertices
        for(let i = 0; i < outCount; ++i)
          this.points[i]= vertices[hull[i]].slice();
        // Compute face normals
        for(let i1 = 0; i1 < outCount; ++i1){
          let i2 = (i1+1)%outCount;
          let face = _V.sub(this.points[i2], this.points[i1]);
          // Ensure no zero-length edges, because that's bad
          //_.assert(_V.len2(face) > _M.EPSILON * _M.EPSILON);
          if(_V.len2(face) > _M.EPSILON * _M.EPSILON){
            _.assert(false,"face too short");
          }

          // Calculate normal with 2D cross product between vector and scalar
          this.normals[i1]= _V.unit(_V.vec(face[1], -face[0]));
        }
        return this;
      }
      // The extreme point along a direction within a polygon
      getSupport(dir){
        let bestProjection = -Infinity;
        let bestVertex;
        for(let p,v,i = 0; i < this.points.length; ++i){
          v = this.points[i];
          p= _V.dot(v, dir);
          if(p > bestProjection){
            bestVertex = v;
            bestProjection = p;
          }
        }
        return bestVertex;
      }
    }

    return _.inject(IE, { Circle, Polygon: PolygonShape })
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/shape"]=function(IE,Core,_M,_V,_G,_2d){
      return _module(IE,Core,_M,_V,_G,_2d)
    }
  }

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /** Create Module */
  function _module(IE,Core,_M,_V){
    const {u:_}= Core;
    /**
     * @public
     * @class
     */
    class Body{
      constructor(shape_, x, y){
        this.shape= shape_;
        this.shape.body = this;
        this.position= _V.vec(x,y);
        this.velocity= _V.vec();
        this.angularVelocity = 0;
        this.torque = 0;
        this.rgb = "blue";
        this.force= _V.vec();
        this.staticFriction = 0.5;
        this.dynamicFriction = 0.3;
        this.restitution = 0.2;
        this.orient = _.randFloat2(-Math.PI, Math.PI);
        if(this.shape.isCircular()){ this.rgb = "magenta" }
        //do this last
        this.shape.initialize();
      }
      applyForce(f){
        this.force= _V.add(this.force,f);
        return this;
      }
      applyImpulse(impulse, contactVector){
        _V.add$(this.velocity, _V.mul(impulse,this.im));
        this.angularVelocity += this.iI * _V.cross(contactVector, impulse);
        return this;
      }
      setStatic(){
        this.I = 0.0;
        this.iI = 0.0;
        this.m = 0.0;
        this.im = 0.0;
        return this;
      }
      setOrient(radians){
        this.orient = radians;
        this.shape.setOrient(radians);
        return this;
      }
    }

    return _.inject(IE, { Body })
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/body"]=function(IE,Core,_M,_V){
      return _module(IE,Core,_M,_V)
    }
  }

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /** Create Module */
  function _module(IE,Core,_M,_V){

    const {u:_}= Core;

    /**
     * @public
     * @class
     */
    class Manifold{
      constructor(a, b){
        this.A=a;
        this.B=b;
        this.penetration=0; // Depth of penetration from collision
        this.normal=_V.vec(); // From A to B
        this.contacts=[_V.vec(),_V.vec()]; // Points of contact during collision
        this.contact_count=0; // Number of contacts that occured during collision
        this.e=0;               // Mixed restitution
        this.df=0;              // Mixed dynamic friction
        this.sf=0;              // Mixed static friction
      }
      solve(){
        IE.dispatch(this.A.shape.getType(),this.B.shape.getType()).call(IE, this, this.A,this.B);
        return this;
      }
      initialize(){
        // Calculate average restitution
        this.e = Math.min(this.A.restitution, this.B.restitution);
        // Calculate static and dynamic friction
        this.sf = Math.sqrt(this.A.staticFriction * this.B.staticFriction);
        this.df = Math.sqrt(this.A.dynamicFriction * this.B.dynamicFriction);
        for(let i = 0; i < this.contact_count; ++i){
          // Calculate radii from COM to contact
          let ra = _V.sub(this.contacts[i], this.A.position);
          let rb = _V.sub(this.contacts[i], this.B.position);
          let rv = _V.add(this.B.velocity,_V.cross(this.B.angularVelocity, rb));
          rv= _V.sub(_V.sub(rv,this.A.velocity),
                     _V.cross(this.A.angularVelocity, ra));
          // Determine if we should perform a resting collision or not
          // The idea is if the only thing moving this object is gravity,
          // then the collision should be performed without any restitution
          if(_V.len2(rv) < _V.len2(_V.mul(IE.gravity,IE.dt)) + _M.EPSILON)
            this.e = 0.0;
        }
        return this;
      }
      applyImpulse(){
        // Early out and positional correct if both objects have infinite mass
        if(_M.fuzzyZero(this.A.im + this.B.im)){
          this.infiniteMassCorrection();
          return this;
        }
        for(let i = 0; i < this.contact_count; ++i){
          // Calculate radii from COM to contact
          let ra = _V.sub(this.contacts[i], this.A.position);
          let rb = _V.sub(this.contacts[i], this.B.position);
          // Relative velocity
          let rv = _V.add(this.B.velocity,_V.cross(this.B.angularVelocity, rb));
          rv= _V.sub(_V.sub(rv, this.A.velocity),
                     _V.cross(this.A.angularVelocity, ra));
          // Relative velocity along the normal
          let contactVel = _V.dot(rv, this.normal);
          // Do not resolve if velocities are separating
          if(contactVel > 0)
            return this;
          let raCrossN = _V.cross(ra, this.normal);
          let rbCrossN = _V.cross(rb, this.normal);
          let invMassSum = this.A.im + this.B.im + (raCrossN*raCrossN) *
                           this.A.iI + (rbCrossN*rbCrossN) * this.B.iI;
          // Calculate impulse scalar
          let j = -(1.0 + this.e) * contactVel;
          j /= invMassSum;
          j /= this.contact_count;
          // Apply impulse
          let impulse = _V.mul(this.normal,j);
          this.A.applyImpulse(_V.flip(impulse), ra);
          this.B.applyImpulse(impulse, rb);
          // Friction impulse
          rv = _V.add(this.B.velocity,_V.cross(this.B.angularVelocity, rb));
          rv = _V.sub(_V.sub(rv, this.A.velocity),
                      _V.cross(this.A.angularVelocity, ra));
          let t = _V.sub(rv,_V.mul(this.normal,_V.dot(rv, this.normal)));
          t = _V.unit(t);
          // j tangent magnitude
          let jt = -_V.dot(rv, t);
          jt /= invMassSum;
          jt /= this.contact_count;
          // Don't apply tiny friction impulses
          if(_.feq0(jt))
            return this;
          // Coulumb's law
          let tangentImpulse;
          if(Math.abs(jt) < j * this.sf)
            tangentImpulse = _V.mul(t, jt);
          else
            tangentImpulse = _V.mul(t, -j * this.df);
          // Apply friction impulse
          this.A.applyImpulse(_V.flip(tangentImpulse), ra);
          this.B.applyImpulse(tangentImpulse, rb);
        }
        return this;
      }
      positionalCorrection(){
        const k_slop = 0.05; // Penetration allowance
        const percent = 0.4; // Penetration percentage to correct
        let correction =
          _V.mul(this.normal,
          (Math.max(this.penetration-k_slop, 0.0)/(this.A.im+this.B.im)) * percent);
        _V.sub$(this.A.position,_V.mul(correction, this.A.im));
        _V.add$(this.B.position,_V.mul(correction, this.B.im));
        return this;
      }
      infiniteMassCorrection(){
        _V.set(this.A.velocity,0, 0);
        _V.set(this.B.velocity,0, 0);
        return this;
      }
    }

    return _.inject(IE, { Manifold: Manifold })
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/manifold"]=function(IE,Core,_M,_V){
      return _module(IE,Core,_M,_V)
    }
  }

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /** Create Module */
  function _module(IE,Core,_M,_V){

    const {Mat2}=IE;
    const {u:_}=Core;

    const _$={
      dispatch(t1,t2){
        if(t1===IE.eCircle){
          return t2===IE.eCircle ? this.circleCircle : this.circlePolygon
        }else if(t1===IE.ePoly){
          return t2===IE.eCircle ? this.polygonCircle : this.polygonPolygon
        }
      },
      circleCircle(m, a, b){
        let A = a.shape;
        let B = b.shape;
        // calculate translational vector, which is normal
        let normal = _V.sub(b.position, a.position);
        let dist_sqr = _V.len2(normal);
        let radius = A.radius + B.radius;
        // Not in contact
        if(dist_sqr >= radius*radius){
          m.contact_count = 0;
          return;
        }
        let distance = Math.sqrt(dist_sqr);
        m.contact_count = 1;
        if(_.feq0(distance)){
          m.penetration = A.radius;
          m.normal = _V.vec(1, 0);
          _V.copy(m.contacts[0], a.position);
        }else{
          m.penetration = radius - distance;
          m.normal = _V.div(normal,distance);
          _V.copy(m.contacts[0],
                  _V.add(_V.mul(m.normal,A.radius),a.position));
        }
      },
      circlePolygon(m, a, b){
        let A = a.shape;
        let B = b.shape;
        m.contact_count = 0;
        // Transform circle center to Polygon model space
        let center = Mat2.mul(B.u.transpose(), _V.sub(a.position,b.position));
        // Find edge with minimum penetration
        // Exact concept as using support points in Polygon vs Polygon
        let separation = -Infinity;
        let faceNormal = 0;
        for(let i=0; i < B.points.length; ++i){
          let s = _V.dot(B.normals[i], _V.sub(center,B.points[i]));
          if(s > A.radius)
            return;
          if(s > separation){
            separation = s;
            faceNormal = i;
          }
        }
        // Grab face's vertices
        let v1 = B.points[faceNormal];
        let i2 = (faceNormal+1) % B.points.length;
        let v2 = B.points[i2];
        // Check to see if center is within polygon
        if(separation < IE.EPSILON){
          m.contact_count = 1;
          m.normal = _V.flip(Mat2.mul(B.u,B.normals[faceNormal]));
          _V.copy(m.contacts[0],
                  _V.add(_V.mul(m.normal,A.radius),a.position));
          m.penetration = A.radius;
          return;
        }
        // Determine which voronoi region of the edge center of circle lies within
        let dot1 = _V.dot(_V.sub(center,v1), _V.sub(v2,v1));
        let dot2 = _V.dot(_V.sub(center,v2), _V.sub(v1,v2));
        m.penetration = A.radius - separation;
        // Closest to v1
        if(dot1 <= 0.0){
          if(_V.dist2(center, v1) > A.radius*A.radius)
            return;
          m.contact_count = 1;
          let n = _V.sub(v1,center);
          m.normal = _V.unit(Mat2.mul(B.u, n));
          _V.copy(m.contacts[0], _V.add(Mat2.mul(B.u,v1),b.position));
        }
        // Closest to v2
        else if(dot2 <= 0.0){
          if(_V.dist2(center, v2) > A.radius*A.radius)
            return;
          m.contact_count = 1;
          let n = _V.sub(v2,center);
          m.normal = _V.unit(Mat2.mul(B.u, n));
          _V.copy(m.contacts[0], _V.add(Mat2.mul(B.u,v2),b.position));
        }else{
          // Closest to face
          let n = B.normals[faceNormal];
          if(_V.dot(_V.sub(center,v1), n) > A.radius)
            return;
          m.normal = _V.flip(Mat2.mul(B.u, n));
          _V.copy(m.contacts[0],
                  _V.add(_V.mul(m.normal,A.radius),a.position));
          m.contact_count = 1;
        }
      }
    };

    /**
     * @public
     * @function
     */
    IE.polygonCircle=function(m, a, b){
      this.circlePolygon(m, b, a);
      _V.flip$(m.normal);
    };

    /** @ignore */
    function _findAxisLeastPenetration(A, B){
      let bestDistance = -Infinity;
      let bestIndex;
      for(let i=0; i < A.points.length; ++i){
        // Retrieve a face normal from A
        let n = A.normals[i];
        let v = A.points[i];
        let nw = Mat2.mul(A.u, n);
        // Transform face normal into B's model space
        let buT = B.u.transpose();
        n = Mat2.mul(buT,nw);
        // Retrieve support point from B along -n
        let s = B.getSupport(_V.flip(n));
        // Retrieve vertex on face from A, transform into
        // B's model space
        v = _V.add(Mat2.mul(A.u,v),A.body.position);
        _V.sub$(v,B.body.position);
        v = Mat2.mul(buT,v);
        // Compute penetration distance (in B's model space)
        let d = _V.dot(n, _V.sub(s,v ));
        // Store greatest distance
        if(d > bestDistance){
          bestDistance = d;
          bestIndex = i;
        }
      }
      return [bestDistance, bestIndex]
    }

    /** @ignore */
    function _findIncidentFace(RefPoly, IncPoly, refIndex){
      let refNormal = RefPoly.normals[refIndex];
      // Calculate normal in incident's frame of reference
      refNormal = Mat2.mul(RefPoly.u, refNormal); // To world space
      refNormal = Mat2.mul(IncPoly.u.transpose(),refNormal); // To incident's model space
      // Find most anti-normal face on incident polygon
      let incidentFace = 0;
      let minDot = Infinity;
      for(let dot,i = 0; i < IncPoly.points.length; ++i){
        dot = _V.dot(refNormal, IncPoly.normals[i]);
        if(dot < minDot){
          minDot = dot;
          incidentFace = i;
        }
      }
      // Assign face vertices for incidentFace
      let v0= _V.add(Mat2.mul(IncPoly.u,IncPoly.points[incidentFace]), IncPoly.body.position);
      incidentFace = (incidentFace+1) % IncPoly.points.length;
      let v1 = _V.add(Mat2.mul(IncPoly.u,IncPoly.points[incidentFace]), IncPoly.body.position);
      return [v0,v1]
    }

    /** @ignore */
    function _clip(n, c, face){
      let out=[face[0],face[1]];
      let sp = 0;
      // Retrieve distances from each endpoint to the line
      // d = ax + by - c
      let d1 = _V.dot(n, face[0]) - c;
      let d2 = _V.dot(n, face[1]) - c;
      // If negative (behind plane) clip
      if(d1 <= 0.0) out[sp++] = face[0];
      if(d2 <= 0.0) out[sp++] = face[1];
      // If the points are on different sides of the plane
      if(d1*d2 < 0.0){ // less than to ignore -0.0f
        // Push interesection point
        let alpha = d1/(d1-d2);
        out[sp] = _V.add(face[0],_V.mul(_V.sub(face[1],face[0]),alpha));
        ++sp;
      }
      // Assign our new converted values
      face[0] = out[0];
      face[1] = out[1];
      _.assert(sp != 3);
      return sp;
    }

    /**
     * @public
     * @function
     */
    IE.polygonPolygon=function(m, a, b){
      let A = a.shape;
      let B = b.shape;
      m.contact_count = 0;
      // Check for a separating axis with A's face planes
      let [penetrationA,faceA] = _findAxisLeastPenetration(A, B);
      if(penetrationA >= 0)
        return;
      // Check for a separating axis with B's face planes
      let [penetrationB,faceB] = _findAxisLeastPenetration(B, A);
      if(penetrationB >= 0)
        return;

      let RefPoly; // Reference
      let IncPoly; // Incident
      let refIndex;
      let flip; // Always point from a to b
      // Determine which shape contains reference face
      if(_M.biasGreater(penetrationA, penetrationB)){
        RefPoly = A;
        IncPoly = B;
        refIndex = faceA;
        flip = false;
      }else{
        RefPoly = B;
        IncPoly = A;
        refIndex = faceB;
        flip = true;
      }
      // World space incident face
      let incidentFace= _findIncidentFace(RefPoly, IncPoly, refIndex);
      //        y
      //        ^  ->n       ^
      //      +---c ------posPlane--
      //  x < | i |\
      //      +---+ c-----negPlane--
      //             \       v
      //              r
      //
      //  r : reference face
      //  i : incident poly
      //  c : clipped point
      //  n : incident normal
      // Setup reference face vertices
      let v1 = RefPoly.points[refIndex];
      refIndex = (refIndex+1) % RefPoly.points.length;
      let v2 = RefPoly.points[refIndex];
      // Transform vertices to world space
      v1 = _V.add(Mat2.mul(RefPoly.u,v1),RefPoly.body.position);
      v2 = _V.add(Mat2.mul(RefPoly.u,v2),RefPoly.body.position);
      // Calculate reference face side normal in world space
      let sidePlaneNormal = _V.unit(_V.sub(v2,v1));
      // Orthogonalize
      let refFaceNormal= _V.vec(sidePlaneNormal[1], -sidePlaneNormal[0]);
      // ax + by = c
      // c is distance from origin
      let refC = _V.dot( refFaceNormal, v1 );
      let negSide = -_V.dot( sidePlaneNormal, v1 );
      let posSide =  _V.dot( sidePlaneNormal, v2 );
      // Clip incident face to reference face side planes
      if(_clip(_V.flip(sidePlaneNormal), negSide, incidentFace) < 2)
        return; // Due to floating point error, possible to not have required points
      if(_clip(sidePlaneNormal, posSide, incidentFace ) < 2)
        return; // Due to floating point error, possible to not have required points
      // Flip
      m.normal = flip ? _V.flip(refFaceNormal) : refFaceNormal;
      // Keep points behind reference face
      let cp = 0; // clipped points behind reference face
      let separation = _V.dot(refFaceNormal, incidentFace[0]) - refC;
      if(separation <= 0){
        m.contacts[cp] = incidentFace[0];
        m.penetration = -separation;
        ++cp;
      }else{
        m.penetration = 0;
      }
      separation = _V.dot(refFaceNormal, incidentFace[1]) - refC;
      if(separation <= 0){
        m.contacts[cp] = incidentFace[1];
        m.penetration += -separation;
        ++cp;
        // Average penetration
        m.penetration /= cp;
      }
      m.contact_count = cp;
    };

    return _.inject(IE, _$)
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/collision"]=function(IE,Core,_M,_V){
      return _module(IE,Core,_M,_V)
    }
  }

})(this);


// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Copyright © 2020-2022, Kenneth Leung. All rights reserved.

;(function(gscope,UNDEF){

  "use strict";

  /**Create Module */
  function _module(IE,Core,_M,_V,_G,_2d){

    const {u:_}=Core;

    // Acceleration
    //    F = mA
    // => A = F * 1/m
    // Explicit Euler
    // x += v * dt
    // v += (1/m * F) * dt
    // Semi-Implicit (Symplectic) Euler
    // v += (1/m * F) * dt
    // x += v * dt

    /** @ignore */
    function _integrateForces(b, dt){
      if(!_.feq0(b.im)){
        let dt2= dt/2.0;
        _V.add$(b.velocity,
                _V.mul(_V.add(_V.mul(b.force,b.im),IE.gravity),dt2));
        b.angularVelocity += b.torque * b.iI * dt2;
      }
    }

    /** @ignore */
    function _integrateVelocity(b, dt){
      if(!_.feq0(b.im)){
        _V.add$(b.position,_V.mul(b.velocity,dt));
        b.orient += b.angularVelocity * dt;
        b.setOrient(b.orient);
        _integrateForces(b, dt);
      }
    }

    /**
     * @public
     * @class
     */
    class World{
      constructor(dt, iterations){
        this.dt= dt;
        this.bodies=[];
        this.contacts=[];
        this.tries= iterations;
      }
      step(){
        // Generate new collision info
        this.contacts.length=0;
        for(let A,i=0; i < this.bodies.length; ++i){
          A = this.bodies[i];
          for(let m,B,j= i+1; j < this.bodies.length; ++j){
            B = this.bodies[j];
            if(!(_.feq0(A.im) && _.feq0(B.im))){
              m= new IE.Manifold(A, B).solve();
              if(m.contact_count>0) this.contacts.push(m);
            }
          }
        }
        // Integrate forces
        // Initialize collision
        // Solve collisions
        // Integrate velocities
        // Correct positions
        // Clear all forces
        this.bodies.forEach(b => _integrateForces(b, this.dt));
        this.contacts.forEach(c => c.initialize());
        for(let i=0;i<this.tries;++i)
          this.contacts.forEach(c => c.applyImpulse());
        this.bodies.forEach(b => _integrateVelocity(b, this.dt));
        this.contacts.forEach(c => c.positionalCorrection());
        this.bodies.forEach(b => {
          _V.set(b.force, 0,0);
          b.torque = 0;
        });
      }
      render(ctx){
        this.bodies.forEach(b => b.shape.draw(ctx));
      }
      add(shape, x, y){
        let b = new IE.Body(shape, x, y);
        this.bodies.push(b);
        return b;
      }
    }

    return _.inject(IE, { World: World })
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/impulse_engine/scene"]=function(IE,Core,_M,_V,_G,_2d){
      return _module(IE,Core,_M,_V,_G,_2d)
    }
  }

})(this);

