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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /** */
  ////////////////////////////////////////////////////////////////////////////
  const BtnColors={
    blue:"#319bd5",
    green:"#78c03f",
    yellow:"#f9ef50",
    red:"#eb2224",
    orange:"#f48917",
    grey:"#848685",
    cyan:"#1ee5e6",
    lime:"#e5e61e",
    magenta:"#e61ee5",
    purple:"#a6499a"
  };
  const SomeColors={
    aqua: "#00FFFF",
    black:  "#000000",
    blue: "#0000FF",
    brown: "#A52A2A",
    crimson: "#DC143C",
    cyan: "#00FFFF",
    fuchsia:  "#FF00FF",
    gray: "#808080",
    green:  "#008000",
    grey: "#808080",
    lavender: "#E6E6FA",
    lime: "#00FF00",
    magenta:  "#FF00FF",
    maroon: "#800000",
    navy: "#000080",
    olive:  "#808000",
    orange: "#FFA500",
    purple: "#800080",
    red:  "#FF0000",
    silver: "#C0C0C0",
    teal: "#008080",
    turquoise: "#40E0D0",
    wheat: "#F5DEB3",
    white:  "#FFFFFF",
    yellow: "#FFFF00"};
  ////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  ////////////////////////////////////////////////////////////////////////////
  function _module(Mojo){

    const {v2:_V, math:_M, ute:_, is, dom} =Mojo;
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const PI2=Math.PI*2,
          int=Math.floor;

    /*PIXI code
      export type SCALE_MODE = | 'nearest' | 'linear';
      export type ALPHA_MODES = 'no-premultiply-alpha' | 'premultiply-alpha-on-upload' | 'premultiplied-alpha';
     export type LineCap = 'butt' | 'round' | 'square';
     export type LineJoin = 'round' | 'bevel' | 'miter';
    StrokeStyle extends FillStyle {
      //The color to use for the fill.
      color?: ColorSource;
      //The alpha value to use for the fill
      alpha?: number;
      //The texture to use for the fill.
      texture?: Texture | null;
      //The matrix to apply.
      matrix?: Matrix | null;
      //The fill pattern to use.
      fill?: FillPattern | FillGradient | null;
      //The width of the stroke.
      width?: number;
      //The alignment of the stroke.
      alignment?: number;
      // native?: boolean;
      //The line cap style to use.
      cap?: LineCap;
      //The line join style to use
      join?: LineJoin;
      //The miter limit to use.
      miterLimit?: number;
    }
    */

    ////////////////////////////////////////////////////////////////////////////
    /*Generate an actual Texture object */
    ////////////////////////////////////////////////////////////////////////////
    function _genTexture(dispObj, scaleMode, resolution, region){
      return new PIXI.GenerateTextureSystem(Mojo.ctx).generateTexture(dispObj)
    }

    ////////////////////////////////////////////////////////////////////////////
    //NOTE: ENSURE PIXI DOESN'T HAVE these SPECIAL PROPERTIES
    ////////////////////////////////////////////////////////////////////////////
    (function(c,g,s){
      g.circle(0, 0, 4); g.fill({color:0});
      s=new PIXI.Sprite(_genTexture(g));
      ["m5","tiled", "remove","collideXY","setup","preTMX","postTMX",
        "dispose","preDispose",
       "onTick","getGuid","getBBox", "getSpatial"].forEach(n=>{
        [[c,"Container"],[g,"Graphics"],[s,"Sprite"]].forEach(x=>{
          _.assertNot(_.has(x[0],n),`Uh Oh, PIXI ${x[1]} has our ${n} property!`)
        })
      })
    })(new PIXI.Container(),new PIXI.Graphics());

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Sprites
     */
    ////////////////////////////////////////////////////////////////////////////

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** Yaxis down, default contact points, CCW, starting at bottom right */
    ////////////////////////////////////////////////////////////////////////////
    function _cornersCCW(a,w,h){
      let out= [_V.vec(w,h), _V.vec(w,0), _V.vec(0,0), _V.vec(0,h)];
      a ? out.forEach(r=>{ r[0] -= int(w * a.x); r[1] -= int(h * a.y); }) : 0;
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Override the control of animation */
    ////////////////////////////////////////////////////////////////////////////
    function _exASprite(s){
      let tid=0,_s={};
      function _reset(){
        if(tid)
          tid=clearInterval(tid)
      }
      function _adv(){
        if(_s.cnt < _s.total){
          s.gotoAndStop(s.currentFrame+1);
          _s.cnt += 1;
        }else if(s.loop){
          s.gotoAndStop(_s.start);
          _s.cnt=1;
        }else{
          _reset();
          s.onComplete?.();
        }
      }
      _.inject(s.m5,{
        stopFrames(){ _reset(); s.gotoAndStop(s.currentFrame) },
        showFrame(f){ _reset(); s.gotoAndStop(f) },
        playFrames(seq){
          _reset();
          _s.start=0;
          _s.end= s.totalFrames-1;
          if(is.vec(seq) && seq.length>1){
            _s.start=seq[0];
            _s.end=seq[1];
          }
          _s.total=_s.end-_s.start+1;
          s.gotoAndStop(_s.start);
          _s.cnt=1;
          tid= setInterval(_adv, 1000/Mojo.aniFps);
        }
      });
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Low level sprite creation. */
    ////////////////////////////////////////////////////////////////////////////
    function _sprite(src,ctor){
      let s,obj;
      if(_.inst(PIXI.Graphics,src)){
        src=_genTexture(src);
      }
      if(_.inst(PIXI.Texture,src)){
        obj=src
      }else if(is.vec(src)){
        if(is.str(src[0]))
          src=src.map(s=> Mojo.resource(s));
        s=_.inst(PIXI.Texture,src[0])? new PIXI.AnimatedSprite(src, false) : UNDEF;
      }else if(is.str(src)){
        obj= Mojo.resource(src);
      }
      if(obj)
        s=ctor(obj);
      return _.assert(s, `SpriteError: ${src} not found`) && s
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*core function to make 2D grids */
    ////////////////////////////////////////////////////////////////////////////
    function _mkgrid(sx,sy,rows,cols,cellW,cellH){
      let y1=sy, x1=sx, out=[];
      for(let x2,y2,v,r=0; r<rows; ++r){
        v=[];
        for(let c=0; c<cols; ++c){
          y2 = y1 + cellH;
          x2 = x1 + cellW;
          v.push({x1,x2,y1,y2});
          x1 = x2;
        }
        y1 = y2;
        x1 = sx;
        out.push(v);
      }
      return out;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /* */
    ////////////////////////////////////////////////////////////////////////////
    function _pininfo(ThisModule,o,p=UNDEF){
      let par,box;
      if(o && o.m5 && o.m5.stage){
        box={x1:0,y1:0, x2:Mojo.width, y2:Mojo.height};
      }else{
        if(o.angle !== undefined)
          _.assert(_.feq0(o.angle), "expected non rotated object!");
        par=o.parent;
        box=ThisModule.getAABB(o);
      }
      if(p && par===p){
        //account for the parent's position...
        box.x1 += p.x;
        box.x2 += p.x;
        box.y1 += p.y;
        box.y2 += p.y;
      }
      //give extra info back...
      return [box, _M.ndiv(box.x2-box.x1,2),//half width
                   _M.ndiv(box.y2-box.y1,2),//half height
                   _M.ndiv(box.x1+box.x2,2),//center x
                   _M.ndiv(box.y1+box.y2,2)]//center y
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //basic 2 body collision physics, assuming o1 hits o2
    ////////////////////////////////////////////////////////////////////////////
    function _bounceOff(o1,o2,m){
      if(o2.m5.static){
        //full bounce v=v - (1+c)(v.n_)n_
        _V.sub$(o1.m5.vel,
                _V.mul(m.overlapN, 2 * _V.dot(o1.m5.vel,m.overlapN)))
      }else{
        let
          dd=_V.mul$(_V.sub(o2.m5.vel,o1.m5.vel),m.overlapN),
          k= -2 * (dd[0]+dd[1])/(o1.m5.invMass + o2.m5.invMass);
        _V.sub$(o1.m5.vel, _V.mul$(_V.div(m.overlapN,o1.m5.mass),k));
        _V.add$(o2.m5.vel, _V.mul$(_V.div(m.overlapN,o2.m5.mass),k));
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*Detect where the collision occurred */
    ////////////////////////////////////////////////////////////////////////////
    function _collideDir(col){
      const c=new Set();
      (col.overlapN[1] < -0.3) ? c.add(Mojo.TOP) :0;
      (col.overlapN[1] > 0.3) ? c.add(Mojo.BOTTOM) :0;
      (col.overlapN[0] < -0.3) ? c.add(Mojo.LEFT) :0;
      (col.overlapN[0] > 0.3) ? c.add(Mojo.RIGHT) : 0;
      c.add(col);
      return c;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //convert to std geometry for A hit B collision detection
    ////////////////////////////////////////////////////////////////////////////
    function _hitAB(S,a,b){
      let
        a_= S.toBody(a),
        m, b_= S.toBody(b);
      if(a.m5.circle){
        m= b.m5.circle ? Geo.hitCircleCircle(a_, b_)
                       : Geo.hitCirclePolygon(a_, b_)
      }else{
        m= b.m5.circle ? Geo.hitPolygonCircle(a_, b_)
                       : Geo.hitPolygonPolygon(a_, b_)
      }
      if(m){ m.A=a; m.B=b; }
      return m;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*A collides with B, elastic collision. */
    ////////////////////////////////////////////////////////////////////////////
    function _collideAB(S,a,b,bounce=true){
      let ret,d,m=_hitAB(S,a,b);
      if(m){
        if(b.m5.static){
          _V.sub$(a,m.overlapV)
        }else{
          d= _V.div(m.overlapV,2);
          _V.sub$(a,d);
          _V.add$(b,d);
        }
        bounce ? _bounceOff(a,b,m) : 0;
      }
      return m;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /*For common movement */
    ////////////////////////////////////////////////////////////////////////////
    function SteeringInfo(){
      return{
        wanderAngle: _.rand()*Math.PI*2,
        arrivalThreshold: 400,
        wanderDistance: 10,
        wanderRadius: 5,
        wanderRange: 1,
        avoidDistance: 400,
        inSightDistance: 200,
        tooCloseDistance: 60,
        maxForce: 5,
        pathIndex:  0
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //MODULE EXPORT
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      SomeColors:{},
      BtnColors:{},
      Geo,
      assets: ["boot/splash.jpg", "boot/star.png",
               "boot/audioOff.png", "boot/audioOn.png",
               "boot/unscii.fnt", "boot/doki.fnt", "boot/BIG_SHOUT_BOB.fnt"],
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      assertCenter(s){
        return _.assert(s?.anchor && _.feq(s.anchor.x,0.5) &&
                                     _.feq(s.anchor.y,0.5), "not center'ed") },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){
        return s && s.children.length == 0 },
      /**Emulate a button press
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} b
       * @param {number|string} clickedColor
       * @param {number|string} oldColor
       * @param {string} snd
       * @param {function} cb
       * @param {number} delayMillis
       * @return {function}
       */
      btnPress(b,c1,c0,snd,cb,delayMillis=343){
        const self=this;
        return function(arg){
          arg.tint=self.color(c1);
          snd ? Mojo.sound(snd).play() : 0;
          _.delay(delayMillis,()=>{ arg.tint=self.color(c0); cb(arg); })
        }
      },
      /**React to a one off click on canvas.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {string} snd
       * @return {function}
       */
      oneOffClick(cb,snd){
        const sub= function(){
          Mojo.Input.off(["single.tap"],sub);
          snd ? Mojo.sound(snd).play() : 0;
          cb();
        };
        Mojo.Input.on(["single.tap"],sub);
        return sub;
      },
      /**Cancel the a one off click.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @return {any} undefined
       */
      cancelOneOffClick(sub){
        sub ? Mojo.Input.off(["single.tap"],sub) : 0;
        return UNDEF;
      },
      /**Change size of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} w
       * @param {number} h
       * @return {Sprite} s
       */
      sizeXY(s,w,h){
        if(is.num(h)) s.height=h;
        if(is.num(w)) s.width=w;
        return s;
      },
      /**Set this as circular.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      asCircle(s){
        return (s.m5.circle=true) && s },
      /**Change scale factor of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      scaleXY(s, sx, sy){
        if(is.num(sx)) s.scale.x=sx;
        if(is.num(sy)) s.scale.y=sy;
        return s;
      },
      /**Change scale factor of sprite by a factor.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      scaleBy(s, sx, sy){
        if(is.num(sx)) s.scale.x *= sx;
        if(is.num(sy)) s.scale.y *= sy;
        return s;
      },
      /**Check if object is moving in x dir.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isVX(s){
        return !_.feq0(s.m5.vel[0]) },
      /**Check if object is moving in y dir.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isVY(s){
        return !_.feq0(s.m5.vel[1]) },
      /**Get the size of sprite, but halved.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {width,height}
       */
      halfSize(s){
        return {width: int(s.width/2), height: int(s.height/2)} },
      /**Set the anchor.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      anchorXY(s,x,y){
        _.assert(s.anchor,"sprite has no anchor object");
        s.anchor.y=  y ?? x;
        s.anchor.x=x;
        return s;
      },
      /**Set sprite's anchor to be at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      centerAnchor(s){
        return this.anchorXY(s,0.5,0.5) },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){
        return this.anchorXY(s,0,0) },
      /**Calc the offset required to find the position of corners
       * in the object.  e.g. anchor is centered, but you want to
       * find the bottome right.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} tx target x
       * @param {number} ty target y
       * @return {number[]} [x,y]
       */
      offsetXY(s,tx,ty){
        _.assert(s.anchor&&tx>=0&&tx<=1&&ty>=0&&ty<=1,
                 "no anchor or bad target offset points");
        return [s.width * (tx-s.anchor.x), s.height * (ty-s.anchor.y)]
      },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return this.offsetXY(s, 0,0) },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return this.offsetXY(s, 0.5,0.5) },
      /**Calc the offset required to make the object appear to be
       * at this target anchor.  e.g. say the object's anchor is
       * (1,1) and is positioned at (0,0), so the bottom right
       * corner is sitting at the origin.  But if you wanted the
       * top left to sit at origin, how much do you need to move
       * the object?
       * @param {Sprite} s
       * @param {number} tx target x
       * @param {number} ty target y
       * @return {number[]} [x,y]
       */
      adjOffsetXY(s,tx,ty){
        _.assert(s.anchor&&tx>=0&&tx<=1&&ty>=0&&ty<=1,
                 "no anchor or bad target offset points");
        return [s.width * (s.anchor.x - tx), s.height * (s.anchor.y - ty) ]
      },
      /**Make this sprite steerable.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      makeSteerable(s){
        if(s.width != s.height)
          Mojo.warn(`object ${s.m5?.uuid} is not a square, radius will be off....`);
        let {width,height}= this.halfSize(s);
        s.m5.steer=[0,0];
        s.m5.steerInfo=SteeringInfo();
        s.m5.radius=Math.sqrt(width*width+height*height);
        return s;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      updateSteer(s,reset=true){
        if(s.m5?.steer){
          _V.clamp$(s.m5.steer, 0, s.m5.steerInfo.maxForce);
          _V.div$(s.m5.steer,s.m5.mass);
          _V.add$(s.m5.vel, s.m5.steer);
          reset ? _V.mul$(s.m5.steer,0) : 0;
        }
        return s;
      },
      /**Clear spatial data.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      clrSpatial(s){
        if(s.m5?.sgrid){
          s.m5.sgrid.x1=UNDEF;
          s.m5.sgrid.x2=UNDEF;
          s.m5.sgrid.y1=UNDEF;
          s.m5.sgrid.y2=UNDEF;
        }
        return s;
      },
      /**Give some *mojo* to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      lift(s){
        if(!s.m5){
          const self=this;
          s.g={};
          s.m5={
            uuid: `s${_.nextId()}`,
            circle:false,
            stage:false,
            drag:false,
            dead:false,
            angVel:0,
            friction: _V.vec(1,1),
            gravity: _V.vec(),
            vel: _V.vec(),
            acc: _V.vec(),
            static:false,
            sensor:false,
            sgrid: {},
            mass:1,
            type: 0,
            cmask:0,
            speed:0,
            //maxSpeed:0,
            heading:Mojo.RIGHT,
            get invMass(){ return _.feq0(s.m5.mass)?0:1/s.m5.mass }
          };
          s.m5.resize=function(px,py,pw,ph){
            self.resize(s,px,py,pw,ph)
          };
          s.m5.getImageOffsets=function(){
            return {x1:0,x2:0,y1:0,y2:0}
          };
          s.m5.getContactPoints=function(){
            return _cornersCCW(s.anchor,s.width,s.height)
          };
          //these special functions are for quadtree
          s.getGuid=function(){ return s.m5.uuid };
          s.getSpatial=function(){ return s.m5.sgrid; };
          s.getBBox=function(){ return _.feq0(s.angle)?self.getAABB(s):self.boundingBox(s) };
        }
        return s;
      },
      /**Keep rotation in the range 0 - 2pi
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite}
       */
      clamp2Pi(s){
        while(s.rotation > PI2){ s.rotation -= PI2 }
        while(s.rotation < 0) { s.rotation += PI2 }
        return s;
      },
      /**Convert polar to cartesian
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {array} [cos,sin]
       */
      getHeading(s){
        return [Math.cos(s.rotation),Math.sin(s.rotation)]
      },
      /**Set the rotation value
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} v
       * @param {boolean} deg [false]
       * @return {Sprite} s
       */
      setOrient(s,v,deg=false){
        deg ? (s.angle=v) : (s.rotation=v);
        return s;
      },
      /**Convert sprite to a polygonal shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Polygon}
       */
      toPolygon(s){
        return new Geo.Polygon(s.m5.getContactPoints()).setOrient(s.rotation) },
      /**Convert sprite to a circular shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle}
       */
      toCircle(s){
        return this.assertCenter(s) &&
               new Geo.Circle(int(s.width/2)).setOrient(s.rotation) },
      /**For 2D physics, create a body.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Body}
       */
      toBody(s){
        let
          px=s.x,
          py=s.y,
          b=s.m5.circle ? this.toCircle(s) : this.toPolygon(s);
        return Geo.bodyWrap(b,px,py);
      },
      /**Get the PIXI global position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      gposXY(s){
        const {x,y}= s.getGlobalPosition();
        return _V.vec(x,y);
      },
      /**Check if sprite has anchor at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isTopLeft(s){
        return s.anchor ? _.feq0(s.anchor.x) && _.feq0(s.anchor.y) : true },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor? _.feq(s.anchor.x,0.5) && _.feq(s.anchor.y,0.5) : false },
      /**Get the center position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      centerXY(s){
        return this.isCenter(s) ? _V.vec(s.x,s.y) : _V.add(this.centerOffsetXY(s),s) },
      /**PIXI operation, setting type of scaling to be used.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {boolean} b
       * @return {Sprite} s
       */
      setScaleModeNearest(s,b=true){
        s.texture.source.scaleMode = b ? "nearest" : "linear";
        return s;
      },
      /**Find the angle in radians between two sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      angle(s1, s2){
        return _V.angle(this.centerXY(s1), this.centerXY(s2)) },
      /**Mark it as dead.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      die(s){
        return (s.m5.dead=true) && s; },
      /**Come back to life, from dead.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      undie(s){
        return (s.m5.dead=false) || s; },
      /**Move a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} dt
       * @return {Sprite} s
       */
      move(s,dt){
        if(dt){
          _V.add$(s.m5.vel,_V.mul(s.m5.gravity,dt));//deal with gravity
          _V.add$(s.m5.vel,_V.mul(s.m5.acc,dt));//deal with acceleration
          _V.mul$(s.m5.vel, s.m5.friction);//deal with friction
        }else{
          dt=1;
        }
        if(s.m5.maxSpeed !== undefined)
          _V.clamp$(s.m5.vel,0, s.m5.maxSpeed);
        //finally, update the sprite's x & y position
        return _V.add$(s,_V.mul(s.m5.vel,dt));
      },
      /**Get the left side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      leftSide(s){
        let
          x=s.x,
          w= s.width,
          ax= s.anchor ? s.anchor.x : 0;
        if(ax>0.7) x -= w;
        else if(ax>0) x -= int(w/2);
        return x;
      },
      /**Get the right side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      rightSide(s){
        return this.leftSide(s)+s.width },
      /**Get the top side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      topSide(s){
        let
          y= s.y,
          h= s.height,
          ay= s.anchor ? s.anchor.y : 0;
        if(ay>0.7) y -= h;
        else if(ay>0) y -= int(h/2);
        return y;
      },
      /**Get the bottom side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      bottomSide(s){
        // y-axis goes down, so bottom > top :)
        return this.topSide(s)+s.height },
      /**Get the sprite's bounding box, *ignoring* rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      getAABB(s){
        if(s.x1 !== undefined && s.y2 !== undefined){ return s }
        _.assert(s.m5, "bad sprite for getAABB");
        let
          {x1,y1,x2,y2}=s.m5.getImageOffsets(),
          l= this.leftSide(s),
          t= this.topSide(s),
          r=l+s.width,
          b=t+s.height;
        return { x1: l+x1 , y1: t+y1, x2: r-x2, y2: b-y2 }
      },
      /**Create a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} left
       * @param {number} right
       * @param {number} top
       * @param {number} bottom
       * @return {object} {x1,x2,y1,y2}
       */
      bbox4(left,right,top,bottom){
        return _.assert(top <= bottom,"bad bbox") &&
               {x1: left, x2: right, y1: top, y2: bottom} },
      /**Find the center of a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxCenter(b4){
        if(is.num(b4.x1))
          return _V.vec(_M.ndiv(b4.x1+b4.x2,2),
                        _M.ndiv(b4.y1+b4.y2,2)) },
      /**Frame this box.
       * @memberof module:mojoh5/Sprites
       * @param {object} g
       * @param {number} width
       * @param {string|number} color
       * @return {Sprite}
       */
      bboxFrame(g,width=16,color="#dedede"){
        _.assert(g.x1 !== undefined,"bad bounding box");
        let {x1,x2,y1,y2}= g,
          w=x2-x1,
          h=y2-y1,
          s,gfx= this.graphics();
        gfx.roundRect(0,0,w+width,h+width,int(width/4));
        gfx.stroke({width,color:this.color(color)});
        s=this.sprite(gfx);
        s.x=x1-width;
        s.y=y1-width;
        return s;
      },
      /**Find the size of the bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxSize(b4){
        return b4.x1 !== undefined ? _V.vec(b4.x2-b4.x1, b4.y2-b4.y1) : _.assert(false, "bad bounding box") },
      /**Check if point is inside this bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} x
       * @param {number} y
       * @param {object} {x1,x2,y1,y2}
       * @return {boolean}
       */
      pointInBBox(x,y,box){
        return box.x1 !== undefined && x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2 },
      /**Find the bounding box of a sprite, taking account of it's
       * current rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      boundingBox(s){
        if(!_.feq0(s.rotation))
          _.assert(this.isCenter(s),
                   "expected rotated obj with center-anchor");
        let c,z, x1,x2, y1,y2, x=[],y=[],
          hw=int(s.width/2),
          hh=int(s.height/2),
          theta=Math.tanh(hh/hw),
          H=Math.sqrt(hw*hw+hh*hh);
        //x2,y1
        z=PI2-theta + s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x2,y2
        z=theta+s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x1,y2
        z=Math.PI-theta + s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //x1,y1
        z=Math.PI+theta+s.rotation;
        y.push(H*Math.sin(z));
        x.push(H*Math.cos(z));
        //find min & max on x and y axis
        c=this.centerXY(s);
        y.sort((a,b) => a-b);
        x.sort((a,b) => a-b);
        //apply translation
        return {x1:int(x[0]+c[0]),
                x2:int(x[3]+c[0]),
                y1:int(y[0]+c[1]),
                y2:int(y[3]+c[1])}
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number} px
       * @param {number} py
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(px,py,s){
        const z=this.toBody(s);
        return s.m5.circle ? Geo.hitTestPointCircle(px,py,z)
                           : Geo.hitTestPointPolygon(px,py,z) },
      /**Find distance between these 2 sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      distance(s1, s2){
        return _V.dist(this.centerXY(s1), this.centerXY(s2)) },
      /**Scale all these sprites by the global scale factor.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} args
       * @return {any} undefined
       */
      scaleContent(...args){
        if(args.length==1&&is.vec(args[0])){ args=args[0] }
        const K=Mojo.getScaleFactor();
        args.forEach(s=>{ s.scale.x *=K; s.scale.y *=K; })
      },
      /**Scale this object to be as big as canvas.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      scaleToCanvas(s){
        s.height=Mojo.height;
        s.width= Mojo.width;
        return s;
      },
      /**Set the uuid of a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {any} id
       * @return {Sprite} s
       */
      uuid(s,id){
        s.m5.uuid=id; return s },
      /**Set the transparency of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} v
       * @return {Sprite} s
       */
      opacity(s,v){
        s.alpha=v; return s },
      /**Set a sprite's color(tint).
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number|string} color
       * @return {Sprite} s
       */
      tint(s,color){
        s.tint= this.color(color); return s },
      /**Unset a sprite's visibility.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      hide(s){
        return (s.visible=false) || s; },
      /**Set a sprite's visibility.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      show(s){
        return (s.visible=true) && s; },
      /**Set a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @param {any} v
       * @return {Sprite} s
       */
      pset(s,p,v){
        s.g[p]=v; return s },
      /**Get a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @return {any}
       */
      pget(s,p){ return s.g[p] },
      /**Create a new Container object.
       * @memberof module:mojoh5/Sprites
       * @param {callback} cb use to configure the container properties
       * @return {Container}
       */
      container(cb){
        const s= this.lift(new PIXI.Container());
        cb ? cb(s) : 0;
        return s;
      },
      /**Create a new Container object with these children.
       * @memberof module:mojoh5/Sprites
       * @param {...any} cs child objects
       * @return {Container}
       */
      group(...cs){
        if(cs.length==1&&is.vec(cs[0])){ cs=cs[0] }
        const C= this.container();
        cs.forEach(c=> C.addChild(c));
        return C;
      },
      /**Create a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {boolean} center
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      sprite(src, center=false,x=0,y=0){
        const s= this.lift(_sprite(src, o=> new PIXI.Sprite(o)));
        s.x=x;
        s.y=y;
        center ? this.centerAnchor(s) : 0;
        return _.inst(PIXI.AnimatedSprite,s) ? _exASprite(s) : s;
      },
      /**Create a sprite from a spritesheet frame.
       * @memberof module:mojoh5/Sprites
       * @param {string} sheet
       * @param {string} frame
       * @param {boolean} center
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      spriteFrame(sheet,frame,center=false,x=0,y=0){
        return this.sprite(Mojo.sheet(sheet,frame),center,x,y)
      },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @return {Sprite}
       */
      tilingSprite(src, width,height){
        return this.lift(_sprite(src, o=> new PIXI.TilingSprite({
          texture:o,
          width:width||o.width,
          height:height||o.height
        })))
      },
      /**Tile sprite repeatingly in x and/or y axis.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {boolean} rx
       * @param {boolean} ry
       * @param {number} width
       * @param {number} height
       * @return {Sprite}
       */
      repeatSprite(src,rx=true,ry=true,width=UNDEF,height=UNDEF){
        let self=this, s, out=[],x=0,y=0,w=0,h=0;
        function xx(){
          const s= self.lift(_sprite(src, o=> new PIXI.Sprite(o)));
          let K=Mojo.getScaleFactor();K=1;
          s.width *= K;
          s.height *= K;
          return s;
        }
        if(rx){
          while(w<width){
            out.push(s=xx());
            _V.set(s,x,y);
            w += s.width;
            x += s.width;
            if(w>=width && h<height && ry){
              h += s.height;
              y += s.height;
              x=0;
              w=0;
            }
          }
          ry=false;
        }
        if(ry){
          while(h<height){
            out.push(s=xx());
            _V.set(s,x,y);
            h += s.height;
            y += s.height;
            if(h>=height&& w< width && rx){
              w += s.width;
              x += s.width;
              y=0;
              h=0;
            }
          }
          rx=false;
        }
        return out;
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spacing
       * @return {AnimatedSprite}
       */
      animation(src, tileW, tileH, spacing=0){
        let t=Mojo.resource(src);
        if(!t)
          throw `SpriteError: ${src} not loaded.`;
        let
          cols = int(t.width/tileW),
          rows = int(t.height/tileH),
          pos= [], cells = cols*rows;
        for(let x,y,i=0; i<cells; ++i){
          x= (i%cols) * tileW;
          y= int(i/cols) * tileH;
          if(spacing>0){
            x += spacing + (spacing * i % cols);
            y += spacing + (spacing * int(i/cols));
          }
          pos.push(_V.vec(x,y));
        }
        return this.sprite(
          pos.map(p=> new PIXI.Texture({source: t.source,
                                        frame: new PIXI.Rectangle(p[0],p[1],tileW,tileH) })));
      },
      /**Create a PIXI.Texture from this source.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      frame(src, width, height,x,y){
        return this.sprite(new PIXI.Texture({source: Mojo.resource(src).source,
                                             frame: new PIXI.Rectangle(x, y, width,height)})) },
      /**Select a bunch of frames from image.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} width
       * @param {number} height
       * @param {number[][]} [[x,y]...]
       * @return {Texture[]}
       */
      frameSelect(src,width,height,selectors){
        return selectors.map(s=> new PIXI.Texture({source: Mojo.resource(src).source,
                                                   frame: new PIXI.Rectangle(s[0], s[1], width,height)})) },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} src
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spaceX
       * @param {number} spaceY
       * @param {number} sx
       * @param {number} sy
       * @return {Texture[]}
       */
      frames(src,tileW,tileH,spaceX=0,spaceY=0,sx=0,sy=0){
        let
          dx=tileW+spaceX,
          dy=tileH+spaceY,
          t= Mojo.resource(src),
          rows= int(t.height/dy),
          out=[], cols= _M.ndiv(t.width+spaceX,dx);
        for(let y,r=0;r<rows;++r){
          y= sy + tileH*r;
          for(let x,c=0;c<cols;++c){
            x= sx + tileW*c;
            out.push(new PIXI.Texture({source:t.source,
                                       frame:new PIXI.Rectangle(x, y, tileW,tileH)})) }
        }
        return out;
      },
      /**Cross reference these images to their corresponding textures.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {Texture[]}
       */
      frameImages(...pics){
        if(pics.length==1
          && is.vec(pics[0])){ pics=pics[0] }
        return pics.map(p=> Mojo.resource(p));
      },
      /**Create a PIXI AnimatedSprite from these images.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {AnimatedSprite}
       */
      spriteFrom(...pics){
        return this.sprite(this.frameImages(...pics)) },
      /**Create a PIXI.Text object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fspec
       * @param {number} x
       * @param {number} y
       * @return {Text}
       */
      text(msg,fspec, x=0, y=0){
        return _V.set(this.lift(new PIXI.Text(msg || "",fspec)),x,y) },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} msg
       * @param {object} fstyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(msg,name,size){
        //in pixi, no fontSize, defaults to 26, left-align
        let fstyle;
        if(is.str(name)){
          fstyle={fontFamily:name};
          if(is.num(size)) fstyle.fontSize=size;
        }else{
          fstyle=name;
        }
        if(!fstyle.fontFamily)
          fstyle.fontFamily= fstyle.fontName? fstyle.fontName : "unscii";
        if(!fstyle.align) fstyle.align="center";
        return this.lift(new PIXI.BitmapText({text:msg || "", style:fstyle}));
      },
      /**Create a triangle sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number} peak
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      triangle(width, height, peak,
               fillColor = 0xffffff,
               strokeColor = 0xffffff, lineWidth=0,x=0,y=0){
        let
          g=this.graphics(),
          a=1,w2=int(width/2),
          stroke=this.color(strokeColor),
          X= peak<0.5?0:(peak>0.5?width:w2);
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }
        }
        g.poly([0,0,X,-height,width,0]);
        if(fillColor !== false)
          g.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          g.stroke({width:lineWidth, color:stroke, alpha:1});
        let s= this.sprite(g);
        if(1){
          s.m5.getContactPoints= height<0 ?
            ()=>{ return [[X,-height],[width,0],[0,0]] }
            :
            ()=>{ return [[width,height],[X,0],[0,height]] }
        }
        return _V.set(s,x,y);
      },
      /**Create a rectangular sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {Sprite}
       */
      rect(width, height,
           fillColor = 0xffffff,
           strokeColor = 0xffffff, lineWidth=0){
        return this.sprite(this.rectTexture(width,height,fillColor,strokeColor,lineWidth)) },
      /**Draw a rectangle.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       * @return {PIXI.Graphics}
       */
      grect(gfx, x,y,width,height){
        gfx.rect(x,y,width,height); return gfx },
      /**Draw a circle.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {number} cx
       * @param {number} cy
       * @param {number} radius
       * @return {PIXI.Graphics}
       */
      gcircle(gfx, cx, cy, radius){
        gfx.circle(cx,cy,radius); return gfx },
      /**Fill graphics with texture.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {PIXI.Texture} t
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gfillEx(gfx, t, style){
        if(!style) style={};
        style.texture=t;
        gfx.texture(style);
        return gfx;
      },
      /**Clear graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @return {PIXI.Graphics}
       */
      gclear(gfx){
        return gfx.clear() },
      /**Draw a sequence of paths in graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {array} actions
       * @return {PIXI.Graphics}
       */
      gpath(gfx,actions){
        _.assert(is.vec(actions),"expected path actions!");
        actions.forEach(a=>{
          if(is.vec(a)){
            gfx[a.shift()].apply(gfx,a);
          }else if(is.str(a)){
            gfx[a]();
          }
        });
        return gfx;
      },
      /**Fill graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gfill(gfx, style){
        _.assert(is.obj(style),`expected fill style object`);
        gfx.fill(style);
        return gfx;
      },
      /**Stroke graphics.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Graphics} gfx
       * @param {object} style
       * @return {PIXI.Graphics}
       */
      gstroke(gfx,style){
        _.assert(is.obj(style),`expected stroke style object`);
        gfx.stroke(style);
        return gfx;
      },
      /**Create a rectangular texture.
       * @param {number} width
       * @param {number} height
       * @param {string|number} fillColor
       * @param {string|number} strokeColor
       * @param {number} lineWidth [0]
       * @return {PIXI.Texture}
       */
      rectTexture(width, height,
                  fillColor = 0xffffff, strokeColor = 0xffffff, lineWidth=0){
        let a,gfx=this.graphics();
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }else{
            a=1;
          }
        }
        gfx.rect(0, 0, width,height);
        if(fillColor !== false)
          gfx.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          gfx.stroke({width:lineWidth, color:this.color(strokeColor)});
        return this.genTexture(gfx)
      },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        const gfx = this.graphics();
        cb.apply(this, [gfx].concat(args));
        return this.lift(new PIXI.Sprite(this.genTexture(gfx))) },
      /**Create a circular sprite by generating a texture.
       * @memberof module:mojoh5/Sprites
       * @param {number} radius
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {Sprite}
       */
      circle(radius, fillColor=0xffffff, strokeColor=0xffffff, lineWidth=0){
        return this.circleEx(this.circleTexture(radius,fillColor, strokeColor,lineWidth))
      },
      /**Create a circular texture.
       * @param {number} radius
       * @param {number|string} fillColor
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @return {PIXI.Texture}
       */
      circleTexture(radius, fillColor=0xffffff, strokeColor=0xffffff, lineWidth=0){
        let a,gfx = this.graphics();
        if(fillColor !== false){
          if(is.vec(fillColor)){
            a=fillColor[1];
            fillColor=fillColor[0];
          }else{
            a=1;
          }
        }
        gfx.circle(0, 0, radius);
        if(fillColor !== false)
          gfx.fill({color:this.color(fillColor),alpha:a});
        if(lineWidth>0)
          gfx.stroke({width:lineWidth, color:this.color(strokeColor)});
        return this.genTexture(gfx)
      },
      /**Create a sprite from this texture.
       * @param {PIXI.Texture} t
       * @return {PIXI.Sprite}
       */
      circleEx(t){
        const s= this.lift(new PIXI.Sprite(t));
        return (s.m5.circle=true) && this.centerAnchor(s) },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeColor
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @param {number} alpha
       * @return {PIXI.Sprite}
       */
      line(strokeColor, lineWidth, A,B, alpha=1){
        let
          _a= _V.clone(A),
          _b= _V.clone(B),
          gfx = this.graphics(),
          s,stroke= this.color(strokeColor);
        function _draw(){
          gfx.clear();
          gfx.moveTo(_a[0], _a[1]);
          gfx.lineTo(_b[0], _b[1]);
          gfx.stroke({width:lineWidth, color:stroke, alpha});
        }
        _draw();
        s=this.lift(gfx);
        s.m5.ptA=function(x,y){
          if(x !== undefined){
            _a[0] = x; _a[1] = y ?? x; _draw(); } return _a; };
        s.m5.ptB=function(x,y){
          if(x !== undefined){
            _b[0] = x; _b[1] = y ?? x; _draw(); } return _b; };
        return s;
      },
      /**Check if a sprite is moving.
       * @memberof module:mojoh5/Sprites
       * @param {PIXI.Sprite}
       * @return {boolean}
       */
      isMoving(s){
        return !_.feq0(s.m5.vel[0]) || !_.feq0(s.m5.vel[1]) },
      /**Create a 2d grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} ex
       * @param {number} ey
       * @param {number} cellW
       * @param {number} cellH
       * @return {number[][]}
       */
      makeCells(sx,sy,ex,ey,cellW,cellH){
        let cols=_M.ndiv(ex-sx,cellW),
            rows=_M.ndiv(ey-sx,cellH);
        return _mkgrid(sx,sy,rows,cols,cellW,cellH) },
      /**Create a rectangular arena.
       * @memberof module:mojoh5/Sprites
       * @param {number} ratioX
       * @param {number} ratioY
       * @param {object} [parent]
       * @return {object}
       */
      gridBox(ratioX=0.9,ratioY=0.9,parent=UNDEF){
        let
          P= parent ?? Mojo,
          h=int(P.height*ratioY),
          w=int(P.width*ratioX),
          x1=_M.ndiv(P.width-w,2),
          y1=_M.ndiv(P.height-h,2);
        return {x1,y1,x2:x1+w,y2:y1+h};
      },
      /**Create a square grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dim
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridSQ(dim,ratio=0.9,out=UNDEF){
        let
          sz= ratio* (Mojo.height<Mojo.width?Mojo.height:Mojo.width),
          w=int(sz/dim), h=w;

        if(!_.isEven(w)){--w}
        h=w;
        sz=dim*w;

        let
          sy=_M.ndiv(Mojo.height-sz,2),
          sx=_M.ndiv(Mojo.width-sz,2),
          _x=sx,_y=sy;

        if(out){
          out.height=sz;
          out.width=sz;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
          //shove more info into out :)
          out.x1=sx; out.y1=sy;
          out.x2=sx+sz; out.y2=sy+sz;
        }
        return _mkgrid(_x,_y,dim,dim,w,h);
      },
      /**Divide a rectangular area.
       * @memberof module:mojoh5/Sprites
       * @param {number[]} [dimX,dimY]
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      divXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=UNDEF){
        let
          szh=int(Mojo.height*ratioY),
          szw=int(Mojo.width*ratioX),
          cw=int(szw/dimX),
          ch=int(szh/dimY),
          _x,_y,sy,sx;
        szh=dimY*ch;
        szw=dimX*cw;
        sy= _M.ndiv(Mojo.height-szh,2);
        sx= _M.ndiv(Mojo.width-szw,2);
        _x=sx,_y=sy;
        if(out){
          out.height=szh;
          out.width=szw;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
          //shove more info into out :)
          out.x1=sx; out.y1=sy;
          out.x2=sx+szw; out.y2=sy+szh;
        }
        return _mkgrid(_x,_y,dimY,dimX,cw,ch);
      },
      /**Create a rectangular grid.
       * @memberof module:mojoh5/Sprites
       * @param {number[]} [dimX,dimY]
       * @param {number} ratio
       * @param {object} [out]
       * @return {number[][]}
       */
      gridXY([dimX,dimY],ratioX=0.9,ratioY=0.9,out=UNDEF){
        let
          szh=int(Mojo.height*ratioY),
          szw=int(Mojo.width*ratioX),
          cw=int(szw/dimX),
          ch=int(szh/dimY),
          dim=cw>ch?ch:cw,
          _x,_y,sy,sx;

        if(!_.isEven(dim)){--dim}
        szh=dimY*dim;
        szw=dimX*dim;
        sy= _M.ndiv(Mojo.height-szh,2);
        sx= _M.ndiv(Mojo.width-szw,2);
        _x=sx,_y=sy;

        if(out){
          out.height=szh;
          out.width=szw;
          if(out.x !== undefined) _x=out.x;
          if(out.y !== undefined) _y=out.y;
          out.x=sx;
          out.y=sy;
          //shove more info into out :)
          out.x1=sx; out.y1=sy;
          out.x2=sx+szw; out.y2=sy+szh;
        }
        return _mkgrid(_x,_y,dimY,dimX,dim,dim);
      },
      /**Find the bounding box for this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number[][]} grid
       * @return {object} {x1,x2,y1,y2}
       */
      gridBBox(sx,sy,grid){
        let
          w=grid[0].length,
          f=grid[0][0],
          e=grid[grid.length-1][w-1];
        return {x1:sx+f.x1,
                x2:sx+e.x2, y1:sy+f.y1, y2:sy+e.y2} },
      /**Create a PIXI Graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} [id]
       * @return {PIXI.Graphics}
       */
      graphics(id=UNDEF){
        const ctx= new PIXI.Graphics();
        return (ctx.m5={uuid:`${id?id:_.nextId()}`}) && ctx },
      /**Draw borders around this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} width
       * @param {number} height
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBox(bbox,lineWidth=1,lineColor="white",ctx=UNDEF){
        if(!ctx)
          ctx= this.graphics();
        ctx.rect(bbox.x1,bbox.y1, bbox.x2-bbox.x1,bbox.y2-bbox.y1);
        ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        return ctx;
      },
      /**Draw borders around this grid, rounded corners.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number} width
       * @param {number} height
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBoxEx(bbox,lineWidth=1,lineColor="white",radius=1,ctx=UNDEF){
        if(!ctx)
          ctx= this.graphics();
        ctx.roundRect(bbox.x1,bbox.y1, bbox.x2-bbox.x1,bbox.y2-bbox.y1,radius);
        ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        return ctx;
      },
      /**Draw grid lines.
       * @memberof module:mojoh5/Sprites
       * @param {number} sx
       * @param {number} sy
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string|object} lineColor
       * @param {PIXI.Graphics} ctx
       * @return {PIXIGraphics}
       */
      drawGridLines(sx,sy,grid,lineWidth,lineColor,ctx=UNDEF){
        let
          h= grid.length,
          w= grid[0].length;
        if(!ctx)
          ctx= this.graphics();

        for(let r,y=1;y<h;++y){
          r=grid[y];
          ctx.moveTo(sx+r[0].x1,sy+r[0].y1);
          ctx.lineTo(sx+r[w-1].x2,sy+r[w-1].y1); }
        for(let r,x=1;x<w;++x){
          r=grid[0];
          ctx.moveTo(sx+r[x].x1,sy+r[x].y1);
          r=grid[h-1];
          ctx.lineTo(sx+r[x].x1,sy+r[x].y2); }

        if(is.obj(lineColor)){
          lineColor.color= this.color(lineColor.color||"white");
          lineColor.width=lineWidth;
          ctx.stroke(lineColor);
        }else{
          ctx.stroke({width:lineWidth,color:this.color(lineColor)});
        }
        return ctx;
      },
      /**Add more children to this container.
       * @memberof module:mojoh5/Sprites
       * @param {Container} par
       * @param {...any} children
       * @return {Container} parent
       */
      add(par, ...cs){
        cs.forEach(c=> c && par.addChild(c)); return par },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       */
      remove(...cs){
        if(cs.length==1 && is.vec(cs[0])){ cs=cs[0] }
        _.doseqEx(cs,s=>{
          if(s.parent)
            _.inst(Mojo.Scenes.Scene,s.parent) ? s.parent.remove(s) : s.parent.removeChild(s);
          Mojo.emit(["post.remove",s]);
          Mojo.off(s);
          s.m5.dispose?.();
        });
        return cs[0];
      },
      /**Center this object on the screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      centerObj(obj){
        let a=obj.anchor, cx= Mojo.width/2, cy=Mojo.height/2;
        let w2=obj.width/2, h2=obj.height/2;
        obj.x=cx;
        obj.y=cy;
        //handle containers, fake an anchor
        if(!a)
          a= {x:0,y:0};
        if(a.x<0.3) obj.x=cx-w2;
        if(a.x>0.7) obj.x=cx+w2;
        if(a.y<0.3) obj.y=cy-h2;
        if(a.y>0.7) obj.y=cy+h2;
        return obj;
      },
      /**Expand object to fill entire screen.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite|Container} obj
       * @return {Sprite|Container} obj
       */
      fillMax(obj){
        if(is.str(obj) || _.inst(PIXI.Texture,obj)){ obj=this.sprite(obj) }
        _.assert(_.inst(PIXI.Container,obj), "expected sprite");
        obj.height=Mojo.height;
        obj.width=Mojo.width;
        return this.centerObj(obj)
      },
      /**Convert color value to RGB(A) values.
       * @memberof module:mojoh5/Sprites
       * @param {string} c
       * @return {number[]}
       */
      colorToRgbA(c){//"#319bd5",
        _.assert(is.str(c) && c.length>0, "bad color string value");
        let r,lc=c.toLowerCase(), code=SomeColors[lc];
        if(lc == "transparent"){ return [0,0,0,0] }
        if(code){c=code}
        if(c[0]=="#"){
          //#RGB or #RGBA or #RRGGBB or #RRGGBBAA
          (r=c.split("")).shift();
          if(r.length==3) r.push("F");
          if(r.length==4){ r= r.flatMap(n=> [n,n]) }
          if(r.length==6){ r.push("F","F") }
          if(r.length==8){
            return [parseInt(r[0]+r[1],16), parseInt(r[2]+r[3],16),
                    parseInt(r[4]+r[5],16), parseInt(r[6]+r[7],16)/255]
          }
        }
        else if(lc.indexOf("rgb") == 0){
          //e.g. rgba(0,0,255,0.3)
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a })
        }
        //
        throw `Error: Bad color string: ${c}`
      },
      /**Turn a number (0-255) into a 2-character hex number (00-ff).
       * @memberof module:mojoh5/Sprites
       * @param {number} n
       * @return {string}
       */
      byteToHex(num){
        //grab last 2 digits
        return ("0"+num.toString(16)).slice(-2) },
      /**Convert any CSS color to a hex representation.
       * @memberof module:mojoh5/Sprites
       * @param {string} color
       * @return {string}
       */
      colorToHex(color){
        // Examples:
        // colorToHex('red')            # '#ff0000'
        // colorToHex('rgb(255, 0, 0)') # '#ff0000'
        const rgba = this.colorToRgbA(color);
        return "0x"+ [0,1,2].map(i=> this.byteToHex(rgba[i])).join("") },
      /**Convert RGB color to a decimal.
       * @memberof module:mojoh5/Sprites
       * @param {number} r
       * @param {number} g
       * @param {number} b
       * @return {number}
       */
      color3(r,g,b){
        return parseInt(["0x",this.byteToHex(r),this.byteToHex(g),this.byteToHex(b)].join("")) },
      /**Get the integer value of this color.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} value
       * @return {number} decimal value
       */
      color(value){
        return isNaN(value) ? parseInt(this.colorToHex(value)) : value },
      /**Get the integer value of this RGBA color.
       * @memberof module:mojoh5/Sprites
       * @param {array} arg
       * @return {number} decimal value
       */
      rgba(arg){
        _.assert(is.vec(arg),"wanted rgba array");
        return parseInt("0x"+ [0,1,2].map(i=> this.byteToHex(arg[i])).join("")) },
      /**
       * copied from https://github.com/less/less.js
      */
      hsla(h, s, l, a){
        function c1(v) { return Math.min(1, Math.max(0, v)) }
        function hue(h){
          h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
          if(h * 6 < 1){
            return m1_1 + (m2_1 - m1_1) * h * 6;
          }else if(h * 2 < 1){
            return m2_1;
          }else if(h * 3 < 2){
            return m1_1 + (m2_1 - m1_1) * (2 / 3 - h) * 6;
          }else{
            return m1_1;
          }
        }
        h = h % 360 / 360;
        s = c1(s);
        l = c1(l);
        a = c1(a);
        let m2_1 = l <= 0.5 ? l * (s + 1) : l + s - l * s,
            m1_1 = l * 2 - m2_1;
        return this.rgba([ hue(h + 1/3) * 255, hue(h) * 255, hue(h - 1/3) * 255, a ]);
      },
      /** @ignore */
      resize(s,px,py,pw,ph){
        //not sure this works :P
        s && _.doseqEx(s.children,c=>c.m5 && c.m5.resize?.(s.x,s.y,s.width,s.height)) },
      /**Put b on top of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinAbove(C,b,padY=10,alignX=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          y=boxA.y1-padY-(boxB.y2-boxB.y1),
          x= (alignX<0.3) ? boxA.x1
                          : (alignX<0.7 ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : (b.anchor.y<0.7 ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : (b.anchor.x<0.7 ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C)}
      },
      /**Place `b` below `C`.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinBelow(C,b,padY=10,alignX=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          y=boxA.y2+padY,
          x=(alignX<0.3) ? boxA.x1 : ((alignX<0.7) ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b at center of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       */
      pinCenter(C,b){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x=cxA-w2B,
          y=cyA-h2B;
        //adjust for anchors [0,0.5,1]
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(C.m5.stage || b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b left of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinLeft(C,b,padX=10,alignY=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x= boxA.x1 - padX - (boxB.x2-boxB.x1),
          y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Place b right of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinRight(C,b,padX=10,alignY=0.5){
        let
          [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C),
          [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C),
          x= boxA.x2 + padX,
          y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (!b.anchor || b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (!b.anchor || b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ _V.sub$(b,C) }
      },
      /**Assign some mass to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} m
       */
      setMass(s,m){ s.m5.mass=m },
      /**Create a Texture from a graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {object} displayObject
       * @param {number} scaleMode
       * @param {number} resolution
       * @param {object} region
       * @return {RenderTexture}
       */
      genTexture(displayObject, scaleMode, resolution, region){
        return _genTexture(displayObject, scaleMode, resolution, region) },
      /**Apply bounce to the objects in this manifold.
       * @memberof module:mojoh5/Sprites
       * @param {Manifold} m
       * @return {any} undefined
       */
      bounceOff(m){
        return _bounceOff(m.A,m.B,m) },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hit(a,b){
        const m= _hitAB(this,a,b);
        if(m){
          Mojo.emit(["hit",a],m);
          Mojo.emit(["hit",b],m.swap()) }
        return m;
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @param {boolean} bounce
       * @return {boolean}
       */
      collide(a,b, bounce=true){
        const m= _collideAB(this,a,b,bounce);
        return m && _collideDir(m);
      },
      /**Check if these 2 sprites is colliding.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} a
       * @param {Sprite} b
       * @return {Manifold}
       */
      hitTest(a,b){
        return _hitAB(this,a,b) },
      /**Use to contain a sprite with `x` and
       * `y` properties inside a rectangular area.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {Container} container
       * @param {boolean} [bounce]
       * @param {function} [extra]
       * @return {number[]} a list of collision points
       */
      clamp(s, container, bounce=false,extra=UNDEF){
        let
          box,C,
          left,right,top,bottom;
        if(is.vec(container)){
          left=container[1].left;
          right=container[1].right;
          top=container[1].top;
          bottom=container[1].bottom;
          container=container[0];
        }
        right= right!==false;
        left= left!==false;
        top= top!==false;
        bottom= bottom!==false;
        if(container instanceof Mojo.Scenes.Scene){
          C=Mojo.mockStage();
        }else if(container.m5 && container.m5.stage){
          C=container;
        }else if(container.x2 !== undefined &&
                 container.y2 !== undefined){
          C=container;
          box=true;
        }else{
          if(container.isSprite)
            _.assert(s.parent===container);
          else
            _.assert(false,"Error: clamp() using bad container");
          _.assert(_.feq0(container.rotation),"Error: clamp() container can't rotate");
          _.assert(_.feq0(container.anchor.x),"Error: clamp() container anchor.x !==0");
          _.assert(_.feq0(container.anchor.y),"Error: clamp() container anchor.y !==0");
          C=container;
        }
        let
          coff= box ? [0,0] : this.topLeftOffsetXY(C),
          collision = new Set(),
          CX=false,CY=false,
          R= this.getAABB(s),
          cl= box ? C.x1 : C.x+coff[0],
          cr= cl+ (box? C.x2-C.x1 : C.width),
          ct= box ? C.y1 : C.y+coff[1],
          cb= ct+ (box? C.y2-C.y1 : C.height);
        //left
        if(left && R.x1<cl){
          s.x += cl-R.x1;
          CX=true;
          collision.add(Mojo.LEFT);
        }
        //right
        if(right && (R.x2 > cr)){
          s.x -= R.x2- cr;
          CX=true;
          collision.add(Mojo.RIGHT);
        }
        //top
        if(top && R.y1 < ct){
          s.y += ct-R.y1;
          CY=true;
          collision.add(Mojo.TOP);
        }
        //bottom
        if(bottom && (R.y2 > cb)){
          s.y -= R.y2 - cb;
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
          collision=UNDEF
        }
        return collision;
      },
      /**
      */
      dbgShowDir(dir){
        let s="?";
        switch(dir){
          case Mojo.NE:
            s="top-right";
            break;
          case Mojo.NW:
            s="top-left";
            break;
          case Mojo.TOP:
          case Mojo.UP:
            s="top";
            break;
          case Mojo.LEFT:
            s="left";
            break;
          case Mojo.RIGHT:
            s="right";
            break;
          case Mojo.BOTTOM:
          case Mojo.DOWN:
            s="bottom";
            break;
          case Mojo.SE:
            s="bottom-right";
            break;
          case Mojo.SW:
            s="bottom-left";
            break;
        }
        return s;
      },
      /**
      */
      dbgShowCol(col){
        const out=[];
        if(is.set(col))
          for(let i of col.values())
            out.push(this.dbgShowDir(i));
        return out.join(",");
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //aliases
    _$.bmpText=_$.bitmapText;
    _.doseq(SomeColors,(v,k)=>{ _$.SomeColors[k]= _$.color(v) });
    _.doseq(BtnColors,(v,k)=>{ _$.BtnColors[k]= _$.color(v) });
    return (Mojo.Sprites= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sprites"]=function(M){
      return M.Sprites ? M.Sprites : _module(M)
    }
  }

})(this);



