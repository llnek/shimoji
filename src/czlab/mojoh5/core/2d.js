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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           is, ute:_}=Mojo;
    const abs=Math.abs,
          cos=Math.cos,
          sin=Math.sin,
          int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const R=Math.PI/180,
          CIRCLE=Math.PI*2;

    /**
     * @module mojoh5/2d
     */

    /**
     * @typedef {object} HealthBarConfig
     * @property {number} scale scaling factor for drawing
     * @property {number} width width of the widget
     * @property {number} height height of the widget
     * @property {number} lives  default is 3
     * @property {number} borderWidth default is 4
     * @property {number|string} line color used for line
     * @property {number|string} fill color used for fill
     */

    /**
     * @typedef {object} HealthBarObj
     * @property {function} dec decrement live count
     * @property {number} lives lives remaining
     * @property {PIXI/Sprite} sprite the visual widget
     */

    /**
     * @typedef {object} GaugeUIConfig
     * @property {number} cx
     * @property {number} cy
     * @property {number} scale
     * @property {number} radius
     * @property {number} alpha
     * @property {PIXI/Graphics} gfx
     * @property {number|string} fill fill color
     * @property {number|string} line line color
     * @property {number|string} needle color of the needle
     * @property {function} update return next value (e.g. speed)
     */

    /**
     * @typedef {object} GaugeUIObj
     * @property {PIXI/Graphics} gfx
     * @property {function} draw draw the widget
     */

    /**
     * @typedef {object} PatrolObj
     * @property {function} goLeft
     * @property {function} goRight
     * @property {function} goUp
     * @property {function} goDown
     * @property {function} dispose
     */

    /**
     * @typedef {object} PlatformerObj
     * @property {function} dispose
     * @property {function} onTick
     * @property {number} jumpSpeed
     * @property {number} jumpKey  default is UP key
     */

    /**
     * @typedef {object} MazeRunnerObj
     * @property {function} dispose
     * @property {function} onTick
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PhotoMat",{
      setup(arg){
        if(arg.cb){ arg.cb(this) }else{
          this.g.gfx=_S.graphics();
          this.g.gfx.beginFill(_S.color(arg.color));
          //top,bottom
          this.g.gfx.drawRect(0,0,Mojo.width,arg.y1);
          this.g.gfx.drawRect(0,arg.y2,Mojo.width,Mojo.height-arg.y2);
          //left,right
          this.g.gfx.drawRect(0,0,arg.x1,Mojo.height);
          this.g.gfx.drawRect(arg.x2,0,Mojo.width-arg.x2,Mojo.height);
          this.g.gfx.endFill();
          this.insert(this.g.gfx);
        }
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    _Z.defScene("StarfieldBg",{
      setup(o){
        if(!o.height) o.height=Mojo.height;
        if(!o.width) o.width=Mojo.width;
        if(!o.count) o.count=100;
        if(!o.minVel) o.minVel=15;
        if(!o.maxVel) o.maxVel=30;
        const self=this,
              stars=[],
              W=0xffffff,
              gfx=_S.graphics();
        _.inject(this.g,{
          gfx,
          stars,
          lag:0,
          dynamic:true,
          fps: 1.0/o.fps,
          draw(){
            gfx.clear();
            stars.forEach(s=>{
              gfx.beginFill(W);
              gfx.drawRect(s.x, s.y, s.size, s.size);
              gfx.endFill();
            });
            return this;
          },
          moveStars(dt){
            this.lag +=dt;
            if(this.lag>=this.fps){
              this.lag=0;
              stars.forEach(s=>{
                s.y += dt * s.vel;
                if(s.y > o.height){
                  _V.set(s, _.randInt(o.width), 0);
                  s.size=_.randInt(4);
                  s.vel=(_.rand()*(o.maxVel- o.minVel))+o.minVel;
                }
              });
              this.draw();
            }
          }
        });
        if(o.static)
          this.g.dynamic=false;
        for(let i=0; i<o.count; ++i)
          stars[i] = {x: _.rand()*o.width,
                      y: _.rand()*o.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(o.maxVel- o.minVel))+o.minVel};
        this.g.draw() && this.insert(gfx);
      },
      postUpdate(dt){
        this.g.dynamic ? this.g.moveStars(dt) : 0
      }
    },{fps:90, count:100, minVel:15, maxVel:30 });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Emit something every so often...
     * @class
     */
    class PeriodicDischarge{
      constructor(ctor,intervalSecs,size=16){
        this._interval=intervalSecs;
        this._ctor=ctor;
        this._timer=0;
        this._size=size
        this._pool=_.fill(size,ctor);
      }
      lifeCycle(dt){
        this._timer += dt;
        if(this._timer > this._interval){
          this._timer = 0;
          this.discharge();
        }
      }
      discharge(){
        throw `PeriodicCharge: please implement action()` }
      reclaim(o){
        if(this._pool.length<this._size) this._pool.push(o)
      }
      _take(){
        return this._pool.length>0? this._pool.pop(): this._ctor()
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Define a mixin object. */
    Mojo.defMixin("2d",function(e,...minors){
      const {Sprites}= Mojo,
            subs=[],
            sigs=[],
            colls=[],
            self={
              dispose(){
                subs.forEach(s=> s.dispose());
                sigs.forEach(s=> Mojo.off(...s)) },
              boom(col){
                _.assert(col.A===e,"got hit by someone else???");
                if(col.B && col.B.m5.sensor){
                  Mojo.emit(["2d.sensor", col.B], col.A)
                }else{
                  let [dx,dy]= e.m5.vel;
                  col.impact=null;
                  _V.sub$(e,col.overlapV);
                  if(col.overlapN[1] < -0.3){
                    if(!e.m5.skipHit && dy<0){ _V.setY(e.m5.vel,0) }
                    col.impact = abs(dy);
                    Mojo.emit(["bump.top", e],col);
                  }
                  if(col.overlapN[1] > 0.3){
                    if(!e.m5.skipHit && dy>0){ _V.setY(e.m5.vel,0) }
                    col.impact = abs(dy);
                    Mojo.emit(["bump.bottom",e],col);
                  }
                  if(col.overlapN[0] < -0.3){
                    if(!e.m5.skipHit && dx<0){ _V.setX(e.m5.vel,0) }
                    col.impact = abs(dx);
                    Mojo.emit(["bump.left",e],col);
                  }
                  if(col.overlapN[0] > 0.3){
                    if(!e.m5.skipHit && dx>0){ _V.setX(e.m5.vel,0) }
                    col.impact = abs(dx);
                    Mojo.emit(["bump.right",e],col);
                  }
                  if(is.num(col.impact)){
                    Mojo.emit(["bump",e],col)
                  }else{
                    col.impact=0
                  }
                }
                colls.shift(col);
              },
              onTick(dt){
                colls.length=0;
                if(is.num(dt)){
                  _V.add$(e.m5.vel,_V.mul(e.m5.gravity,dt));
                  _V.add$(e.m5.vel,_V.mul(e.m5.acc,dt));
                  _V.mul$(e.m5.vel, e.m5.friction);
                }
                e.parent.collideXY(Sprites.move(e,dt));
                subs.forEach(s=> s.onTick(dt,colls));
              }
            };
      sigs.push([["hit",e],"boom",self],
                [["post.remove",e],"dispose",self]);
      sigs.forEach(s=> Mojo.on(...s));
      minors.forEach(m=>{
        let o,f=m[0];
        m[0]=e;
        o=f(...m);
        if(o.onTick)
          subs.push(o);
        _.assert(is.str(f.name)) && (self[f.name]=o);
      });
      return self;
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Define mixin `camera`. */
    Mojo.defMixin("camera2d", function(e,worldWidth,worldHeight,canvas){
      let _x=0;
      let _y=0;
      const _height= canvas?canvas.height:worldHeight,
            _width= canvas?canvas.width:worldWidth,
            height2=int(_height/2),
            width2=int(_width/2),
            height4=int(_height/4),
            width4=int(_width/4),
            {Sprites}=Mojo,
            sigs=[],
            world=e,
            self={
              dispose(){ sigs.forEach(s=>Mojo.off(...s)) },
              //changing the camera's xy pos shifts
              //pos of the world in the opposite direction
              set x(v){ _x=v; e.x= -_x },
              set y(v){ _y=v; e.y= -_y },
              get x(){ return _x },
              get y(){ return _y },
              worldHeight: worldHeight,
              worldWidth: worldWidth,
              width: _width,
              height: _height,
              follow(s){
                //Check the sprites position in relation to the viewport.
                //Move the camera to follow the sprite if the sprite
                //strays outside the viewport
                const bx= _.feq0(s.angle)? Sprites.getBBox(s)
                                         : Sprites.boundingBox(s);
                const _right=()=>{
                  if(bx.x2> this.x+int(width2+width4)){ this.x = bx.x2-width4*3 }},
                _left=()=>{
                  if(bx.x1< this.x+int(width2-width4)){ this.x = bx.x1-width4 }},
                _top=()=>{
                  if(bx.y1< this.y+int(height2-height4)){ this.y = bx.y1-height4 }},
                _bottom=()=>{
                  if(bx.y2> this.y+int(height2+height4)){ this.y = bx.y2- height4*3 }};
                _left();  _right();  _top();  _bottom();
                //clamp the camera
                if(this.x<0){ this.x = 0 }
                if(this.y<0){ this.y = 0 }
                if(this.x+_width > worldWidth){ this.x= worldWidth - _width }
                if(this.y+_height > worldHeight){ this.y= worldHeight - _height }
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
                  let c=Sprites.centerXY(s)
                  this.x = c[0]- width2;
                  this.y = c[1] - height2;
                }else{
                  if(is.num(s)) this.x=s - width2;
                  if(is.num(y)) this.y=y - height2;
                }
              }
            };
      sigs.push([["post.remove",e],"dispose",self]);
      return (sigs.forEach(e=>Mojo.on(...e)), self);
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      PeriodicDischarge,
      /**Create a HealthBar widget.
       * @memberof module:mojoh5/2d
       * @param {HealthBarConfig} cfg
       * @return {HealthBarObj}
       */
      healthBar(arg){
        let {scale:K,width,height,
             lives,borderWidth,line,fill}=arg;
        let c,padding=4*K,fit=4*K,out=[];
        borderWidth = (borderWidth||4)*K;
        lives= lives||3;
        fill=_S.color(fill);
        line=_S.color(line);
        for(let r,w=int(width/lives), i=0;i<lives;++i){
          out.push(_S.rect(w,height-2*borderWidth,fill))
        }
        return{
          dec(){
            if(this.lives>0){
              this.lives -= 1;
              out[this.lives].visible=false;
            }
            return this.lives>0;
          },
          lives: out.length,
          sprite: _Z.layoutX(out,{bg:["#cccccc",0],
                                  borderWidth,
                                  border:line,padding,fit})
        }
      },
      //modified from original source: codepen.io/johan-tirholm/pen/PGYExJ
      /**Create a gauge like speedometer.
       * @memberof module:mojoh5/2d
       * @param {GaugeUIConfig} cfg
       * @return {GaugeUIObj}
       */
      gaugeUI(arg){
        let {minDeg,maxDeg,
             line,gfx,scale:K,
             cx,cy,radius,alpha,fill,needle }= _.patch(arg,{minDeg:90,maxDeg:360});
        const segs= [0, R*45, R*90, R*135, R*180, R*225, R*270, R*315];
        function getPt(x, y, r,rad){ return[x + r * cos(rad), y + r * sin(rad) ] }
        function drawTig(x, y, rad, size){
          let [sx,sy] = getPt(x, y, radius - 4*K, rad),
              [ex,ey] = getPt(x, y, radius - 12*K, rad);
          gfx.lineStyle({color: line, width:size, cap:PIXI.LINE_CAP.ROUND});
          gfx.moveTo(sx, sy);
          gfx.lineTo(ex, ey);
          gfx.closePath();
        }
        function drawPtr(r,color, rad){
          let [px,py]= getPt(cx, cy, r - 20*K, rad),
              [p2x,p2y] = getPt(cx, cy, 2*K, rad+R*90),
              [p3x,p3y] = getPt(cx, cy, 2*K, rad-R*90);
          gfx.lineStyle({cap:PIXI.LINE_CAP.ROUND, width:4*K, color: needle});
          gfx.moveTo(p2x, p2y);
          gfx.lineTo(px, py);
          gfx.lineTo(p3x, p3y);
          gfx.closePath();
          gfx.lineStyle({color:line});
          gfx.beginFill(line);
          gfx.drawCircle(cx,cy,9*K);
          gfx.endFill();
        }
        needle=_S.color(needle);
        line=_S.color(line);
        fill=_S.color(fill);
        radius *= K;
        return {
          gfx,
          draw(){
            gfx.clear();
            gfx.lineStyle({width: radius/8,color:line});
            gfx.beginFill(fill, alpha);
            gfx.drawCircle(cx, cy, radius);
            gfx.endFill();
            segs.forEach(s=> drawTig(cx, cy, s, 7*K));
            drawPtr(radius*K, fill, R* _M.lerp(minDeg, maxDeg, arg.update()));
          }
        }
      },
      /**Sprite walks back and forth, like a patrol.
       * @memberof module:mojoh5/2d
       * @param {PIXI/Sprite} e
       * @param {boolean} xDir walk left and right
       * @param {boolean} yDir walk up and down
       * @return {PatrolObj}
       */
      Patrol(e,xDir,yDir){
        const sigs=[];
        const self={
          dispose(){
            sigs.forEach(a=>Mojo.off(...a)) },
          goLeft(col){
            e.m5.heading=Mojo.LEFT;
            e.m5.flip= "x";
            _V.setX(e.m5.vel, -col.impact);
          },
          goRight(col){
            e.m5.heading=Mojo.RIGHT;
            e.m5.flip= "x";
            _V.setX(e.m5.vel, col.impact);
          },
          goUp(col){
            _V.setY(e.m5.vel,-col.impact);
            e.m5.heading=Mojo.UP;
            e.m5.flip= "y";
          },
          goDown(col){
            _V.setY(e.m5.vel, col.impact);
            e.m5.heading=Mojo.DOWN;
            e.m5.flip= "y";
          }
        };
        sigs.push([["post.remove",e],"dispose",self]);
        if(xDir){
          //e.m5.heading=Mojo.LEFT;
          sigs.push([["bump.right",e],"goLeft",self],
                    [["bump.left",e],"goRight",self]);
        }
        if(yDir){
          //e.m5.heading=Mojo.UP;
          sigs.push([["bump.top",e],"goDown",self],
                    [["bump.bottom",e],"goUp",self]);
        }
        sigs.forEach(a=>Mojo.on(...a));
        return self;
      },
      /**Enhance sprite to move like mario
       * @memberof module:mojoh5/2d
       * @param {PIXI/Sprite} e
       * @return {PlatformerObj}
       */
      Platformer(e){
        const {Input, Sprites}=Mojo;
        const sigs=[];
        const self={
          jumpKey: Input.UP,
          jumpSpeed: -300,
          _jumping:0,
          _ground:0,
          dispose(){
            sigs.forEach(s=> Mojo.off(...s)) },
          onGround(){ self._ground=0.24 },
          onTick(dt,colls){
            if(!e.m5.skipHit)
              this._onTick(dt,colls)
            self._ground -=dt;
          },
          _onTick(dt,colls){
            let col=colls[0],
                vs= e.m5.speed,
                j3= self.jumpSpeed/3,
                pR= Input.keyDown(Input.RIGHT),
                pL= Input.keyDown(Input.LEFT),
                pU= Input.keyDown(self.jumpKey);
            if(col && (pL || pR || self._ground>0)){
              //too steep to go up or down
              if(col.overlapN[1] > 0.85 ||
                 col.overlapN[1] < -0.85){ col= null } }
            if(pL && !pR){
              e.m5.heading = Mojo.LEFT;
              if(col && self._ground>0){
                _V.set(e.m5.vel, vs * col.overlapN[0],
                                 -vs * col.overlapN[1])
              }else{
                _V.setX(e.m5.vel,-vs)
              }
            }else if(pR && !pL){
              e.m5.heading = Mojo.RIGHT;
              if(col && self._ground>0){
                _V.set(e.m5.vel, -vs * col.overlapN[0],
                                 vs * col.overlapN[1])
              }else{
                _V.setX(e.m5.vel, vs)
              }
            }else{
              _V.setX(e.m5.vel,0);
              if(col && self._ground>0)
                _V.setY(e.m5.vel,0);
            }
            //handle jumpy things
            if(self._ground>0 && !self._jumping && pU){
              _V.setY(e.m5.vel,self.jumpSpeed);
              self._jumping +=1;
              self._ground = -dt;
            }else if(pU){
              //held long enough, tell others it's jumping
              if(self._jumping<2){
                self._jumping +=1;
                Mojo.emit(["jump",e]);
              }
            }
            if(self._jumping && !pU){
              self._jumping = 0;
              Mojo.emit(["jumped",e]);
              if(e.m5.vel[1] < j3){ e.m5.vel[1] = j3 }
            }
          }
        };
        sigs.push([["bump.bottom",e],"onGround",self]);
        sigs.forEach(s=> Mojo.on(...s));
        return self;
      },
      /**Enhance sprite to move like pacman.
       * @memberof module:mojoh5/2d
       * @param {PIXI/Sprite} e
       * @param {array} frames optional
       * @return {MazeRunnerObj}
       */
      MazeRunner(e,frames){
        const {Sprites, Input}=Mojo;
        const self={
          dispose(){
            Mojo.off(self)
          },
          onTick(dt){
            let [vx,vy]=e.m5.vel,
                vs=e.m5.speed,
                x = !_.feq0(vx),
                y = !_.feq0(vy);
            if(!(x&&y) && frames){
              if(y){
                if(is.obj(frames))
                  e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP]);
                else if (frames){
                  e.angle=vy>0?180:0;
                }
              }
              if(x){
                if(is.obj(frames))
                  e.m5.showFrame(frames[vx>0?Mojo.RIGHT:Mojo.LEFT]);
                else if(frames){
                  e.angle=vx>0?90:-90;
                }
              }
            }
            let r,d,l,u;
            if(Mojo.u.touchOnly){
              r=e.m5.heading===Mojo.RIGHT;
              l=e.m5.heading===Mojo.LEFT;
              u=e.m5.heading===Mojo.UP;
              d=e.m5.heading===Mojo.DOWN;
            }else{
              r=Input.keyDown(Input.RIGHT) && Mojo.RIGHT;
              d=Input.keyDown(Input.DOWN) && Mojo.DOWN;
              l=Input.keyDown(Input.LEFT) && Mojo.LEFT;
              u=Input.keyDown(Input.UP) && Mojo.UP;
            }
            if(l||u){vs *= -1}
            if(l&&r){
              _V.setX(e.m5.vel,0);
            }else if(l||r){
              e.m5.heading= l||r;
              _V.setX(e.m5.vel,vs); }
            if(u&&d){
              _V.setY(e.m5.vel,0);
            }else if(u||d){
              e.m5.heading= u||d;
              _V.setY(e.m5.vel,vs); } } };
        e.m5.heading=Mojo.UP;
        return self;
      }
    };

    return (Mojo["2d"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/2d"]=(M)=>{
      return M["2d"] ? M["2d"] : _module(M) } }

})(this);


