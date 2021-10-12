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
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           is, ute:_}=Mojo;
    const ABS=Math.abs,
          int=Math.floor;

    /**
     * @module mojoh5/2d
     */

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function healthBar(arg){
      let K=Mojo.getScaleFactor(),
          c,out=[],padding=4*K,fit=4*K,
          {width,height,lives,border,line,fill}=arg;
      border = int(border || 4*K);
      lives= lives || 3;
      fill=_S.color(fill);
      line=_S.color(line);
      for(let r,w=int(width/lives), i=0;i<lives;++i){
        out.push(_S.rect(w,height-2*border,fill))
      }
      return{
        sprite: _Z.layoutX(out,{bg:["#cccccc",0],borderWidth:border,border:line,padding,fit}),
        lives: out.length,
        dec(){
          if(this.lives>0){
            this.lives -= 1;
            out[this.lives].visible=false;
          }
          return this.lives>0;
        }
      };
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const R=Math.PI/180,
          CIRCLE=Math.PI*2;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //modified from original source: codepen.io/johan-tirholm/pen/PGYExJ
    //arg={cx,cy,radius,fill,line,alpha}
    function gaugeUI(arg){
      let {minDeg,maxDeg,radius,
           gfx,scale:K,
           line, fill, needle }= _.patch(arg,{minDeg:90,maxDeg:360});
      needle=_S.color(needle);
      line=_S.color(line);
      fill=_S.color(fill);
      radius *= K;
      return {
        segs: [0, R*45, R*90, R*135, R*180, R*225, R*270, R*315],
        gfx,
        getPt(x, y, radius, rad){
          return[x + radius * Math.cos(rad),
                 y + radius * Math.sin(rad) ]
        },
        draw(){
          gfx.clear();
          gfx.lineStyle({width:8,color:line});
          gfx.beginFill(fill, arg.alpha);
          gfx.drawCircle(arg.cx, arg.cy, radius);
          gfx.endFill();
          this.segs.forEach(s=>{
            this.drawTig(gfx, arg.cx, arg.cy, radius, s, 7*K);
          });
          this.drawPtr(gfx, arg.cx,arg.cy,
                       64*K, fill, R* _M.lerp(minDeg, maxDeg, arg.update()));
        },
        drawTig(gfx, x, y, radius, rad, size){
          let [sx,sy] = this.getPt(x, y, radius - 4*K, rad),
              [ex,ey] = this.getPt(x, y, radius - 12*K, rad);
          gfx.lineStyle({color: line, width:size, cap:PIXI.LINE_CAP.ROUND});
          gfx.moveTo(sx, sy);
          gfx.lineTo(ex, ey);
          gfx.closePath();
        },
        drawPtr(gfx, cx,cy, radius, color, rad){
          let [px,py]= this.getPt(cx, cy, radius - 20*K, rad),
              [p2x,p2y] = this.getPt(cx, cy, 2*K, rad+R*90),
              [p3x,p3y] = this.getPt(cx, cy, 2*K, rad-R*90);
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
      }
    }
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

    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    _Z.defScene("StarfieldBg",{
      setup(o){
        if(!o.minVel) o.minVel=15;
        if(!o.maxVel) o.maxVel=30;
        if(!o.count) o.count=100;
        if(!o.width) o.width=Mojo.width;
        if(!o.height) o.height=Mojo.height;

        let gfx= _S.graphics();
        let stars=[];

        this.g.fps= 1.0/o.fps;
        this.g.stars=stars;
        this.g.gfx=gfx;
        this.g.lag=0;
        this.g.dynamic=true;

        if(o.static)
          this.g.dynamic=false;

        for(let i=0; i<o.count; ++i)
          stars[i] = {x: _.rand()*o.width,
                      y: _.rand()*o.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(o.maxVel- o.minVel))+o.minVel};
        this._draw();
        this.insert(gfx);
      },
      _draw(){
        const w=0xffffff;
        this.g.gfx.clear();
        this.g.stars.forEach(s=>{
          this.g.gfx.beginFill(w);
          this.g.gfx.drawRect(s.x,
                              s.y,
                              s.size,
                              s.size);
          this.g.gfx.endFill();
        });
      },
      moveStars(dt){
        this.g.lag +=dt;
        if(this.g.lag<this.g.fps){}else{
          this.g.lag=0;
          for(let s,i=0,
                  o=this.m5.options;
                  i<this.g.stars.length;++i){
            s=this.g.stars[i];
            s.y += dt * s.vel;
            if(s.y > o.height){
              _V.set(s, _.randInt(o.width), 0);
            s.size=_.randInt(4);
            s.vel=(_.rand()*(o.maxVel- o.minVel))+o.minVel; } }
          this._draw();
        }
      },
      postUpdate(dt){
        this.g.dynamic ? this.moveStars(dt) : 0
      }
    },{fps:90, count:100, minVel:15, maxVel:30 });

    /** emit something every so often... */
    class PeriodicDischarge{
      constructor(ctor,intervalSecs,size=16,...args){
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
      _take(){
        if(this._pool.length>0) return this._pool.pop() }
      reclaim(o){
        if(this._pool.length<this._size) this._pool.push(o); } }

    /** walks around a maze like in Pacman. */
    function MazeRunner(e,frames){
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
              if(is.vec(frames))
                e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP]);
              else if (frames){
                e.angle=vy>0?180:0;
              }
            }
            if(x){
              if(is.vec(frames))
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
      return (e.m5.heading=Mojo.UP) && self;
    }

    /** platformer like mario. */
    function Platformer(e){
      const {Input, Sprites}=Mojo;
      const sigs=[];
      const self={
        jumpKey: Input.UP,
        jumpSpeed: -300,
        _jumping:0,
        _ground:0,
        dispose(){
          sigs.forEach(s=> Mojo.off(...s)) },
        onGround(){ self._ground=0.2 },
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
    }

    /**Define a mixin object. */
    Mojo.defMixin("2d",function(e,...minors){
      const {Sprites}= Mojo;
      const colls=[];
      const sigs=[];
      const subs=[];
      const self={
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
              col.impact = ABS(dy);
              Mojo.emit(["bump.top", e],col);
            }
            if(col.overlapN[1] > 0.3){
              if(!e.m5.skipHit && dy>0){ _V.setY(e.m5.vel,0) }
              col.impact = ABS(dy);
              Mojo.emit(["bump.bottom",e],col);
            }
            if(col.overlapN[0] < -0.3){
              if(!e.m5.skipHit && dx<0){ _V.setX(e.m5.vel,0) }
              col.impact = ABS(dx);
              Mojo.emit(["bump.left",e],col);
            }
            if(col.overlapN[0] > 0.3){
              if(!e.m5.skipHit && dx>0){ _V.setX(e.m5.vel,0) }
              col.impact = ABS(dx);
              Mojo.emit(["bump.right",e],col);
            }
            if(is.num(col.impact)){
              Mojo.emit(["bump",e],col);
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
      for(let f,o,m,i=0;i<minors.length;++i){
        m=minors[i];
        f=m[0];
        m[0]=e;
        o=f(...m);
        if(o.onTick)
          subs.push(o);
        _.assert(is.str(f.name)) && (self[f.name]=o);
      }
      return self;
    });

    /** bounce back and forth... */
    function Patrol(e,xDir,yDir){
      const sigs=[];
      const self= {
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
      return sigs.forEach(a=>Mojo.on(...a)), self;
    }

    /**Define mixin `camera`. */
    Mojo.defMixin("camera2d", function(e,worldWidth,worldHeight,canvas){
      const _height= canvas?canvas.height:worldHeight;
      const _width= canvas?canvas.width:worldWidth;
      const height2=int(_height/2);
      const width2=int(_width/2);
      const height4=int(_height/4);
      const width4=int(_width/4);
      const {Sprites}=Mojo;
      const sigs=[];
      const world=e;
      let _x=0;
      let _y=0;
      const self={
        dispose(){ sigs.forEach(s=>Mojo.off(...s)) },
        //changing the camera's xy pos shifts
        //pos of the world in the opposite direction
        set x(v){ _x=v; e.x= -_x },
        set y(v){ _y=v; e.y= -_y },
        get x(){ return _x },
        get y(){ return _y },
        worldWidth: worldWidth,
        worldHeight: worldHeight,
        width: _width,
        height: _height,
        follow(s){
          //Check the sprites position in relation to the viewport.
          //Move the camera to follow the sprite if the sprite
          //strays outside the viewport
          const bx= _.feq0(s.angle)? Sprites.getBBox(s)
                                   : Sprites.boundingBox(s);
          const _right=()=>{
            if(bx.x2> this.x+int(width2+width4)){
              this.x = bx.x2-width4*3;
            }},
            _left=()=>{
              if(bx.x1< this.x+int(width2-width4)){
              this.x = bx.x1-width4;
            }},
            _top=()=>{
            if(bx.y1< this.y+int(height2-height4)){
              this.y = bx.y1-height4;
            }},
            _bottom=()=>{
            if(bx.y2> this.y+int(height2+height4)){
              this.y = bx.y2- height4*3;
            }};
          _left();  _right();  _top();  _bottom();
          //clamp the camera
          if(this.x<0){ this.x = 0 }
          if(this.y<0){ this.y = 0 }
          if(this.x+_width > worldWidth){
            this.x= worldWidth - _width
          }
          if(this.y+_height > worldHeight){
            this.y= worldHeight - _height
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

    const _$={
      healthBar,
      gaugeUI,
      Patrol,
      Platformer,
      MazeRunner,
      PeriodicDischarge
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


