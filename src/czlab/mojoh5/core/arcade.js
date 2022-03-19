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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  /**Create the module. */
  function _module(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const _M=gscope["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           is, ute:_}=Mojo;
    const abs=Math.abs,
          cos=Math.cos,
          sin=Math.sin,
          int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const R=Math.PI/180,
          CIRCLE=Math.PI*2;

    /**
     * @module mojoh5/Arcade
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
    _Z.scene("PhotoMat",{
      setup(arg){
        if(arg.cb){ arg.cb(this) }else{
          let s= arg.image? Mojo.tcached(arg.image): UNDEF;
          this.g.gfx=_S.graphics();
          if(s)
            this.g.gfx.beginTextureFill({texture:s});
          else
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
    _Z.scene("HotKeys",{
      setup(options){
        let {fontName,fontSize,cb,radius,alpha,color}=options;
        let {char_down,char_up,char_left,char_right}=options;
        let bs,U,D,L,R;
        let opstr= options.buttons?"makeButton":"makeHotspot";

        _.assert(is.num(fontSize),"expected fontsize");
        _.assert(is.num(radius),"expected radius");
        _.assert(is.fun(cb),"expected callback");

        fontName=fontName||"Doki Lowercase";
        alpha=alpha || 0.2;
        color=_.nor(color,"grey");
        char_down=char_down||"-";
        char_up=char_up||"+";
        char_left=char_left||"<";
        char_right=char_right||">";
        D= _S.opacity(_S.circle(radius,color),alpha);
        D.addChild(_S.anchorXY(_S.bmpText(char_down,fontName,fontSize),0.5));
        U= _S.opacity(_S.circle(radius,color),alpha);
        U.addChild(_S.anchorXY(_S.bmpText(char_up,fontName,fontSize),0.5));
        L= _S.opacity(_S.circle(radius,color),alpha);
        L.addChild(_S.anchorXY(_S.bmpText(char_left,fontName,fontSize),0.5));
        R= _S.opacity(_S.circle(radius,color),alpha);
        R.addChild(_S.anchorXY(_S.bmpText(char_right,fontName,fontSize),0.5));
        bs=cb({left:L,right:R,down:D,up:U});
        if(bs.right){
          this.insert(_I[opstr](bs.right));
          if(bs.right.m5.hotspot)
            bs.right.m5.touch=(o,t)=> t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT);
        }
        if(bs.left){
          this.insert(_I[opstr](bs.left));
          if(bs.left.m5.hotspot)
            bs.left.m5.touch=(o,t)=> t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT);
        }
        if(bs.up){
          this.insert(_I[opstr](bs.up));
          if(bs.up.m5.hotspot)
            bs.up.m5.touch=(o,t)=> t?_I.setKeyOn(_I.UP):_I.setKeyOff(_I.UP);
        }
        if(bs.down){
          this.insert(_I[opstr](bs.down));
          if(bs.down.m5.hotspot)
            bs.down.m5.touch=(o,t)=> t?_I.setKeyOn(_I.DOWN):_I.setKeyOff(_I.DOWN);
        }
        if(options.extra)
          options.extra(this);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("AudioIcon",{
      setup(arg){
        let {xOffset,yOffset,xScale,yScale}=arg;
        let {cb,iconOn,iconOff}= arg;
        let {Sound}=Mojo;
        let K=Mojo.getScaleFactor(),
          s=_I.mkBtn(_S.spriteFrom(iconOn||"audioOn.png",iconOff||"audioOff.png"));

        xScale= _.nor(xScale, K*2);
        yScale= _.nor(yScale, K*2);
        xOffset= _.nor(xOffset, -10*K);
        yOffset= _.nor(yOffset, 0);
        _S.scaleXY(_S.opacity(s,0.343),xScale,yScale);
        _V.set(s,Mojo.width-s.width+xOffset, 0+yOffset);

        s.m5.showFrame(Sound.sfx()?0:1);
        s.m5.press=()=>{
          if(Sound.sfx()){
            Sound.mute();
            s.m5.showFrame(1);
          }else{
            Sound.unmute();
            s.m5.showFrame(0);
          }
        };
        this.insert(s);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    _Z.scene("StarfieldBg",{
      setup(o){
        _.patch(o,{
          height:Mojo.height,
          width:Mojo.width,
          count:100,
          minVel:15,
          maxVel:30
        });
        const self=this,
              stars=[],
              W=0xffffff,
              gfx=_S.graphics();
        _.inject(this.g,{
          gfx,
          stars,
          lag:0,
          dynamic:true,
          fps: 1/o.fps,
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
    Mojo.mixin("arcade",function(e, ...minors){
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
      //_.assert(e.parent && e.parent.collideXY, "no parent or parent.collideXY");
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
    Mojo.mixin("camera2d", function(e,worldWidth,worldHeight,canvas){
      let _x=0;
      let _y=0;
      const _height= canvas?canvas.height:worldHeight,
            _width= canvas?canvas.width:worldWidth,
            height2=_M.ndiv(_height,2),
            width2=_M.ndiv(_width,2),
            height4=_M.ndiv(_height,4),
            width4=_M.ndiv(_width,4),
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
                const bx= _.feq0(s.angle)? Sprites.getAABB(s)
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
                if(arguments.length==1 && !is.num(s)){
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
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //steering stuff
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {vec2} pos
       */
      seek(s, pos){
        let dv = _V.unit$(_V.sub(pos,s));
        if(dv){
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer,dv);
        }
        return s;
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       */
      flee(s, pos,range){
        //only flee if the target is within 'panic distance'
        let dv=_V.sub(s,pos), n=_V.len2(dv);
        if(range === undefined)
          range= s.m5.steerInfo.tooCloseDistance;
        if(n>range*range){}else{
          if(!_V.unit$(dv)) dv=[0.1,0.1];
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer, dv);
        }
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       */
      arrive(s, pos,range){
        let r=1, n= _V.dist(s,pos),
            dv = _V.unit$(_V.sub(pos,s));
        if(range === undefined)
          range= s.m5.steerInfo.arrivalThreshold;
        if(n>range){}else{ r=n/range }
        _V.mul$(dv,s.m5.maxSpeed * r);
        _V.sub$(dv,s.m5.vel);
        _V.add$(s.m5.steer,dv);
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {Sprite} target
       */
      pursue(s,target){
        let lookAheadTime = _V.dist(s,target) / s.m5.maxSpeed,
            predicted= _V.add(target, _V.mul(target.m5.vel,lookAheadTime));
        return this.seek(s,predicted);
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {Sprite} target
       */
      evade(s,target){
        let lookAheadTime = _V.dist(s,target) / s.m5.maxSpeed,
            predicted= _V.sub(target, _V.mul(target.m5.vel,lookAheadTime));
        return this.flee(s, predicted);
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @return {Sprite}
       */
      idle(s){
        _V.mul$(s.m5.vel,0);
        _V.mul$(s.m5.steer,0);
        return s;
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       */
      wander(s){
        let offset = _V.mul$([1,1], s.m5.steerInfo.wanderRadius),
            n=_V.len(offset),
            center= _V.mul$(_V.unit(s.m5.vel), s.m5.steerInfo.wanderDistance);
        offset[0] = Math.cos(s.m5.steerInfo.wanderAngle) * n;
        offset[1] = Math.sin(s.m5.steerInfo.wanderAngle) * n;
        s.m5.steerInfo.wanderAngle += _.rand() * s.m5.steerInfo.wanderRange - s.m5.steerInfo.wanderRange * 0.5;
        _V.add$(s.m5.steer, _V.add$(center,offset));
        return s;
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {Sprite} targetA
       * @param {Sprite} targetB
       */
      interpose(s,targetA, targetB){
        let mid= _V.div$(_V.add(targetA,targetB),2),
            dt= _V.dist(s,mid) / s.m5.maxSpeed,
            pA = _V.add(targetA, _V.mul(targetA.m5.vel,dt)),
            pB = _V.add(targetB,_V.mul(targetB.m5.vel,dt));
        return this.seek(s, _V.div$(_V.add$(pA,pB),2));
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} separationRadius
       * @param {number} maxSeparation
       */
      separation(s, ents, separationRadius=300, maxSeparation=100){
        let force = [0,0],
            neighborCount = 0;
        ents.forEach(e=>{
          if(e !== s && _V.dist(e,s) < separationRadius){
            _V.add$(force,_V.sub(e,s));
            ++neighborCount;
          }
        });
        if(neighborCount > 0){
          _V.flip$(_V.div$(force,neighborCount))
        }
        _V.add$(s.m5.steer, _V.mul$(_V.unit$(force), maxSeparation));
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {Sprite} leader
       * @param {array} ents
       * @param {number} distance
       * @param {number} separationRadius
       * @param {number} maxSeparation
       * @param {number} leaderSightRadius
       * @param {number} arrivalThreshold
       */
      followLeader(s,leader, ents, distance=400, separationRadius=300,
                   maxSeparation = 100, leaderSightRadius = 1600, arrivalThreshold=200){

        function isOnLeaderSight(s,leader, ahead, leaderSightRadius){
          return _V.dist(ahead,s) < leaderSightRadius ||
                 _V.dist(leader,s) < leaderSightRadius
        }

        let tv = _V.mul$(_V.unit(leader.m5.vel),distance);
        let ahead = _V.add(leader,tv);
        _V.flip$(tv);
        let behind = _V.add(leader,tv);
        if(isOnLeaderSight(s,leader, ahead, leaderSightRadius)){
          this.evade(s,leader);
        }
        this.arrive(s,behind,arrivalThreshold);
        return this.separation(s,ents, separationRadius, maxSeparation);
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} maxQueueAhead
       * @param {number} maxQueueRadius
       */
      queue(s,ents, maxQueueAhead=500, maxQueueRadius = 500){

        function getNeighborAhead(){
          let qa=_V.mul$(_V.unit(s.m5.vel),maxQueueAhead);
          let res, ahead = _V.add(s, qa);
          for(let d,i=0; i<ents.length; ++i){
            if(ents[i] !== s &&
               _V.dist(ahead,ents[i]) < maxQueueRadius){
              res = ents[i];
              break;
            }
          }
          return res;
        }

        let neighbor = getNeighborAhead();
        let brake = [0,0],
            v = _V.mul(s.m5.vel,1);
        if(neighbor){
          brake = _V.mul$(_V.flip(s.m5.steer),0.8);
          _V.unit$(_V.flip$(v));
          _V.add$(brake,v);
          if(_V.dist(s,neighbor) < maxQueueRadius){
            _V.mul$(s.m5.vel,0.3)
          }
        }
        _V.add$(s.m5.steer,brake);
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {array} ents
       */
      flock(s, ents){

        function inSight(e){
          return _V.dist(s,e) > s.m5.steerInfo.inSightDistance ? false
                                        : (_V.dot(_V.sub(e, s), _V.unit(s.m5.vel)) < 0 ? false : true);
        }

        let inSightCount = 0,
            averagePosition = [0,0],
            averageVelocity = _V.mul(s.m5.vel,1);

        ents.forEach(e=>{
          if(e !== this && inSight(e)){
            _V.add$(averageVelocity,e.m5.vel);
            _V.add$(averagePosition,e);
            if(_V.dist(s,e) < s.m5.steerInfo.tooCloseDistance){
              this.flee(s, e)
            }
            ++inSightCount;
          }
        });
        if(inSightCount>0){
          _V.div$(averageVelocity, inSightCount);
          _V.div$(averagePosition,inSightCount);
          this.seek(s,averagePosition);
          _V.add$(s.m5.steer, _V.sub$(averageVelocity, s.m5.vel));
        }
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {array} path
       * @param {boolean} loop
       * @param {number} thresholdRadius
       */
      followPath(s, path, loop, thresholdRadius=1){
        let wayPoint = path[s.m5.pathIndex];
        if(!wayPoint){return}
        if(_V.dist(s, wayPoint) < thresholdRadius){
          if(s.m5.pathIndex >= path.length-1){
            if(loop)
              s.m5.pathIndex = 0;
          }else{
            s.m5.pathIndex += 1;
          }
        }
        if(s.m5.pathIndex >= path.length-1 && !loop){
          this.arrive(s,wayPoint)
        }else{
          this.seek(s,wayPoint)
        }
      },
      /**
       * @memberof module:mojoh5/Arcade
       * @param {Sprite} s
       * @param {array} obstacles
       */
      avoid(s,obstacles){
        let dlen= _V.len(s.m5.vel) / s.m5.maxSpeed,
            ahead = _V.add(s, _V.mul$(_V.unit(s.m5.vel),dlen)),
            ahead2 = _V.add(s, _V.mul$(_V.unit(s.m5.vel),s.m5.steerInfo.avoidDistance*0.5)),
            avoidance, mostThreatening = null;
        for(let c,i=0; i<obstacles.length; ++i){
          if(obstacles[i] === this) continue;
          c = _V.dist(obstacles[i],ahead) <= obstacles[i].m5.radius ||
              _V.dist(obstacles[i],ahead2) <= obstacles[i].m5.radius;
          if(c)
            if(mostThreatening === null ||
               _V.dist(s,obstacles[i]) < _V.dist(s, mostThreatening)){
              mostThreatening = obstacles[i]
            }
        }
        if(mostThreatening){
          avoidance = _V.mul$(_V.unit$(_V.sub(ahead,mostThreatening)),100);
          _V.add$(s.m5.steer,avoidance);
        }
      },
      /**Check if there’s clear line of sight between two sprites.
       * memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} obstacles
       * @return {boolean}
       */
      lineOfSight(s1, s2, obstacles){
        let c1=_S.centerXY(s1),
            c2=_S.centerXY(s2);
        for(let b,rc,s,o,i=0;i<obstacles.length;++i){
          o=obstacles[i];
          if(o.m5.circle){
            rc=Geo.hitTestLineCircle(c1,c2, o.x, o.y, o.width/2)
          }else{
            rc=Geo.hitTestLinePolygon(c1,c2, Geo.bodyWrap(_S.toPolygon(o),o.x,o.y))
          }
          if(rc[0]) return false;
        }
        return true;
      },
      /**Create a projectile being fired out of a shooter.
       * @memberof module:mojoh5/Arcade
       * @param {any} src
       * @param {number} angle
       * @param {number} speed
       * @param {function} ctor
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      shoot(src, angle, speed, ctor,x,y){
        let b=ctor(),
            soff=Mojo.Sprites.topLeftOffsetXY(src);
        _V.add$(soff,[x,y]);
        _V.copy(b,_V.add(src,soff));
        _V.set(b.m5.vel, Math.cos(angle) * speed,
                         Math.sin(angle) * speed);
        return b;
      },
      /**Create a HealthBar widget.
       * @memberof module:mojoh5/Arcade
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
        for(let r,w=_M.ndiv(width,lives), i=0;i<lives;++i){
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
       * @memberof module:mojoh5/Arcade
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
       * @memberof module:mojoh5/Arcade
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
       * @memberof module:mojoh5/Arcade
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
       * @memberof module:mojoh5/Arcade
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

    return (Mojo["Arcade"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Arcade"]=(M)=>{
      return M["Arcade"] ? M["Arcade"] : _module(M) } }

})(this);


