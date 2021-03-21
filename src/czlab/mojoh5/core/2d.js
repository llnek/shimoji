/* Licensed under the Apache License, Version 2.0 (the "License");
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(gscope){

  "use strict";

  /**Create the module. */
  function _module(Mojo){
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {EventBus, is, ute:_}=Mojo;
    const ABS=Math.abs,
          MFL=Math.floor;

    /**
     * @module mojoh5/2d
     */


    /**Define a mixin object.
     */
    Mojo.defMixin("2dControls", function(e,bRotate){
      e.m5.direction=Mojo.UP;
      let _I=Mojo.Input;
      let self={
        onTick(dt){
          if(bRotate){
            if(e.m5.vel[0] > 0){
              e.rotation = Mojo.PI_90
            }else if(e.m5.vel[0] < 0){
              e.rotation = -Mojo.PI_90
            }else if(e.m5.vel[1] > 0){
              e.rotation = Mojo.PI_180
            }else if(e.m5.vel[1] < 0){
              e.rotation = 0
            }
          }
          //grab a direction from the input
          e.m5.direction = _I.keyDown(_I.keyLEFT)  ? Mojo.LEFT :
                           _I.keyDown(_I.keyRIGHT) ? Mojo.RIGHT :
                           _I.keyDown(_I.keyUP) ? Mojo.UP :
                           _I.keyDown(_I.keyDOWN) ? Mojo.DOWN : e.m5.direction;
          switch(e.m5.direction){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      return self;
    });

    /**A internal mixin to handle platform games. */
    function Platformer(e){
      const _I=Mojo.Input;
      const signals=[];
      const self={
        jumpSpeed: -300,//y-axis goes down
        jumping:false,
        landed:0,
        leftKey: _I.keyLEFT,
        jumpKey: _I.keyUP,
        rightKey: _I.keyRIGHT,
        dispose(){
          signals.forEach(s=> EventBus.unsub(...s)) },
        onLanded(){ self.landed=0.2 },
        onTick(dt,collisions){
          let col=collisions[0],
              j3= self.jumpSpeed/3,
              pR= _I.keyDown(self.rightKey),
              pU= _I.keyDown(self.jumpKey),
              pL= _I.keyDown(self.leftKey);
          if(!e.m5.skipCollide){
            if(col && (pL || pR || self.landed>0)){
              // don't climb up walls.
              //if(col && (col.overlapN[1] > -0.3 || col.overlapN[1] < 0.3)) { col= null }//old
              if(col.overlapN[1] > 0.85 || col.overlapN[1] < -0.85){ col= null }//mine
            }
            if(pL){
              e.m5.direction = Mojo.LEFT;
              if(col && self.landed > 0){
                e.m5.vel[0] = e.m5.speed * col.overlapN[1];
                e.m5.vel[1] = -e.m5.speed * col.overlapN[0];
              }else{
                e.m5.vel[0] = -e.m5.speed }
            }else if(pR){
              e.m5.direction = Mojo.RIGHT;
              if(col && self.landed > 0){
                e.m5.vel[0] = -e.m5.speed * col.overlapN[1];
                e.m5.vel[1] = e.m5.speed * col.overlapN[0];
              }else{
                e.m5.vel[0] = e.m5.speed }
            }else{
              e.m5.vel[0] = 0;
              if(col && self.landed > 0){ e.m5.vel[1] = 0 }
            }
            if(self.landed > 0 && pU && !self.jumping){
              e.m5.vel[1] = self.jumpSpeed;
              self.landed = -dt;
              self.jumping = true;
            }else if(pU){
              self.jumping = true;
              EventBus.pub(["jump",e]);
            }
            if(self.jumping && !pU){
              self.jumping = false;
              EventBus.pub(["jumped",e]);
              if(e.m5.vel[1] < j3){ e.m5.vel[1] = j3 }
            }
          }
          self.landed -=dt;
        }
      };
      signals.push([["bump.bottom",e],"onLanded",self]);
      signals.forEach(s=> EventBus.sub(...s));
      return self;
    }

    /**Define a mixin object.
     */
    Mojo.defMixin("2d",function(e,_platformer=false){
      const collisions=[];
      const signals=[];
      const self={
        dispose(){
          self.platformer &&
            self.platformer.dispose();
          signals.forEach(s=> EventBus.unsub(...s)) },
        boom(col){
          _.assert(col.A===e,"got hit by someone else???");
          if(col.B && col.B.m5.sensor){
            EventBus.pub(["2d.sensor", col.B], col.A);
          }else{
            let dx= ABS(e.m5.vel[0]),
                dy= ABS(e.m5.vel[1]);
            e.x -= col.overlapV[0];
            e.y -= col.overlapV[1];
            col.impact=null;
            if(col.overlapN[1] < -0.3){
              if(!e.m5.skipCollide && e.m5.vel[1] < 0){
                e.m5.vel[1] = 0;
              }
              col.impact = dy;
              EventBus.pub(["bump.top", e],col);
            }
            if(col.overlapN[1] > 0.3){
              if(!e.m5.skipCollide && e.m5.vel[1] > 0){
                e.m5.vel[1] = 0;
              }
              col.impact = dy;
              EventBus.pub(["bump.bottom",e],col);
            }
            if(col.overlapN[0] < -0.3){
              if(!e.m5.skipCollide && e.m5.vel[0] < 0){
                e.m5.vel[0] = 0
              }
              col.impact = dx;
              EventBus.pub(["bump.left",e],col);
            }
            if(col.overlapN[0] > 0.3){
              if(!e.m5.skipCollide && e.m5.vel[0] > 0){
                e.m5.vel[0] = 0
              }
              col.impact = dx;
              EventBus.pub(["bump.right",e],col);
            }
            if(is.num(col.impact)){
              EventBus.pub(["bump",e],col);
            }else{
              col.impact=0;
            }
          }
          collisions.shift(col);
        },
        onTick(dt){
          collisions.length=0;
          let _dt=dt;
          if(is.num(dt)){
            for(let delta=dt;delta>0;){
              dt = _.min(1/30,delta);
              e.m5.vel[0] += e.m5.acc[0] * dt + e.m5.gravity[0] * dt;
              e.m5.vel[1] += e.m5.acc[1] * dt + e.m5.gravity[1] * dt;
              e.m5.vel[0] *= e.m5.friction[0];
              e.m5.vel[1] *= e.m5.friction[1];
              e.x += e.m5.vel[0] * dt;
              e.y += e.m5.vel[1] * dt;
              delta -= dt;
              e.parent.collideXY(e);
            }
          }else{
            e.x += e.m5.vel[0];
            e.y += e.m5.vel[1];
            e.parent.collideXY(e);
          }
          if(self.platformer)
            self.platformer.onTick(_dt,collisions);
        }
      };
      signals.push([["hit",e],"boom",self]);
      signals.push([["post.remove",e],"dispose",self]);
      signals.forEach(s=> EventBus.sub(...s));
      if(_platformer){ self.platformer=Platformer(e) }
      return self;
    });

    /**Define mixin `aiBounce`.
     */
    Mojo.defMixin("aiBounce", function(e,xDir,yDir){
      const signals=[];
      const self= {
        dispose(){
          signals.forEach(a=>EventBus.unsub(...a)) },
        goLeft(col){
          e.m5.vel[0] = -col.impact;//-e.m5.speed;
          e.m5.flip= self.dftDirection === Mojo.RIGHT?"x":false;
        },
        goRight(col){
          e.m5.vel[0] = col.impact;//e.m5.speed;
          e.m5.flip= self.dftDirection === Mojo.LEFT?"x":false;
        },
        goUp(col){
          e.m5.vel[1] = -col.impact;//-e.m5.speed;
          e.m5.flip=self.dftDirection === Mojo.DOWN?"y":false;
        },
        goDown(col){
          e.m5.vel[1] = col.impact;//e.m5.speed;
          e.m5.flip=self.defDirection === Mojo.UP?"y":false;
        }
      };
      signals.push([["post.remove",e],"dispose",self]);
      if(xDir){
        signals.push([["bump.right",e],"goLeft",self]);
        signals.push([["bump.left",e],"goRight",self]);
      }
      if(yDir){
        signals.push([["bump.top",e],"goDown",self]);
        signals.push([["bump.bottom",e],"goUp",self]);
      }
      signals.forEach(a=>EventBus.sub(...a));
      return self;
    });

    /**Define mixin `camera`. */
    Mojo.defMixin("camera2d", function(e,worldWidth,worldHeight,canvas){
      const _height= canvas?canvas.height:worldHeight;
      const _width= canvas?canvas.width:worldWidth;
      const height2=MFL(_height/2);
      const width2=MFL(_width/2);
      const height4=MFL(_height/4);
      const width4=MFL(_width/4);
      const _S=Mojo.Sprites;
      const signals=[];
      const world=e;
      let _x=0;
      let _y=0;
      const self={
        dispose(){
          signals.forEach(e=>EventBus.unsub(...e)) },
        //`x` and `y` getters/setters
        //When you change the camera's position,
        //they shift the position of the world in the opposite direction
        get x() { return _x },
        get y() { return _y },
        set x(v) { _x = v; world.x = -_x },
        set y(v) { _y = v; world.y = -_y },
        get width() {return _width},
        get height() {return _height},
        get worldWidth() { return worldWidth},
        get worldHeight() { return worldHeight},
        //Boundary properties that define a rectangular area, half the size
        //of the game screen. If the sprite that the camera is following
        //is inide this area, the camera won't scroll. If the sprite
        //crosses this boundary, the `follow` function ahead will change
        //the camera's x and y position to scroll the game world
        get rightInnerBoundary() {
          return this.x + MFL(width2 + width4)
        },
        get leftInnerBoundary() {
          return this.x + MFL(width2 - width4)
        },
        get topInnerBoundary() {
          return this.y + MFL(height2 - height4)
        },
        get bottomInnerBoundary() {
          return this.y + MFL(height2 + height4)
        },
        follow(s){
          let bx= _.feq0(s.rotation)? _S.getBBox(s) : _S.boundingBox(s);
          //Check the sprites position in relation to the inner
          //boundary. Move the camera to follow the sprite if the sprite
          //strays outside the boundary
          if(bx.x1 < this.leftInnerBoundary){
            this.x = bx.x1 - width4
          }
          if(bx.y1 < this.topInnerBoundary){
            this.y = bx.y1 - height4
          }
          if(bx.x2 > this.rightInnerBoundary){
            this.x = bx.x2 - width4*3
          }
          if(bx.y2 > this.bottomInnerBoundary){
            this.y = bx.y2- height4*3
          }
          //If the camera reaches the edge of the map, stop it from moving
          if(this.x < 0) { this.x = 0 }
          if(this.y < 0) { this.y = 0 }
          if(this.x + _width > worldWidth){
            this.x = worldWidth - _width
          }
          if(this.y + _height > worldHeight){
            this.y = worldHeight - _height
          }
          //contain the object
          let {x1,x2,y1,y2}=s.m5.getImageOffsets();
          let n= bx.x2 - x2;
          if(n>worldWidth){ s.x -= (n-worldWidth) }
          n=bx.y2 - y2;
          if(n>worldHeight){ s.y -= (n-worldHeight) }
          n=bx.x1 + x1;
          if(n<0) { s.x += -n }
          n=bx.y1  + y1;
          if(n<0) { s.y += -n }
        },
        centerOver:function(s,y){
          if(arguments.length===1 && !is.num(s)){
            let c=_S.centerXY(s)
            this.x = c[0]- width2;
            this.y = c[1] - height2;
            _V.reclaim(c);
          }else{
            if(is.num(s)) this.x=s - width2;
            if(is.num(y)) this.y=y - height2;
          }
        }
      };
      signals.push([["post.remove",e],"dispose",self]);
      signals.forEach(e=>EventBus.sub(...e));
      return self;
    });

    /** @ignore */
    function _hitAB(a,b){
      let a_,b_,m,
          _S=Mojo.Sprites;
      if(a.m5.circular){
        a_= _S.toCircle(a);
        b_= b.m5.circular ? _S.toCircle(b) : _S.toPolygon(b);
        m= b.m5.circular ? Geo.hitCircleCircle(a_, b_) : Geo.hitCirclePolygon(a_, b_)
      }else{
        a_= _S.toPolygon(a);
        b_= b.m5.circular ? _S.toCircle(b) : _S.toPolygon(b);
        m= b.m5.circular ? Geo.hitPolygonCircle(a_, b_) : Geo.hitPolygonPolygon(a_, b_)
      }
      if(m){
        m.A=a;
        m.B=b;
      }
      return m;
    }

    /** @ignore */
    function _collideAB(a,b, bounce=true){
      let ret,m=_hitAB(a,b);
      if(m){
        if(b.m5.static){
          a.x -= m.overlapV[0];
          a.y -= m.overlapV[1];
        }else{
          let dx2=m.overlapV[0]/2,
              dy2=m.overlapV[1]/2;
          a.x -= dx2; a.y -= dy2;
          b.x += dx2; b.y += dy2;
        }
        if(bounce)
          _bounceOff(a,b,m);
      }
      return m;
    }

    /** @ignore */
    function _bounceOff(o1,o2,m) {
      if(o2.m5.static){
        //full bounce
        //v=v - (1+c)(v.n_)n_
        let p= _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN));
        _V.sub$(o1.m5.vel,p);
      }else{
        let k = -2 * ((o2.m5.vel[0] - o1.m5.vel[0]) * m.overlapN[0] +
                      (o2.m5.vel[1] - o1.m5.vel[1]) * m.overlapN[1]) /  (o1.m5.invMass + o2.m5.invMass);
        o1.m5.vel[0] -= k * m.overlapN[0] / o1.m5.mass;
        o1.m5.vel[1] -= k * m.overlapN[1] / o1.m5.mass;
        o2.m5.vel[0] += k * m.overlapN[0] / o2.m5.mass;
        o2.m5.vel[1] += k * m.overlapN[1] / o2.m5.mass;
      }
    }

    /** @ignore */
    function _collideDir(col){
      const c=new Set();
      if(col.overlapN[1] < -0.3){ c.add(Mojo.TOP) }
      if(col.overlapN[1] > 0.3){ c.add(Mojo.BOTTOM) }
      if(col.overlapN[0] < -0.3){ c.add(Mojo.LEFT) }
      if(col.overlapN[0] > 0.3){ c.add(Mojo.RIGHT) }
      return c;
    }

    /** @ignore */
    function _hitTestAB(a,b,react,extra){
      let c,m=_hitAB(a,b);
      if(m){
        if(react){
          a.x -= m.overlapV[0];
          a.y -= m.overlapV[1];
        }
        c= _collideDir(m);
        extra && extra(c,b);
      }
      return c;
    }

    const _PT=_V.vec();
    const _$={
      /**Find out if a point is touching a circlular or rectangular sprite.
       * @memberof module:mojoh5/2d
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPointXY(px,py,s){
        _PT[0]=px;
        _PT[1]=py;
        return this.hitTestPoint(_PT,s)
      },
      /**Apply bounce to the objects in this manifold.
       * @memberof module:mojoh5/2d
       * @param {Manifold} m
       */
      bounceOff(m){
        return _bounceOff(m.A,m.B,m)
      },
      /**Find out if a point is touching a circlular or rectangular sprite.
       * @memberof module:mojoh5/2d
       * @param {Vec2} point
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(point, s){
        let hit,
            _S=Mojo.Sprites;
        if(s.m5.circular){
          let c= _S.centerXY(s),
              r= MFL(s.width/2),
              d= _V.vecAB(c,point);
          hit= _V.len2(d) < r*r;
        }else{
          hit=Geo.hitTestPointPolygon(point,_S.toPolygon(s));
        }
        return hit;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hit(a,b){
        let m= _hitAB(a,b);
        if(m){
          EventBus.pub(["hit",a],m);
          EventBus.pub(["hit",b],m.swap()) }
        return m;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} bounce
       * @return {boolean}
       */
      collide(a,b, bounce=true){
        let m= _collideAB(a,b,bounce);
        return m && _collideDir(m);
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hitTest(a,b){ return _hitAB(a,b) },
      /**Use to contain a sprite with `x` and
       * `y` properties inside a rectangular area.
       * @memberof module:mojoh5/2d
       * @param {Sprite} s
       * @param {Container} container
       * @param {boolean} [bounce]
       * @param {function} [extra]
       * @return {number[]} a list of collision points
       */
      contain(s, container, bounce=false,extra=null){
        let c,
            _S=Mojo.Sprites;
        if(container instanceof Mojo.Scenes.Scene){
          c=Mojo.mockStage();
        }else if(container.m5 && container.m5.stage){
          c=container;
        }else{
          if(container.isSprite)
            _.assert(s.parent===container);
          else
            _.assert(false,"Error: contain() using bad container");
          _.assert(_.feq0(container.rotation),"Error: contain() container can't rotate");
          _.assert(_.feq0(container.anchor.x),"Error: contain() container anchor.x !==0");
          _.assert(_.feq0(container.anchor.y),"Error: contain() container anchor.y !==0");
          c=container;
        }
        let coff= _S.topLeftOffsetXY(c);
        let collision = new Set();
        let CX=false,CY=false;
        let R= Geo.getAABB(s.m5.circular ? _S.toCircle(s)
                                         : _S.toPolygon(s))
        let cl= c.x+coff[0],
            cr= cl+c.width,
            ct= c.y+coff[1],
            cb= ct+c.height;
        let rx=R.pos[0];
        let ry=R.pos[1];
        //left
        if(rx<cl){
          s.x += cl-rx;
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //right
        if(rx+R.width > cr){
          s.x -= rx+R.width- cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(ry < ct){
          s.y += ct-ry;
          CY=true;
          collision.add(Mojo.TOP);
        }
        //bottom
        if(ry+R.height > cb){
          s.y -= ry+R.height - cb;
          CY=true;
          collision.add(Mojo.BOTTOM);
        }
        if(collision.size > 0){
          if(CX){
            s.m5.vel[0] /= s.m5.mass;
            if(bounce) s.m5.vel[0] *= -1;
          }
          if(CY){
            s.m5.vel[1] /= s.m5.mass;
            if(bounce) s.m5.vel[1] *= -1;
          }
          extra && extra(collision)
        }else{
          collision=null;
        }
        return collision;
      },
      dbgShowCol(col){
        let out=[];
        if(is.set(col))
          for(let i of col.values())
            switch(i){
              case Mojo.TOP:
                out.push("top");
                break;
              case Mojo.LEFT:
                out.push("left");
                break;
              case Mojo.RIGHT:
                out.push("right");
                break;
              case Mojo.BOTTOM:
                out.push("bottom");
                break;
            }
        return out.join(",");
      }
    };

    return (Mojo["2d"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/2d"]=function(M){
      return M["2d"] ? M["2d"] : _module(M)
    }
  }

})(this);


