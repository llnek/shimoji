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

  /**Create the module.
   */
  function _module(Mojo, Shaker){

    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const _V=gscope["io/czlab/mcfud/vec2"]();
    const {ute:_, is, dom, EventBus} =Mojo;
    const ABC=Math.abs,
          MFL=Math.floor;

    /** @ignore */
    function _genTexture(displayObject, scaleMode, resolution, region){
      region = region || displayObject.getLocalBounds(null, true);
      //minimum texture size is 1x1, 0x0 will throw an error
      if(region.width === 0){ region.width = 1 }
      if(region.height === 0){ region.height = 1 }
      let mat=PIXI.Matrix.TEMP_MATRIX,
        renderTexture = PIXI.RenderTexture.create({
        width: region.width | 0,
        height: region.height | 0,
        scaleMode: scaleMode,
        resolution: resolution
      });
      mat.tx = -region.x;
      mat.ty = -region.y;
      Mojo.ctx.render(displayObject, renderTexture, false, mat, !!displayObject.parent);
      return renderTexture;
    }

    //ensure PIXI doesnt have special properties
    (function(c,g,s){
      g.clear();
      g.beginFill(0);
      g.drawCircle(0, 0, 4);
      g.endFill();
      s=new PIXI.Sprite(_genTexture(g));
      ["m5","tiled",
       "collideAB",
       "getGuid","getBBox",
       "getSpatial","getSpatialGrid"].forEach(n=>{
        [[c,"Container"],[g,"Graphics"],[s,"Sprite"]].forEach(x=>{
          _.assertNot(_.has(x[0],n),`PIXI ${x[1]} has ${n} property!`)
        })
      });
    })(new PIXI.Container(),new PIXI.Graphics());

    /**
     * @module mojoh5/Sprites
     */

    //------------------------------------------------------------------------
    //create aliases for various PIXI objects
    _.inject(Mojo, {PXMatrix:PIXI.Matrix.TEMP_MATRIX,
                    PXRTexture:PIXI.RenderTexture,
                    PXRect:PIXI.Rectangle,
                    PXBText:PIXI.BitmapText,
                    PXSprite:PIXI.Sprite,
                    PXGraphics:PIXI.Graphics,
                    PXText:PIXI.Text,
                    PXTSprite:PIXI.TilingSprite,
                    PXASprite:PIXI.AnimatedSprite,
                    PXPContainer:PIXI.ParticleContainer});

    /** @ignore */
    function _sa(a){ return `${a.x},${a.y}` }

    /** @ignore */
    function _corners(a,w,h){
      let r,
          v=_V.vec,
          w2=MFL(w/2),
          h2=MFL(h/2);
      switch(a){
      case "0,0":
        r=[v(0,h), v(w,h), v(w,0), v()];
      break;
      case "0.5,0":
        r=[ v(-w2,h), v(w2,h), v(w2,0), v(-w2,0)];
      break;
      case "1,0":
        r=[ v(-w,h), v(0,h), v(), v(-w,0)];
      break;
      case "0,0.5":
        r=[ v(0,h2), v(w,h2), v(w,-h2), v(0,-h2)];
      break;
      case "0.5,0.5":
        r=[ v(-w2,h2), v(w2,h2), v(w2,-h2), v(-w2,-h2)];
      break;
      case "1,0.5":
        r=[ v(-w,h2), v(0,h2), v(0,-h2), v(-w,-h2)];
      break;
      case "0,1":
        r=[ v(), v(w,0), v(w,-h), v(0,-h)];
      break;
      case "0.5,1":
        r=[ v(-w2,0), v(w2,0), v(w2,-h), v(-w2,-h)];
      break;
      case "1,1":
        r=[ v(-w,0), v(), v(0,-h), v(-w,-h)];
      break;
      default:
        _.assert(false,"Error: bad anchor values: "+a);
      }
      return r
    }

    /**Mixin registry.
    */
    const _mixins= _.jsMap();

    /** @ignore */
    class Mixin{
      constructor(){}
    }

    /** @ignore */
    function _mixinAdd(s,name,f){
      _.assert(!_.has(s,name),`Error: ${name} not available.`);
      //call f to create the mixin object
      const o= f(s);
      s[name]=o;
      o.name=name;
      o.mixinName= "."+name;
      return s;
    }

    /**Add more to an AnimatedSprite.
     * @ignore
     */
    function _exASprite(s){
      let tmID,
          //[start,end,cnt,total]
          //[0,    1,  2,  3]
          _state=[0,0,0,0];
      function _reset(){
        if(s.m5.animating){
          tmID = _.clear(tmID);
          _.setVec(_state,0,0,0,0); }
        s.m5.animating = false;
      }
      function _adv(){
        if(_state[2] < _state[3]+1){
          s.gotoAndStop(s.currentFrame+1);
          _state[2] += 1;
        }else if(s.loop){
          s.gotoAndStop(_state[0]);
          _state[2]=1;
        }
      }
      _.inject(s.m5,{
        showFrame(f){
          _reset();
          s.gotoAndStop(f)
        },
        playFrames(seq){
          _reset();
          _state[0]=0;
          _state[1]= s.totalFrames-1;
          if(is.vec(seq) && seq.length>1){
            _state[0]=seq[0];
            _state[1]=seq[1]; }
          _state[3]=_state[1]-_state[0];
          s.gotoAndStop(_state[0]);
          _state[2]=1;
          if(!s.m5.animating){
            s.m5.animating = true;
            tmID = _.timer(_adv, 1000/12, true);
          }
        },
        stopFrames(){
          s.m5.showFrame(s.currentFrame)
        }
      });
      return s;
    }

    /**Low level sprite creation. */
    function _sprite(source,ctor){
      let s,obj;
      if(_.inst(Mojo.PXTexture,source)){
        obj=source
      }else if(is.vec(source)){
        s=Mojo.animFromVec(source)
      }else if(is.str(source)){
        obj= Mojo.tcached(source) ||
             Mojo.textureFromImage(source)
      }
      if(obj){s=ctor(obj)}
      if(!s)
        throw `Error: ${source} not found`;
      return _.assertNot(_.has(s,"m5")||_.has(s,"g"),"found m5,g properties") && s;
    }

    /** @ignore */
    function _mkgrid(sx,sy,rows,cols,cellW,cellH){
      const out=[];
      let y1=sy,
          x1=sx;
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

    /** @ignore */
    function _pininfo(X,o,p){
      let box=o.m5.stage ? {x1:0,y1:0,x2:Mojo.width,y2:Mojo.height} : X.getBBox(o);
      if(o.parent===p){
        box.x1 += p.x;
        box.x2 += p.x;
        box.y1 += p.y;
        box.y2 += p.y;
      }
      return [box, MFL((box.x2-box.x1)/2),//half width
                   MFL((box.y2-box.y1)/2),//half height
                   MFL((box.x1+box.x2)/2),//center x
                   MFL((box.y1+box.y2)/2)]//centery
    }

    const _$={
      /**Check if sprite is centered.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       */
      assertCenter(s){
        return _.assert(s.anchor.x>0.3 && s.anchor.x<0.7 &&
                        s.anchor.y>0.3 && s.anchor.y<0.7, "not center'ed")
      },
      /**Check if sprite has children.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      empty(s){ return s.children.length === 0 },
      /**Reposition the sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      setXY(s,x,y){ s.x=x; s.y= _.or(y,x); return s },
      /**Change size of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} w
       * @param {number} h
       * @return {Sprite} s
       */
      setSize(s,w,h){ s.width=w; s.height= _.or(h,w); return s },
      /**Change scale factor of sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} sx
       * @param {number} sy
       * @return {Sprite} s
       */
      setScale(s, sx, sy){ s.scale.set(sx,_.or(sy,sx)); return s },
      /**Change sprite's anchor position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} x
       * @param {number} y
       * @return {Sprite} s
       */
      setAnchor(s,x,y){ s.anchor.set(x,_.or(y,x)); return s },
      /**Get the size of sprite, but halved.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {width,height}
       */
      halfSize(s){ return {width:MFL(s.width/2), height:MFL(s.height/2)} },
      /**Set sprite's anchor to be at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      centerAnchor(s){ s.anchor.set(0.5,0.5); return s },
      /**Set sprite's anchor to be at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      topLeftAnchor(s){ s.anchor.set(0,0); return s },
      /**Get sprite's anchor offset from top-left corner.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      topLeftOffsetXY(s){
        return _V.vec(-MFL(s.width*s.anchor.x),
                      -MFL(s.height*s.anchor.y))
      },
      /**Get sprite's anchor offset from center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number[]} [x,y]
       */
      centerOffsetXY(s){
        return _V.vec(MFL(s.width/2) - MFL(s.anchor.x*s.width),
                      MFL(s.height/2) - MFL(s.anchor.y*s.height))
      },

      /**Extend a sprite with extra methods.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Sprite} s
       */
      extend(s){
        //m5 holds all mojoh5 extensions
        //g placeholder for user stuff
        if(!s.m5) s.m5={};
        if(!s.g) s.g={};
        let self=this,
            _uuid= _.nextId(),
            _angVel= 0,
            _speed=0,
            _cmask=0,
            _type=0,
            _mass=1,
            _invMass=1,
            _sensor=false,
            _static= false,
            _stage= false,
            _dead= false,
            _drag= false,
            _circular= false,
            _vel= _V.vec(),
            _acc= _V.vec(),
            _gravity= _V.vec(),
            _friction= _V.vec();
        _.inject(s.m5, {sgrid: {}, contacts:[]},
                       {get uuid() {return _uuid},
                        set uuid(n){_uuid=n},
                        get type() {return _type},
                        set type(x){_type=x},
                        get cmask(){return _cmask},
                        set cmask(m){_cmask=m},
                        get speed() {return _speed},
                        set speed(s){_speed=s},
                        get static() {return _static},
                        set static(b) {_static=b},
                        get sensor() {return _sensor},
                        set sensor(b) {_sensor=b},
                        get invMass() {return _invMass},
                        get mass() {return _mass},
                        set mass(m) {_mass=m; _invMass=_.feq0(m)?0:1/m},
                        get gravity(){return _gravity},
                        get friction(){return _friction},
                        get vel() {return _vel},
                        get acc() {return _acc},
                        get angVel() {return _angVel},
                        set angVel(v) {_angVel=v},
                        get stage(){return _stage},
                        set stage(b){_stage=b},
                        get dead() {return _dead},
                        set dead(x) {_dead=true},
                        get circular() {return _circular},
                        set circular(x) {_circular=true},
                        get drag(){return _drag},
                        set drag(b){_drag=b},
                        get dead(){ return _dead },
                        set dead(x){ _dead=true },
                        resize(px,py,pw,ph){self.resize(s,px,py,pw,ph)},
                        getContactPoints(){ return _corners(_sa(s.anchor),s.width,s.height) }});
        s.getBBox=function(){ return self.boundingBox(s) };
        s.getGuid=function(){ return s.m5.uuid };
        s.getSpatial=function(){ return s.m5.sgrid; }
        return s;
      },
      /**Define a mixin.
       * @memberof module:mojoh5/Sprites
       * @param {string} name
       * @param {function} body
       */
      defMixin(name,body){
        if(_.has(_mixins,name))
          throw `Error: mixin: "${name}" already defined.`;
        _.assert(is.fun(body),"mixin must be a function");
        _.assoc(_mixins,name, body);
      },
      /**Add these mixins to the sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {...string} fs names of mixins
       * @return {Sprite} s
       */
      addMixin(s,...fs){
        fs.forEach(n=> _mixinAdd(s,n, _mixins.get(n)))
        return s;
      },
      /**Convert sprite to a polygonal shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Polygon}
       */
      toPolygon(s){
        let g=this.gposXY(s),
            ps=s.m5.getContactPoints(),
            p=new Geo.Polygon(g[0],g[1]).setOrient(s.rotation).set(ps);
        _V.reclaim(g);
        return p;
      },
      /**Convert sprite to a circular shape.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Circle}
       */
      toCircle(s){
        this.assertCenter(s);
        let r=MFL(s.width/2),
            g=this.gposXY(s),
            p= new Geo.Circle(r).setPos(g[0],g[1]).setOrient(s.rotation);
        _V.reclaim(g);
        return p;
      },
      /**Get the PIXI global position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      gposXY(s){
        const p= s.getGlobalPosition();
        return _V.vec(p.x,p.y)
      },
      /**Check if sprite has anchor at it's top left.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isTopLeft(s){
        return s.anchor.x < 0.3 && s.anchor.y < 0.3
      },
      /**Check if sprite has anchor at it's center.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {boolean}
       */
      isCenter(s){
        return s.anchor.x > 0.3 && s.anchor.x < 0.7 &&
               s.anchor.y > 0.3 && s.anchor.y < 0.7;
      },
      /**Get the center position.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {Vec2} [x,y]
       */
      centerXY(s){
        let r,
            x=s.x,
            y=s.y;
        if(this.isCenter(s)){
          r=_V.vec(x,y)
        }else{
          let a= this.centerOffsetXY(s);
          r= _V.vec(x+a[0], y+a[1]);
          _V.reclaim(a);
        }
        return r;
      },
      /**PIXI operation, setting type of scaling to be used.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {boolean} b
       * @return {Sprite} s
       */
      setScaleModeNearest(s,b){
        s.texture.baseTexture.scaleMode = b ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR;
        return s;
      },
      /**Find the angle in radians between two sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      angle(s1, s2){
        let v2=this.centerXY(s2),
            v1=this.centerXY(s1),
            r= Math.atan2(v2[1] - v1[1], v2[0] - v1[0]);
        _V.reclaim(v2,v1);
        return r;
      },
      /**Move a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} dt
       * @return {Sprite} s
       */
      move(s,dt){
        dt=_.or(dt,1);
        s.x += s.m5.vel[0] * dt;
        s.y += s.m5.vel[1] * dt;
        return s;
      },
      /**Get the left side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      leftSide(s){
        let x=s.x,
            w= s.width,
            ax= s.anchor.x;
        if(ax>0.7) x -= w;
        else if(ax>0) x -= MFL(w/2);
        return x;
      },
      /**Get the right side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      rightSide(s){ return this.leftSide(s)+s.width },
      /**Get the top side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      topSide(s){
        let y= s.y,
            h= s.height,
            ay= s.anchor.y;
        if(ay>0.7) y -= h;
        else if(ay>0) y -= MFL(h/2);
        return y;
      },
      /**Get the bottom side of this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {number}
       */
      bottomSide(s){ return this.topSide(s)+s.height },
      /**Get the sprite's bounding box, *ignoring* rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      getBBox(s){
        let r= {x1: this.leftSide(s),
                x2: this.rightSide(s),
                y1: this.topSide(s),
                y2: this.bottomSide(s)};
        if(!(r.y1 <= r.y2)){
          _.assert(false,"bbox bad y values");
        }
        return r;
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
        _.assert(top <= bottom);
        return {x1: left, x2: right, y1: top, y2: bottom}
      },
      /**Find the center of a bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxCenter(b4){
        if(is.num(b4.x1))
          return _V.vec(MFL((b4.x1+b4.x2)/2), MFL((b4.y1+b4.y2)/2))
      },
      /**Find the size of the bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {object} b4
       * @return {Vec2} [x,y]
       */
      bboxSize(b4){
        return _V.vec(b4.x2-b4.x1, b4.y2-b4.y1)
      },
      /**Check if point is inside this bounding box.
       * @memberof module:mojoh5/Sprites
       * @param {number} x
       * @param {number} y
       * @param {object} {x1,x2,y1,y2}
       * @return {boolean}
       */
      pointInBBox(x,y,box){
        return x > box.x1 && x < box.x2 && y > box.y1 && y < box.y2
      },
      /**Find the bounding box of a sprite, taking account of it's
       * current rotation.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @return {object} {x1,x2,y1,y2}
       */
      boundingBox(s){
        let c,z,
            x1,x2,
            y1,y2,
            x=[],y=[],
            hw=MFL(s.width/2),
            hh=MFL(s.height/2),
            theta=Math.tanh(hh/hw),
            H=Math.sqrt(hw*hw+hh*hh);
        //x2,y1
        z=Math.PI*2-theta + s.rotation;
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
        y.sort((a, b) => a - b);
        x.sort((a, b) => a - b);
        x1=MFL(x[0]+c[0]);
        x2=MFL(x[3]+c[0]);
        y1=MFL(y[0]+c[1]);
        y2=MFL(y[3]+c[1]);
        _V.reclaim(c);
        return {x1,x2,y1,y2};
      },
      /**Check if point is inside this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Vec2} point
       * @param {Sprite} s
       * @return {boolean}
       */
      hitTestPoint(point, s){
        return s.m5.circular ? Geo.hitTestPointCircle(point, this.toCircle(s))
                             : Geo.hitTestPointPolygon(point, this.toPolygon(s))
      },
      /**Check if there’s clear line of sight between two sprites.
       * memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} obstacles
       * @param {number} segment
       * @return {boolean}
       */
      lineOfSight(s1, s2, obstacles, segment=32){
        let s1c=this.centerXY(s1),
            s2c=this.centerXY(s2),
            v= _V.vecAB(s1c,s2c),
            dist= _V.len(v),
            u= _V.div(v,dist),
            pt= _V.vec(),
            bad=false;
        for(let mag,z= dist/segment,i=1; i<=z && !bad; ++i){
          mag = segment*i;
          pt[0]= s1c[0] + u[0] * mag;
          pt[1]= s1c[1] + u[1] * mag;
          bad= obstacles.some(o=> this.hitTestPoint(pt, o));
        }
        _V.reclaim(u,v,pt,s1c,s2c);
        return !bad;
      },
      /**Find distance between these 2 sprites.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @return {number}
       */
      distance(s1, s2){
        let c2=this.centerXY(s2),
            c1=this.centerXY(s1),
            r= _V.dist(c1,c2);
        _V.reclaim(c1,c2);
        return r;
      },
      /** @ignore */
      update(dt){
        _.rseq(Shaker, s=> s.m5.updateShake && s.m5.updateShake(dt))
      },
      /**Scale all these sprites by the global scale factor.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} args
       */
      scaleContent(...args){
        if(args.length===1&&is.vec(args[0])){ args=args[0] }
        let f=Mojo.contentScaleFactor();
        args.forEach(s=>{
          s.scale.x=f.width;
          s.scale.y=f.height;
        })
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
      uuid(s,id){ s.m5.uuid=id; return s },
      /**Set a user defined property.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {string} p property name
       * @param {any} v
       * @return {Sprite} s
       */
      pset(s,p,v){ s.g[p]=v; return s },
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
        let s= new Mojo.PXContainer();
        _.assertNot(_.has(s,"m5")||_.has(s,"g"),"found m5+g properties");
        s= this.extend(s);
        cb && cb(s);
        return s;
      },
      /**Create a sprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} x
       * @param {number} y
       * @param {boolean} center
       * @return {Sprite}
       */
      sprite(source, center=false,x=0,y=0){
        let s= _sprite(source, o=> new Mojo.PXSprite(o));
        center && s.anchor.set(0.5,0.5);
        s=this.setXY(this.extend(s),x,y);
        return _.inst(Mojo.PXASprite,s) ? _exASprite(s) : s
      },
      /**Create a TilingSprite.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      tilingSprite(source, center=false,x=0,y=0){
        let s= _sprite(source,o=> new Mojo.PXTSprite(o));
        center && s.anchor.set(0.5,0.5);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spacing
       * @return {Sprite}
       */
      animation(source, tileW, tileH, spacing = 0){
        let _frames=(src, w, h, pts)=>{
          return pts.map(p=> new Mojo.PXTexture(src.baseTexture,
                                                new Mojo.PXRect(p[0],p[1],w,h))) };
        let t=Mojo.tcached(source);
        if(!t)
          throw `Error: ${source} not loaded.`;
        let cols = MFL(t.width/tileW),
            rows = MFL(t.height/tileH),
            cells = cols*rows,
            pos= [];
        for(let x,y,i=0; i<cells; ++i){
          x= (i%cols) * tileW;
          y= MFL(i/cols) * tileH;
          if(spacing>0){
            x += spacing + (spacing * i % cols);
            y += spacing + (spacing * MFL(i/cols));
          }
          pos.push(_V.vec(x,y));
        }
        let ret= _frames(t, tileW, tileH,pos);
        _V.reclaim(...pos);
        return this.sprite(ret);
      },
      /**Create a PIXI.Texture from this source.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} width
       * @param {number} height
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      frame(source, width, height,x,y){
        const t= Mojo.tcached(source);
        return this.sprite(new Mojo.PXTexture(t.baseTexture,new Mojo.PXRect(x, y, width,height)));
      },
      /**Select a bunch of frames from image.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} width
       * @param {number} height
       * @param {number[][]} [[x,y]...]
       * @return {Texture[]}
       */
      frameSelect(source,width,height,selectors){
        const t= Mojo.tcached(source);
        return selectors.map(s=> new Mojo.PXTexture(t.baseTexture,
                                                    new Mojo.PXRect(s[0], s[1], width,height)));
      },
      /**Create a sequence of frames from this texture.
       * @memberof module:mojoh5/Sprites
       * @param {any} source
       * @param {number} tileW
       * @param {number} tileH
       * @param {number} spaceX
       * @param {number} spaceY
       * @param {number} sx
       * @param {number} sy
       * @return {Texture[]}
       */
      frames(source,tileW,tileH,spaceX=0,spaceY=0,sx=0,sy=0){
        let t= Mojo.tcached(source),
            dx=tileW+spaceX,
            dy=tileH+spaceY,
            out=[],
            rows= MFL(t.height/dy),
            cols= MFL((t.width+spaceX)/dx);
        for(let y,r=0;r<rows;++r){
          y= sy + tileH*r;
          for(let x,c=0;c<cols;++c){
            x= sx + tileW*c;
            out.push(new Mojo.PXTexture(t.baseTexture,
                                        new Mojo.PXRect(x, y, tileW,tileH)));
          }
        }
        return out;
      },
      /**Cross reference these images to their corresponding textures.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {Texture[]}
       */
      frameImages(...pics){
        if(pics.length===1 && is.vec(pics[0])){ pics=pics[0] }
        return pics.map(p=> Mojo.tcached(p))
      },
      /**Create a PIXI AnimatedSprite from these images.
       * @memberof module:mojoh5/Sprites
       * @param {...any} pics
       * @return {AnimatedSprite}
       */
      spriteFrom(...pics){ return this.sprite(this.frameImages(pics)) },
      /**Create a PIXI.Text object.
       * @memberof module:mojoh5/Sprites
       * @param {string} content
       * @param {object} fontSpec
       * @param {number} x
       * @param {number} y
       * @return {Text}
       */
      text(content,fontSpec, x=0, y=0){
        let s=new Mojo.PXText(content,fontSpec);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a PIXI.BitmapText object.
       * @memberof module:mojoh5/Sprites
       * @param {string} content
       * @param {object} fontStyle
       * @param {number} x
       * @param {number} y
       * @return {BitmapText}
       */
      bitmapText(content, fontStyle, x=0, y=0){
        let s= new Mojo.PXBText(content,fontStyle);
        return this.setXY(this.extend(s),x,y);
      },
      /**Create a rectangular sprite by generating a texture object.
       * @memberof module:mojoh5/Sprites
       * @param {number} width
       * @param {number} height
       * @param {number|string} fillStyle
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      rectangle(width, height,
                fillStyle = 0xFF3300,
                strokeStyle = 0x0033CC, lineWidth=0, x=0, y=0){
        let g=new Mojo.PXGraphics(),
            gprops={width:width,
                    height:height,
                    lineW:lineWidth,
                    fill: this.color(fillStyle),
                    stroke: this.color(strokeStyle) },
            draw=function(){
              g.clear();
              g.beginFill(gprops.fill);
              if(gprops.lineW>0)
                g.lineStyle(gprops.lineW, gprops.stroke, 1);
              g.drawRect(0, 0, gprops.width, gprops.height);
              g.endFill();
              return g;
            };
        draw();
        let s= new Mojo.PXSprite(this.genTexture(g));
        s=this.setXY(this.extend(s),x,y);
        s.m5.fillStyle=(v)=>{
          if(v !== undefined){
            gprops.fill= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.fill;
        };
        s.m5.strokeStyle=(v)=>{
          if(v !== undefined){
            gprops.stroke= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.stroke;
        };
        s.m5.lineWidth=(v)=>{
          if(v !== undefined){
            gprops.lineW= v;
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.lineW;
        };
        return s;
      },
      /**Create a sprite by applying a drawing routine to the graphics object.
       * @memberof module:mojoh5/Sprites
       * @param {function} cb
       * @param {...any} args
       * @return {Sprite}
       */
      drawBody(cb,...args){
        let g = new Mojo.PXGraphics();
        cb.apply(this, [g].concat(args));
        return this.extend(new Mojo.PXSprite(this.genTexture(g)))
      },
      /**Create a circular sprite by generating a texture.
       * @memberof module:mojoh5/Sprites
       * @param {number} radius
       * @param {number|string} fillStyle
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      circle(radius,
             fillStyle=0xFF3300,
             strokeStyle=0x0033CC, lineWidth=0, x=0, y=0){
        let g = new Mojo.PXGraphics(),
            gprops={radius: radius,
                    lineW: lineWidth,
                    fill: this.color(fillStyle),
                    stroke: this.color(strokeStyle) },
            draw=function(){
              g.clear();
              g.beginFill(gprops.fill);
              if(gprops.lineW>0)
                g.lineStyle(grops.lineW, gprops.stroke, 1);
              g.drawCircle(0, 0, gprops.radius);
              g.endFill();
              return g;
            };
        draw();
        let s= new Mojo.PXSprite(this.genTexture(g));
        s=this.setXY(this.extend(s),x,y);
        s.anchor.set(0.5);
        s.m5.circular=true;
        s.m5.fillStyle=(v)=>{
          if(v !== undefined){
            gprops.fill= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.fill;
        };
        s.m5.strokeStyle=(v)=>{
          if(v !== undefined){
            gprops.stroke= this.color(v);
            s.texture = draw() && this.genTexture(g);
          }
          return gprops.stroke;
        };
        return s;
      },
      /**Create a line sprite.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} strokeStyle
       * @param {number} lineWidth
       * @param {Vec2} A
       * @param {Vec2} B
       * @return {Sprite}
       */
      line(strokeStyle, lineWidth, A,B){
        let g = new Mojo.PXGraphics(),
            gprops={A: _V.clone(A),
                    B: _V.clone(B),
                    lineW: lineWidth,
                    stroke: this.color(strokeStyle) },
            draw=function(){
              g.clear();
              g.lineStyle(gprops.lineW, gprops.stroke, 1);
              g.moveTo(gprops.A[0], gprops.A[1]);
              g.lineTo(gprops.B[0], gprops.B[1]);
            };
        draw();
        let s=this.extend(g);
        s.m5.ptA=function(x,y){
          if(x !== undefined){
            gprops.A[0] = x;
            gprops.A[1] = _.or(y,x);
            draw();
          }
          return gprops.A;
        };
        s.m5.ptB=function(x,y){
          if(x !== undefined){
            gprops.B[0] = x;
            gprops.B[1] = _.or(y,x);
            draw();
          }
          return gprops.B;
        };
        s.m5.lineWidth=function(v){
          if(v !== undefined){
            gprops.lineW= v;
            draw();
          }
          return gprops.lineW;
        };
        s.m5.strokeStyle=(v)=>{
          if(v !== undefined){
            gprops.stroke= this.color(v);
            draw();
          }
          return gprops.stroke;
        };
        return s;
      },
      /**Check if a sprite is moving.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite}
       * @return {boolean}
       */
      moving(s){
        return !_.feq0(s.m5.vel[0]) || !_.feq0(s.m5.vel[1])
      },
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
        let cols=MFL((ex-sx)/cellW),
            rows=MFL((ey-sx)/cellH);
        return _mkgrid(sx,sy,rows,cols,cellW,cellH);
      },
      /**Create a square grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dim
       * @param {number} ration
       */
      gridSQ(dim,ratio=0.6){
        let sz= ratio* (Mojo.height<Mojo.width ?Mojo.height:Mojo.width),
            w=MFL(sz/dim),
            h=w,
            sy=MFL((Mojo.height-sz)/2),
            sx=MFL((Mojo.width-sz)/2);
        return _mkgrid(sx,sy,dim,dim,w,h);
      },
      /**Create a rectangular grid.
       * @memberof module:mojoh5/Sprites
       * @param {number} dimX
       * @param {number} dimY
       * @param {number} ratio
       * @return {number[][]}
       */
      gridXY(dimX,dimY,ratio=4/5){
        let szh=MFL(Mojo.height*ratio),
            szw=MFL(Mojo.width*ratio),
            z=MFL(szw>szh ? (szh/dimY) : (szw/dimX)),
            sy= MFL((Mojo.height-(z*dimY))/2),
            sx= MFL((Mojo.width-(z*dimX))/2);
        return _mkgrid(sx,sy,dimY,dimX,z,z);
      },
      /**Draw borders around this grid.
       * @memberof module:mojoh5/Sprites
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridBox(grid,lineWidth,lineColor){
        let ctx= new Mojo.PXGraphics(),
            gf = grid[0][0], //topleft
            n=grid[0].length,
            gl = grid[grid.length-1][n-1]; //btmright
        ctx.lineStyle(lineWidth,this.color(lineColor));
        ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
        return ctx;
      },
      /**Draw grid lines.
       * @memberof module:mojoh5/Sprites
       * @param {number[][]} grid
       * @param {number} lineWidth
       * @param {number|string} lineColor
       * @return {PIXIGraphics}
       */
      drawGridLines(grid,lineWidth,lineColor){
        let ctx= new Mojo.PXGraphics(),
            h= grid.length,
            w= grid[0].length;
        ctx.lineStyle(lineWidth,this.color(lineColor));
        for(let r,y=1;y<h;++y){
          r=grid[y];
          ctx.moveTo(r[0].x1,r[0].y1);
          ctx.lineTo(r[w-1].x2,r[w-1].y1);
        }
        for(let r,x=1;x<w;++x){
          r=grid[0];
          ctx.moveTo(r[x].x1,r[x].y1);
          r=grid[h-1];
          ctx.lineTo(r[x].x1,r[x].y2);
        }
        return ctx;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      grid(cols, rows, cellW, cellH,
           centerCell, xOffset, yOffset, spriteCtor, extra){
        let len= cols*rows,
            cw2=MFL(cellW/2),
            ch2=MFL(cellH/2),
            C= this.container();
        for(let s,x,y,i=0; i<len; ++i){
          x = (i%cols) * cellW;
          y = MFL(i/cols) * cellH;
          s= spriteCtor();
          C.addChild(s);
          s.x = x + xOffset;
          s.y = y + yOffset;
          if(centerCell){
            s.x += cw2 - MFL(s.width/2);
            s.y += ch2 - MFL(s.height/2);
          }
          extra && extra(s);
        }
        return C;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      shoot(shooter, angle, container,
            bulletSpeed, bulletArray, bulletCtor,x,y){
        let soff=this.topLeftOffsetXY(shooter);
        let b= this.extend(bulletCtor());
        container.addChild(b);
        b.x= shooter.x+soff[0]+x;
        b.y= shooter.y+soff[1]+y;
        b.m5.vel[0] = Math.cos(angle) * bulletSpeed;
        b.m5.vel[1] = Math.sin(angle) * bulletSpeed;
        bulletArray.push(b);
        _V.reclaim(soff);
        return shooter;
      },
      /**
       * @memberof module:mojoh5/Sprites
       * @return {}
       */
      shake(s, magnitude=16, angular=false){
        let numberOfShakes=10,
            self = this,
            counter=1,
            startX = s.x,
            startY = s.y,
            startAngle = s.rotation,
            //Divide the magnitude into 10 units so that you can
            //reduce the amount of shake by 10 percent each frame
            magnitudeUnit = MFL(magnitude / numberOfShakes);
        function _upAndDownShake(){
          if(counter<numberOfShakes){
            s.x = startX;
            s.y = startY;
            magnitude -= magnitudeUnit;
            s.x += _.randInt2(-magnitude, magnitude);
            s.y += _.randInt2(-magnitude, magnitude);
            ++counter;
          }
          if(counter >= numberOfShakes){
            s.x = startX;
            s.y = startY;
            _.disj(Shaker,s);
          }
        }
        let tiltAngle = 1;
        function _angularShake(){
          if(counter<numberOfShakes){
            s.rotation = startAngle;
            magnitude -= magnitudeUnit;
            s.rotation = magnitude * tiltAngle;
            ++counter;
            //yoyo it
            tiltAngle *= -1;
          }
          if(counter >= numberOfShakes){
            s.rotation = startAngle;
            _.disj(Shaker,s);
          }
        }
        if(!_.has(Shaker,s)){
          Shaker.push(s);
          s.updateShake = () => angular ? _angularShake() : _upAndDownShake();
        }
      },
      /**Group a bunch of sprites together.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       * @return {Container}
       */
      group(...cs){
        if(cs.length===1 && is.vec(cs[0])){ cs=cs[0] }
        return this.container(c=> cs.forEach(s=> c.addChild(s)))
      },
      /**Add more children to this container.
       * @memberof module:mojoh5/Sprites
       * @param {Container} parent
       * @param {...any} children
       * @return {Container} parent
       */
      add(parent,...cs){
        cs.forEach(c=> c && parent.addChild(c));
        return parent;
      },
      /**Remove these sprites, will detach from their parents.
       * @memberof module:mojoh5/Sprites
       * @param {...Sprite} sprites
       */
      remove(...cs){
        if(cs.length===1 && is.vec(cs[0])){ cs=cs[0] }
        _.doseqEx(cs,s=>{
          if(s.parent)
            s.parent.removeChild(s);
          s.m5.dispose &&
            s.m5.dispose();
          EventBus.pub(["post.remove",s]);
        });
      },
      colorToRgbA(c){
        if(!c||!is.str(c)||c.length===0){return}
        let lc=c.toLowerCase(),
            code=SomeColors[lc];
        if(code){c=code}
        if(c[0]==="#"){
          if(c.length<7)
            c=`#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}${c.length>4?(c[4]+c[4]):""}`;
          return [parseInt(c.substr(1, 2), 16),
                  parseInt(c.substr(3, 2), 16),
                  parseInt(c.substr(5, 2), 16),
                  c.length>7 ? parseInt(c.substr(7, 2), 16)/255 : 1];
        }
        if(lc == "transparent"){ return [0,0,0,0] }
        if(lc.indexOf("rgb") === 0){
          if(lc.indexOf("rgba")<0){lc += ",1"}
          return lc.match(/[\.\d]+/g).map(a=> { return +a });
        }else{
          throw `Error: Bad color: ${c}`
        }
      },
      /**Turn a number (0-255) into a 2-character hex number (00-ff).
       * @memberof module:mojoh5/Sprites
       * @param {number} n
       * @return {string}
       */
      byteToHex(num){
        //grab last 2 digits
        return ("0"+num.toString(16)).slice(-2)
      },
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
        return "0x"+ [0,1,2].map(i=> this.byteToHex(rgba[i])).join("");
      },
      /**Get the integer value of this color.
       * @memberof module:mojoh5/Sprites
       * @param {number|string} value
       * @return {number}
       */
      color(value){
        return isNaN(value) ? parseInt(this.colorToHex(value)) : value
      },
      /** @ignore */
      resize(s,px,py,pw,ph){
        s && _.doseqEx(s.children,c=> c.m5&&c.m5.resize&&c.m5.resize(s.x,s.y,s.width,s.height))
      },
      /**Put b on top of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinTop(C,b,padY=10,alignX=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let y=boxA.y1-padY-(boxB.y2-boxB.y1);
        let x= (alignX<0.3) ? boxA.x1
                            : (alignX<0.7 ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : (b.anchor.y<0.7 ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : (b.anchor.x<0.7 ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ b.x -= C.x; b.y -= C.y; }
      },
      /**Place `b` below `C`.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padY
       * @param {number} alignX
       */
      pinBottom(C,b,padY=10,alignX=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let y=boxA.y2+padY;
        let x=(alignX<0.3) ? boxA.x1 : ((alignX<0.7) ? cxA-w2B : boxA.x2-(boxB.x2-boxB.x1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ b.x -= C.x; b.y -= C.y; }
      },
      /**Place b at center of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       */
      pinCenter(C,b){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x=cxA-w2B;
        let y=cyA-h2B;
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ b.x -= C.x; b.y -= C.y; }
      },
      /**Place b left of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinLeft(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x= boxA.x1 - padX - (boxB.x2-boxB.x1);
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ b.x -= C.x; b.y -= C.y; }
      },
      /**Place b right of C.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} C
       * @param {Sprite} b
       * @param {number} padX
       * @param {number} alignY
       */
      pinRight(C,b,padX=10,alignY=0.5){
        let [boxA,w2A,h2A,cxA,cyA] = _pininfo(this,C);
        let [boxB,w2B,h2B,cxB,cyB] = _pininfo(this,b,C);
        let x= boxA.x2 + padX;
        let y= (alignY<0.3) ? boxA.y1 : ((alignY<0.7) ? cyA-h2B : boxA.y2-(boxB.y2-boxB.y1));
        //adjust for anchors [0,0.5,1]
        b.y= (b.anchor.y<0.3) ? y : ((b.anchor.y<0.7) ? y+h2B : y+(boxB.y2-boxB.y1));
        b.x= (b.anchor.x<0.3) ? x : ((b.anchor.x<0.7) ? x+w2B : x+(boxB.x2-boxB.x1));
        if(b.parent===C){ b.x -= C.x; b.y -= C.y; }
      },
      /**Assign some mass to this sprite.
       * @memberof module:mojoh5/Sprites
       * @param {Sprite} s
       * @param {number} m
       */
      setMass(s,m){
        s.m5.mass=m;
        s.m5.invMass= _.feq0(m) ? 0 : 1/m;
      },
      /**Copied from pixi.legacy, why didn't they want to keep this????
       * so useful!
       * @memberof module:mojoh5/Sprites
       * @param {object} displayObject
       * @param {number} scaleMode
       * @param {number} resolution
       * @param {object} region
       * @return {RenderTexture}
       */
      genTexture(displayObject, scaleMode, resolution, region){
        return _genTexture(displayObject, scaleMode, resolution, region)
      }
    };

    return (Mojo.Sprites= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module==="object" && module.exports){
    throw "Fatal: browser only"
  }else{
    gscope["io/czlab/mojoh5/Sprites"]=function(M){
      return M.Sprites ? M.Sprites : _module(M,[])
    }
  }

})(this);



