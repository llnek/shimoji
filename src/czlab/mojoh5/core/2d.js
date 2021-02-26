/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
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

  /**Create the module.
   */
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
    Mojo.Sprites.defMixin("2d",function(e){
      const signals=[];
      const self={
        dispose(){
          signals.forEach(s=> EventBus.unsub.apply(EventBus,s)) },
        boom(col){
          _.assert(col.A===e,"got bit by someone else???");
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
        },
        motion(dt){
          if(is.num(dt)){
            for(let delta=dt;delta>0;){
              dt = _.min(1/30,delta);
              e.m5.vel[0] += e.m5.acc[0] * dt + e.m5.gravity[0] * dt;
              e.m5.vel[1] += e.m5.acc[1] * dt + e.m5.gravity[1] * dt;
              e.x += e.m5.vel[0] * dt;
              e.y += e.m5.vel[1] * dt;
              delta -= dt;
              e.m5.collide && e.m5.collide();
            }
          }else{
            e.x += e.m5.vel[0];
            e.y += e.m5.vel[1];
            e.m5.collide && e.m5.collide();
          }
        }
      };
      signals.push([["hit",e],"boom",self]);
      signals.push([["post.remove",e],"dispose",self]);
      signals.forEach(s=> EventBus.sub.apply(EventBus,s));
      return self;
    });

    /**Define a mixin to handle platform games
     */
    Mojo.Sprites.defMixin("platformer", function(e){
      const signals=[];
      const self={
        jumpSpeed: -300,//y-axis goes down
        jumping:false,
        landed:0,
        dispose(){
          signals.forEach(s=> EventBus.unsub.apply(EventBus,s)) },
        onLanded(){ self.landed=0.2 },
        motion(dt){
          let _I=Mojo.Input,
              col,
              j3= self.jumpSpeed/3,
              pR= _I.keyDown(_I.keyRIGHT),
              pU= _I.keyDown(_I.keyUP),
              pL= _I.keyDown(_I.keyLEFT);
          if(!e.m5.skipCollide){
            if(e.m5.contacts.length>0 && (pL || pR || self.landed>0)){
              if(e.m5.contacts.length===1) {
                col= e.m5.contacts[0]
              }else{
                for(let i=0; i< e.m5.contacts.length; ++i){
                  if(e.m5.contacts[i].overlapN[1] < 0){
                    col= e.m5.contacts[i]
                  }
                }
              }
              // don't climb up walls.
              //if(col && (col.overlapN[1] > -0.3 || col.overlapN[1] < 0.3)) { col= null }//old
              if(col && (col.overlapN[1] > 0.85 || col.overlapN[1] < -0.85)) { col= null }//mine
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
      signals.push([["post.remove",e],"dispose",self]);
      signals.forEach(s=> EventBus.sub.apply(EventBus,s));
      return self;
    });

    /**Define mixin `aiBounce`.
     */
    Mojo.Sprites.defMixin("aiBounce", function(e){
      const signals=[];
      const self= {
        dispose(){
          signals.forEach(e=>EventBus.unsub.apply(EventBus,e)) },
        goLeft(col){
          e.m5.vel[0] = -col.impact;//-e.m5.speed;
          e.m5.flip= self.dftDirection === Mojo.RIGHT?"x":false;
        },
        goRight(col){
          e.m5.vel[0] = col.impact;//e.m5.speed;
          e.m5.flip= self.dftDirection === Mojo.LEFT?"x":false;
        },
        goUp(col){
          e.m5.vel[0] = -col.impact;//-col.overlapV[0];
          e.m5.flip=self.dftDirection === Mojo.DOWN?"y":false;
        },
        goDown(col){
          e.m5.vel[0] = col.impact;//col.overlapV[0];
          e.m5.flip=self.defDirection === Mojo.UP?"y":false;
        }
      };
      signals.push([["post.remove",e],"dispose",self]);
      signals.push([["bump.right",e],"goLeft",self]);
      signals.push([["bump.left",e],"goRight",self]);
      signals.push([["bump.top",e],"goDown",self]);
      signals.push([["bump.bottom",e],"goUp",self]);
      signals.forEach(e=>EventBus.sub.apply(EventBus,e));
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
        a.m5.contacts.push(m);
        b.m5.contacts.push(m);
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
          EventBus.pub(["hit",b],m) }
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
        let hit= m && _collideDir(m);
        if(m){
          //EventBus.pub(["hit",a],m);
          //EventBus.pub(["hit",b],m);
        }
        return hit;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/2d
       * @param {Sprite} a
       * @param {Sprite} b
       * @pqram {boolean} [react]
       * @param {function} extra
       * @return {boolean}
       */
      hitTest(a,b,react,extra){
        return _hitTestAB(a,b,react,extra)
      },
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
          _.assert(container.rotation===0,"Error: contain() container can't rotate");
          _.assert(container.anchor.x===0,"Error: contain() container anchor.x !==0");
          _.assert(container.anchor.y===0,"Error: contain() container anchor.y !==0");
          c=container;
        }
        let coff= _S.topLeftOffsetXY(c);
        let collision = new Set();
        let CX=false,CY=false;
        let R= Geo.getAABB(s.m5.circular ? _S.toCircle(s)
                                         : _S.toPolygon(s))
        let cl= c.x-coff[0], cb=c.y-coff[1], cr=cl+c.width, ct=cb+c.height;
        //left
        if(R.pos[0]+cl < cl){
          s.x += (cl-R.pos[0]-cl);
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //bottom
        if(R.pos[1]+cb < cb){
          s.y += (cb-R.pos[1]-cb);
          CY=true;
          collision.add(Mojo.TOP);
        }
        //right
        if(R.pos[0]+R.width+cl > cr){
          s.x -= R.pos[0]+R.width+cl - cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(R.pos[1]+R.height+cb > ct){
          s.y -= R.pos[1]+R.height+cb - ct;
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
      /**The `worldCamera` method returns a `camera` object
       * with `x` and `y` properties. It has
       * two useful methods: `centerOver`, to center the camera over
       * a sprite, and `follow` to make it follow a sprite.
       * `worldCamera` arguments: worldObject, theCanvas
       * The worldObject needs to have a `width` and `height` property.
       * @memberof module:mojoh5/2d
       * @param {object} world
       * @param {number} worldWidth
       * @param {number} worldHeight
       * @param {object} canvas
       * @return {object}
       *
       */
      worldCamera(world, worldWidth, worldHeight, canvas){
        canvas=_.or(canvas,Mojo.canvas);
        const camera={
          height: canvas.height,
          width: canvas.width,
          _x:0,
          _y:0,
          //`x` and `y` getters/setters
          //When you change the camera's position,
          //they shift the position of the world in the opposite direction
          get x() { return this._x },
          get y() { return this._y },
          set x(value) { this._x = value; world.x = -this._x },
          set y(value) { this._y = value; world.y = -this._y },
          get centerX() { return this.x + (this.width / 2) },
          get centerY() { return this.y + (this.height / 2) },
          //Boundary properties that define a rectangular area, half the size
          //of the game screen. If the sprite that the camera is following
          //is inide this area, the camera won't scroll. If the sprite
          //crosses this boundary, the `follow` function ahead will change
          //the camera's x and y position to scroll the game world
          get rightInnerBoundary() {
            return this.x + (this.width/2) + (this.width/4)
          },
          get leftInnerBoundary() {
            return this.x + (this.width/2) - (this.width/4)
          },
          get topInnerBoundary() {
            return this.y + (this.height/2) - (this.height/4)
          },
          get bottomInnerBoundary() {
            return this.y + (this.height/2) + (this.height/4)
          },
          //Use the `follow` method to make the camera follow a sprite
          follow(s){
            //Check the sprites position in relation to the inner
            //boundary. Move the camera to follow the sprite if the sprite
            //strays outside the boundary
            if(s.x < this.leftInnerBoundary){
              this.x = s.x - (this.width/4);
            }
            if(s.y < this.topInnerBoundary){
              this.y = s.y - (this.height/4);
            }
            if(s.x + s.width > this.rightInnerBoundary){
              this.x = s.x + s.width - (this.width / 4 * 3);
            }
            if(s.y + s.height > this.bottomInnerBoundary){
              this.y = s.y + s.height - (this.height / 4 * 3);
            }
            //If the camera reaches the edge of the map, stop it from moving
            if(this.x < 0) { this.x = 0 }
            if(this.y < 0) { this.y = 0 }
            if(this.x + this.width > worldWidth){
              this.x = worldWidth - this.width
            }
            if(this.y + this.height > worldHeight){
              this.y = worldHeight - this.height
            }
          },
          centerOver:function(s,y){
            let w2=this.width/2,
                h2=this.height/2;
            if(arguments.length===1 && !is.num(s)){
              //an object
              let sz= Mojo.Sprites.halfSize(s);
              //Center the camera over a sprite
              this.x = s.x + sz.width - w2;
              this.y = s.y + sz.height - h2;
            }else{
              if(is.num(s)) this.x=s - w2;
              if(is.num(y)) this.y=y - h2;
            }
          }
        };
        return camera;
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
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/2d"]=function(M){
      return M["2d"] ? M["2d"] : _module(M)
    }
  }

})(this);


