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
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

;(function(global){
  "use strict";
  //export--------------------------------------------------------------------
  if(typeof module === "object" &&
     module && typeof module.exports === "object"){
    global=module.exports;
  }
  else if(typeof exports === "object" && exports){
    global=exports;
  }
  /**
   * @private
   * @function
   */
  function _module(Mojo, WIPShakers){
    const Core=global["io.czlab.mcfud.core"]();
    const Geo=global["io.czlab.mcfud.geo2d"]();
    const _M=global["io.czlab.mcfud.math"]();
    const _V=global["io.czlab.mcfud.vec2"]();
    const _=Core.u;
    const is=Core.is;
    const dom=Core.dom;
    //------------------------------------------------------------------------
    //create aliases for various PIXI objects
    _.inject(Mojo, {PXMatrix:PIXI.Matrix.TEMP_MATRIX,
                    PXRTexture:PIXI.RenderTexture,
                    PXRectangle:PIXI.Rectangle,
                    PXBText:PIXI.BitmapText,
                    PXSprite:PIXI.Sprite,
                    PXGraphics:PIXI.Graphics,
                    PXText:PIXI.Text,
                    PXTSprite:PIXI.TilingSprite,
                    PXASprite:PIXI.AnimatedSprite,
                    PXPContainer:PIXI.ParticleContainer});
    const _S={
      assertAnchorCenter(s){
        _.assert(s.anchor.x>0.3 && s.anchor.x<0.7, "anchor not in center")
      },
      empty(s){ return s.children.length === 0 },
      setXY(s,x,y){ s.x = x; s.y = y; return s },
      setSize(s,x,y){
        s.width = x;
        s.height = y===undefined ? x : y;
        return s
      },
      setScale(s, sx, sy){
        s.scale && s.scale.set(sx,sy);
        return s
      },
      setAnchor(s,x,y){
        s.anchor && s.anchor.set(x,y);
        return s
      },
      setPivot(s,x,y){
        s.pivot && s.pivot.set(x,y);
        return s
      },
      halfSize(s){ return _V.V2(s.width/2,s.height/2) },
      centerAnchor(s){ s.anchor.set(0.5,0.5); return s },
      anchorOffsetXY(s){
        return s.anchor ? _V.V2(s.width*s.anchor.x,
                                s.height*s.anchor.y) : _V.V2()
      },
      extend(s){
        if(!s.mojoh5) s.mojoh5={};
        if(!s.g) s.g={};
        _.inject(s.mojoh5, {uuid: _.nextId(),
                            _cur: {},
                            _prv: {},
                            static: false,
                            layer: 0,
                            mass: 1,
                            invMass: 1,
                            gravity: _V.V2(),
                            friction: _V.V2(),
                            vel: _V.V2(),
                            acc: _V.V2(),
                            collisions: [],
                            angVel: 0,
                            stage: false,
                            dead: false,
                            circular: false,
                            interact: false, draggable: false });
        s.mojoh5.csize=[s.width,s.height];
        s.mojoh5.addMixin=function(n,o){
          _.assert(!_.has(s,n),`Error: ${n} not available.`);
          let b= s[n]= _.inject({},o);
          b.added(s);
        };
        s.mojoh5.resize=function(px,py,pw,ph){_S.resize(s)};
        s.mojoh5.getContactPoints=function(){
          return _corners(_strAnchor(s.anchor),s.width,s.height)
        };
        return s;
      }
    };
    /**
     * @private
     * @function
     */
    function _strAnchor(a){ return `${a.x},${a.y}` }
    /**
     * @private
     * @function
     */
    function _corners(a,w,h){
      let v=_V.V2;
      let w2=w/2;
      let h2=h/2;
      let R=[];
      switch(a){
      case "0,0":
        _.conj(R, v(0,h), v(w,h), v(w,0), v());
      break;
      case "0.5,0":
        _.conj(R, v(-w2,h), v(w2,h), v(w2,0), v(-w2,0));
      break;
      case "1,0":
        _.conj(R, v(-w,h), v(0,h), v(), v(-w,0));
      break;
      case "0,0.5":
        _.conj(R, v(0,h2), v(w,h2), v(w,-h2), v(0,-h2));
      break;
      case "0.5,0.5":
        _.conj(R, v(-w2,h2), v(w2,h2), v(w2,-h2), v(-w2,-h2));
      break;
      case "1,0.5":
        _.conj(R, v(-w,h2), v(0,h2), v(0,-h2), v(-w,-h2));
      break;
      case "0,1":
        _.conj(R, v(), v(w,0), v(w,-h), v(0,-h));
      break;
      case "0.5,1":
        _.conj(R, v(-w2,0), v(w2,0), v(w2,-h), v(-w2,-h));
      break;
      case "1,1":
        _.conj(R, v(-w,0), v(), v(0,-h), v(-w,-h));
      break;
      default:
        _.assert(false,"Error: bad anchor values: "+a);
      }
      return R
    }
    const _mixins= _.jsMap();
    class Mixin{
      constructor(){
      }
    }
    /**
     * @public
     * @function
     */
    Mojo.defMixin=function(name,body){
      if(_.has(_mixins,name))
        throw `Error: mixin: "${name}" already defined.`;
      _.assoc(_mixins,name, body);
    };
    function _addMixin(s,name,f){
      _.assert(!_.has(s,name),`Error: ${name} not available.`);
      let o= f(s);
      s[name]=o;
      o.name=name;
      o.mixinName= "."+name;
      return s;
    }
    /**
     * @public
     * @function
     */
    Mojo.addMixin=function(obj,...fs){
      _.assert(obj.mojoh5,`Error: obj is not mojoh5-extended`);
      fs.forEach(n=>{
        let b= _mixins.get(n);
        _.assert(is.fun(b),`Error: Invalid mixin ${n}`);
        _addMixin(obj,n,b);
      })
      return obj
    };
    /**
     * @public
     * @function
     */
    _S.toPolygon=function(s, global=true){
      let C=s.mojoh5.getContactPoints()
      let cx=s.x;
      let cy=s.y;
      if(global){
        let g=this.gposXY(s);
        cx=g[0];
        cy=g[1];
        _V.dropV2(g);
      }
      //flip reverse since Geo uses RHS system
      let p= new Geo.Polygon(cx,cy).setOrient(s.rotation).set(C);
      return p;
    };
    /**
     * @public
     * @function
     */
    _S.toCircle=function(s, global=true){
      this.assertAnchorCenter(s);
      let c= this.centerXY(s,global);
      let r=s.width/2;
      let p= new Geo.Circle(r).setPos(c[0],c[1]).setOrient(s.rotation);
      _V.dropV2(c);
      return p;
    };
    /**
     * @public
     * @function
     */
    _S.gposXY=function(s){
      let p= s.getGlobalPosition();
      return _V.V2(p.x,p.y)
    };
    /**
     * @public
     * @function
     */
    _S.centerXY=function(s,global=false){
      let a= this.anchorOffsetXY(s);
      let x=s.x;
      let y=s.y;
      if(global){
        let g=s.getGlobalPosition();
        x=g.x;
        y=g.y;
      }
      let r= _V.V2(x-a[0] + (s.width/2),
                   y-a[1] + (s.height/2));
      _V.dropV2(a);
      return r;
    };
    /**
     * @public
     * @function
     */
    _S.setScaleModeNearest=function(s,v){
      _.assert(s.texture.baseTexture, "Error: no baseTexture");
      s.texture.baseTexture.scaleMode = v ? PIXI.SCALE_MODES.NEAREST : PIXI.SCALE_MODES.LINEAR;
      return s;
    };
    /**
     * @public
     * @function
     */
    _S.layer=function(s,v){
      if(v !== undefined){
        s.mojoh5.layer = v;
        //sort ascending
        if(s.parent)
          s.parent.children.sort((a, b) => a.mojoh5.layer - b.mojoh5.layer)
      }
      return s.mojoh5.layer
    };
    /**
     * @public
     * @function
     */
    _S.interact=function(s,v){
      if(v !== undefined){
        if(v){
          s.mojoh5.interact = true;
          if(!s.mojoh5.interact)
            Mojo.Input.makeButton(s);
        }else if(s.mojoh5.interact){
          s.mojoh5.interact = false;
          Mojo.Input.removeButton(s);
        }
      }
      return s.mojoh5.interact
    };
    /**
     * @public
     * @function
     */
    _S.draggable=function(s,v){
      if(v !== undefined){
        if(v){
          if(!s.mojoh5.draggable)
            Mojo.makeDraggable(s);
        }else{
          Mojo.makeUndraggable(s);
        }
        s.mojoh5.draggable = v;
      }
      return s.mojoh5.draggable
    };
    /**
     * @public
     * @function
     */
    _S.circular=function(s,v){
      if(v!==undefined){
        s.mojoh5.circular=v
        if(v)
          s.anchor.set(0.5);
      }
      return s.mojoh5.circular
    };
    /**
     * @public
     * @function
     */
    _S.diameter=function(s){
      return s.mojoh5.circular ? s.width : undefined
    };
    /**
     * @public
     * @function
     */
    _S.radius=function(s,r){
      if(s.mojoh5.circular && r !== undefined){
        s.width=r*2;
        s.height=s.width;
      }
      return s.mojoh5.circular ? s.width/2 : undefined;
    };
    /**
     * @private
     * @function
     */
    function _exASprite(s){
      let total= 0;
      let start= 0;
      let end= 0;
      let cnt = 0;
      let tmID;
      function _reset(){
        if(s.mojoh5.animating){
          tmID = _.clear(tmID);
          start=end=total=0;
          cnt=0;
          s.mojoh5.animating = false;
        }
      }
      function _advanceFrame(){
        //console.log(`in advance frame ${cnt}`);
        if(cnt < total+1){
          s.gotoAndStop(s.currentFrame+1);
          cnt += 1;
        }else if(s.loop){
          s.gotoAndStop(start);
          cnt = 1;
        }
      }
      _.inject(s.mojoh5, {
        showFrame(f){
          _reset();
          s.gotoAndStop(f)
        },
        stopFrames(){
          s.mojoh5.showFrame(s.currentFrame)
        },
        playFrames(seq){
          _reset();
          start= 0;
          end= s.totalFrames-1;
          if(seq){
            start= seq[0];
            end= seq[1];
          }
          total= end- start;
          s.gotoAndStop(start);
          cnt=1;
          if(!s.mojoh5.animating){
            s.mojoh5.animating = true;
            tmID = _.timer(_advanceFrame, 1000/(s.mojoh5.fps||12), true);
          }
        }
      });
      return s;
    }
    /**
     * Make a sprite ease to the position of another sprite.
     * @public
     * @function
     */
    _S.followEase=function(follower, leader, global=false, speed=0.3){
      let a=this.centerXY(follower,global);
      let b=this.centerXY(leader,global);
      let d= _V.makeVecAB(a,b)
      //move the follower if it's too far off
      if(_V.vecLen2(d) >= 4){
        follower.x += d[0] * speed;
        follower.y += d[1] * speed;
      }
      _V.dropV2(d);
    };
    /**
     * Make a sprite move towards another sprite at a constant speed.
     * @public
     * @function
     */
    _S.followConstant=function(follower, leader, global=false,speed=3){
      let a=this.centerXY(follower,global);
      let b=this.centerXY(leader,global);
      let d=_V.makeVecAB(a,b);
      let dist2= _V.vecLen2(d);
      //move the follower if it's too far off
      if(dist2 >= (speed*speed)){
        let n=Math.sqrt(dist2);
        follower.x += speed * d[0] / n;
        follower.y += speed * d[1] / n;
      }
      _V.dropV2(d,a,b);
    };
    /**
     * @public
     * @function
     * @returns the angle in radians between two sprites.
     */
    _S.angle=function(s1, s2, global=false){
      let v2=this.centerXY(s2,global);
      let v1=this.centerXY(s1,global);
      let r= Math.atan2(v2[1] - v1[1], v2[0] - v1[0]);
      _V.dropV2(v2,v1);
      return r;
    };
    /**
     * Make a sprite rotate around another sprite.
     * @public
     * @function
     */
    _S.rotateAroundSprite=function(rotatingS, centerS, dist, angle){
      let c=this.centerXY(centerS);
      let r=this.centerXY(rotatingS);
      rotatingS.x = c[0] - rotatingS.parent.x + (dist * Math.cos(angle)) - r[0];
      rotatingS.y = c[1] - rotatingS.parent.y + (dist * Math.sin(angle)) - r[1];
      _V.dropV2(c,r);
    };
    /**
     * Make a point rotate around another point.
     * @public
     * @function
     */
    _S.rotateAroundPoint=function(point, distX, distY, angle){
      return _V.V2(point[0] + Math.cos(angle) * distX,
                   point[1] + Math.sin(angle) * distY)
    };
    /**
     * @public
     * @function
     */
    _S.move=function(s,dt){
      if(dt === undefined) dt=1;
      s.x += s.mojoh5.vel[0] * dt;
      s.y += s.mojoh5.vel[1] * dt;
      return s;
    };
    /**
     * @public
     * @function
     */
    _S.leftSide=function(s,global=false){
      let x= global ? s.getGlobalPosition().x : s.x;
      let a= s.anchor ? s.anchor.x : null;
      let w= s.width;
      if(is.num(a)){
        if(a>0.7) x -= w;
        else if(a>0) x -= w/2;
      }
      return x;
    };
    /**
     * @public
     * @function
     */
    _S.rightSide=function(s,global=false){
      /*
      let x= global ? s.getGlobalPosition().x : s.x;
      let a= s.anchor ? s.anchor.x : null;
      let w= s.width;
      if(is.num(a)){
        if(a > 0.7) {}
        else if(a > 0) x += w/2;
        else x += w;
      }else{
        x += w;
      }
      return x;
      */
      return this.leftSide(s,global)+s.width;
    };
    /**
     * @public
     * @function
     */
    _S.topSide=function(s,global=false){
      let y= global ? s.getGlobalPosition().y : s.y;
      let a= s.anchor ? s.anchor.y : null;
      let h= s.height;
      if(is.num(a)){
        if(a > 0.7) y -= h;
        else if(a > 0) y -= h/2;
      }
      return y;
    };
    /**
     * @public
     * @function
     */
    _S.bottomSide=function(s,global=false){
      /*
      let y= global ? s.getGlobalPosition().y : s.y;
      let a= s.anchor ? s.anchor.y : null;
      let h= s.height;
      if(is.num(a)){
        if(a > 0.7) {}
        else if(a > 0) y += h/2;
        else y += h;
      }else{
        y += h;
      }
      return y;
      */
      return this.topSide(s,global)+s.height;
    };
    /**
     * @public
     * @function
     */
    _S.getBBox=function(s,global=false){
      let r= {x1: this.leftSide(s,global),
              x2: this.rightSide(s,global),
              y1: this.topSide(s,global),
              y2: this.bottomSide(s,global) };
      _.assert(r.y1 <= r.y2);
      return r;
    };
    /**
     * @public
     * @function
     */
    _S.bbox4=function(left,right,top,bottom){
      _.assert(top <= bottom);
      return {x1: left, x2: right, y1: top, y2: bottom}
    };
    /**
     * @public
     * @function
     */
    _S.bboxCenter=function(b4){
      if(is.num(b4.x1))
        return _.v2(b4.x1+(b4.x2-b4.x1)/2,b4.y1+(b4.y2-b4.y1)/2)
    };
    /**
     * @public
     * @function
     */
    _S.bboxSize=function(b4){
      return _.v2(b4.x2-b4.x1, b4.y2-b4.y1)
    };
    /**
     * @public
     * @function
     */
    _S.pointInBBox=function(pt,box){
      return pt.x > box.x1 && pt.x < box.x2 && pt.y > box.y1 && pt.y < box.y2
    };
    /**
     * @see https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
     * @private
     * @function
     */
    function _pointInPoly(testx,testy,points){
      let nvert=points.length;
      let c = false;
      for(let p,q, i=0, j=nvert-1; i<nvert;){
        p=points[i];
        q=points[j];
        if(((p[1]>testy) !== (q[1]>testy)) &&
          (testx < (q[0]-p[0]) * (testy-p[1]) / (q[1]-p[1]) + p[0])) c = !c;
        j=i;
        ++i;
      }
      return c
    }
    /**
     * @public
     * @function
     */
    _S.hitTestPoint=function(point, s, global=false){
      let hit;
      if(s.mojoh5.circular){
        let c= this.centerXY(s,global);
        let d= _V.makeVAB(c,point);
        let r= this.radius(s);
        hit= _V.vecLen2(d) < r*r;
        _V.dropV2(c,d);
      }else{
        let p= this.toPolygon(s,global);
        let ps= _V.translate(p.pos,p.calcPoints);
        hit= _pointInPoly(point[0],point[1],ps);
        _V.dropV2(...ps);
      }
      return hit;
    };
    /**
     * @public
     * @function
     * @returns `true` if there’s clear line of sight between two sprites.
     */
    _S.lineOfSight=function(s1, s2, obstacles, global=false,segment = 32){
      let s1c=this.centerXY(s1,false);
      let s2c=this.centerXY(s2,false);
      let v= _V.makeVecAB(s1c,s2c)
      let dist= _V.vecLen(v);
      let u = _V.vecDiv(v,dist);
      let pt= _V.V2();
      let bad=false;
      for(let mag,z= dist/segment,i=1; i<=z && !bad; ++i){
        mag = segment*i;
        pt[0]= s1c[0] + u[0] * mag;
        pt[1]= s1c[1] + u[1] * mag;
        bad= obstacles.some(o => _S.hitTestPoint(pt, o));
      }
      _V.dropV2(u,v,pt,s1c,s2c);
      return !bad;
    };
    /**
     * Find the distance in pixels between two sprites.
     * @public
     * @function
     */
    _S.distance=function(s1, s2, global=false){
      let c2=this.centerXY(s2,global);
      let c1=this.centerXY(s1,global);
      let r= _V.vecDist(c1,c2);
      _V.dropV2(c1,c2);
      return r;
    };
    /**
     * @public
     * @function
     */
    _S.update=function(dt){
      _.rseq(WIPShakers, s => s.mojoh5.updateShake && s.mojoh5.updateShake(dt))
    };
    /**
     * @public
     * @function
     */
    _S.mkTexture=function(source){
      let obj, texture;
      if(is.str(source)){
        obj=Mojo.tcached(source)
      }else if(_.inst(Mojo.PXTexture,source)){
        obj=source
      }
      if(obj)
        texture = new Mojo.PXTexture(obj);
      if(!texture)
        throw `Error: ${source} not loaded`;
      return texture;
    };
    /**
     * @private
     * @function
     */
    function _sprite(source, width, height, tiling, x, y){
      let C= tiling ? Mojo.PXTSprite : Mojo.PXSprite;
      let s, obj;
      if(_.inst(Mojo.PXTexture,source)){
        obj=source
      }else if(is.vec(source)){
        let s0=source[0];
        if(is.str(s0)){
          s= Mojo.tcached(s0) ? Mojo.animFromFrames(source)
                              : Mojo.animFromImages(source)
        }else if(_.inst(Mojo.PXTexture,s0)){
          s= new Mojo.PXASprite(source)
        }
      }else if(is.str(source)){
        obj= Mojo.tcached(source);
        if(!obj)
          obj = Mojo.textureFromImage(source);
      }

      if(obj)
        s= tiling ? new C(obj,width,height) : new C(obj);

      if(!s)
        throw `Error: ${source} not found`;

      _.assertNot(s.g,"property g exists!!!");
      s= _S.extend(s);
      s.x = x;
      s.y = y;
      //if(width) s.width = width;
      //if(height) s.height = height;
      return s;
    }
    /**
     * @public
     * @function
     */
    _S.scaleContent=function(...args){
      if(args.length===1&&is.vec(args[0])){
        args=args[0];
      }
      let f=Mojo.contentScaleFactor();
      args.forEach(s=>{
        s.scale.x=f.width;
        s.scale.y=f.height;
      })
    };
    /**
     * @public
     * @function
     */
    _S.container=function(cb){
      let c= this.extend(new Mojo.PXContainer());
      cb && cb(c);
      return c;
    };
    /**
     * @public
     * @function
     */
    _S.sprite=function(source, x=0, y=0, center=false){
      let s= _sprite(source,0,0,false,x,y);
      if(center)
        s.anchor.set(0.5,0.5);
      return _.inst(Mojo.PXASprite,s) ? _exASprite(s) : s
    };
    /**
     * @public
     * @function
     */
    _S.tilingSprite=function(source, width, height, x=0, y=0){
      let t= this.mkTexture(source);
      let s = _sprite(source, width || t.width, height || t.height, true, x,y);
      s.mojoh5.tiling={ x:0,y:0,sx:0,sy:0 };
      return s;
    };
    /**
     * @private
     * @function
     */
    function XX_cfgTexture(t,width,height,x,y){
      t.frame = new Mojo.PXRectangle(x, y, width, height);
      t.updateUvs();
      return t;
    }
    /**
     * @private
     * @function
     */
    function _frames(source, tileW, tileH, points){
      let bt= _S.mkTexture(source).baseTexture;
      return points.map(p => new Mojo.PXTexture(bt,new Mojo.PXRectangle(p[0],p[1],tileW,tileH)));
    }
    /**
     * @public
     * @function
     */
    _S.animation=function(texture, tileW, tileH, spacing = 0){
      let t= Mojo.tcached(texture);
      if(!t) return null;
      let cols = t.width/tileW;
      let rows = t.height/tileH;
      let cells = cols * rows;
      let pos= [];
      for(let x,y,i=0; i<cells; ++i){
        x= (i%cols) * tileW;
        y= _.floor(i/cols) * tileH;
        if(spacing > 0){
          x += spacing + (spacing * i % cols);
          y += spacing + (spacing * _.floor(i/cols));
        }
        _.conj(pos, _V.V2(x,y));
      }
      let ret= _frames(texture, tileW, tileH,pos);
      _V.dropV2(...pos);
      return ret;
    };
    /**
     * @public
     * @function
     */
    _S.frame=function(source, width, height,x,y){
      let bt= this.mkTexture(source).baseTexture;
      return new Mojo.PXTexture(bt,new Mojo.PXRectangle(x, y, width,height));
    };
    /**
     * @public
     * @function
     */
    _S.frames=function(source,tileW,tileH,spaceX=0,spaceY=0,sx=0,sy=0){
      let t= this.mkTexture(source);
      let out=[];
      let dx=tileW+spaceX;
      let dy=tileH+spaceY;
      let bt= t.baseTexture;
      let rows= _.floor(t.height/dy);
      let cols= _.floor((t.width+spaceX)/dx);
      for(let y,r=0;r<rows;++r){
        y= sy + tileH*r;
        for(let x,c=0;c<cols;++c){
          x= sx + tileW*c;
          _.conj(out,new Mojo.PXTexture(bt,new Mojo.PXRectangle(x, y, tileW,tileH)));
        }
      }
      return out;
    };
    /**
     * @public
     * @function
     */
    _S.frameSeries=function(start, end, base, ext){
      let frames = [];
      for(let z=end+1,i=start; i<z; ++i)
        _.conj(frames, Mojo.tcached(`${base+i+ext}`));
      return frames;
    };
    /**
     * @public
     * @function
     */
    _S.frameImages=function(...pics){
      if(pics.length===1 && is.vec(pics[0])){
        pics=pics[0]
      }
      return pics.map(p=> Mojo.tcached(p))
    };
    /**
     * @public
     * @function
     */
    _S.spriteFrom=function(...pics){
      return this.sprite(this.frameImages(pics))
    };
    /**
     * @private
     * @function
     */
    function _initText(C,content,spec,x=0, y=0){
      let msg=_S.extend(new C(content,spec));
      msg.x = x;
      msg.y = y;
      msg.mojoh5.kontent=content;
      msg.mojoh5.content=function(v){
        if(v !== undefined){
          msg.mojoh5.kontent=v;
          msg.text=v;
        }
        return msg.mojoh5.kontent
      };
      return msg
    };
    /**
     * @public
     * @function
     */
    _S.text=function(content,fontSpec, x=0, y=0){
      return _initText(Mojo.PXText,content,fontSpec,x,y)
    };
    /**
     * @public
     * @function
     */
    _S.bitmapText=function(content, fontStyle, x=0, y=0){
      return _initText(Mojo.PXBText,content,fontStyle,x,y)
    };
    /**
     * @public
     * @function
     */
    _S.rectangle=function(width, height,
                          fillStyle = 0xFF3300,
                          strokeStyle = 0x0033CC, lineWidth=0, x=0, y=0){
      let g = new Mojo.PXGraphics();
      let gprops={
        width:  width,
        height: height,
        lineW: lineWidth,
        fill: _S.color(fillStyle),
        stroke: _S.color(strokeStyle)
      };
      let draw=function(){
        g.clear();
        g.beginFill(gprops.fill);
        if(gprops.lineW > 0)
          g.lineStyle(gprops.lineW, gprops.stroke, 1);
        g.drawRect(0, 0, gprops.width, gprops.height);
        g.endFill();
        return g;
      };
      draw();
      let s= new Mojo.PXSprite(_S.generateTexture(g));
      this.extend(s);
      s.x = x;
      s.y = y;
      s.mojoh5.fillStyle=function(v){
        if(v !== undefined){
          gprops.fill= _S.color(v);
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.fill;
      };
      s.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.stroke;
      };
      s.mojoh5.lineWidth=function(v){
        if(v !== undefined){
          gprops.lineW= v;
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.lineW;
      };
      return s;
    };
    /**
     * @public
     * @function
     */
    _S.drawBody=function(cb,...args){
      let g = new Mojo.PXGraphics();
      cb.apply(_S,[g].concat(args));
      return this.extend(new Mojo.PXSprite(_S.generateTexture(g)))
    };
    /**
     * @public
     * @function
     */
    _S.circle=function(diameter,
                       fillStyle=0xFF3300,
                       strokeStyle=0x0033CC, lineWidth=0, x=0, y=0){
      let g = new Mojo.PXGraphics();
      let gprops={
        radius: diameter/2,
        lineW: lineWidth,
        fill: _S.color(fillStyle),
        stroke: _S.color(strokeStyle)
      };
      let draw=function(){
        g.clear();
        g.beginFill(gprops.fill);
        if(gprops.lineW > 0)
          g.lineStyle(grops.lineW, gprops.stroke, 1);
        g.drawCircle(0, 0, gprops.radius);
        g.endFill();
        return g;
      };
      draw();
      let s= new Mojo.PXSprite(_S.generateTexture(g));
      this.extend(s);
      this.circular(s,true);
      s.x = x;
      s.y = y;
      s.mojoh5.fillStyle=function(v){
        if(v !== undefined){
          gprops.fill= _S.color(v);
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.fill;
      };
      s.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.stroke;
      };
      s.mojoh5.radius=function(v){
        if(v !== undefined){
          gprops.radius=v;
          s.texture = draw() && _S.generateTexture(g);
        }
        return gprops.radius;
      };
      s.anchor.set(0.5);
      return sprite;
    };
    /**
     * @public
     * @function
     */
    _S.line=function(strokeStyle, lineWidth, A,B){
      //A=A || _V.V2(0,0);
      //B=B || _V.V2(32,32);
      let g = new Mojo.PXGraphics();
      let gprops={
        stroke: _S.color(strokeStyle),
        lineW: lineWidth,
        A: _V.V2(A[0],A[1]),
        B: _V.V2(B[0],B[1])
      };
      let draw=function(){
        g.clear();
        g.lineStyle(gprops.lineW, gprops.stroke, 1);
        g.moveTo(gprops.A[0], gprops.A[1]);
        g.lineTo(gprops.B[0], gprops.B[1]);
      };
      draw();
      let s=this.extend(g);
      s.mojoh5.ptA=function(x,y){
        if(x !== undefined){
          gprops.A[0] = x;
          gprops.A[1] = y===undefined?x:y;
          draw();
        }
        return gprops.A;
      };
      s.mojoh5.ptB=function(x,y){
        if(x !== undefined){
          gprops.B[0] = x;
          gprops.B[1] = y===undefined?x:y;
          draw();
        }
        return gprops.B;
      };
      s.mojoh5.lineWidth=function(v){
        if(v !== undefined){
          gprops.lineW= v;
          draw();
        }
        return gprops.lineW;
      };
      s.mojoh5.strokeStyle=function(v){
        if(v !== undefined){
          gprops.stroke= _S.color(v);
          draw();
        }
        return gprops.stroke;
      };
      return s;
    };
    /**
     * @public
     * @function
     */
    _S.moving=function(s){
      return !_.feq(s.mojoh5.vel[0],0.0) || !_.feq(s.mojoh5.vel[1], 0.0)
    };
    function _mkgrid(sx,sy,rows,cols,tileX,tileY){
      let out=[];
      let y1=sy;
      let x1=sx;
      for(let x2,y2,v,r=0; r<rows; ++r){
        v=[];
        for(let c=0; c<cols; ++c){
          y2 = y1 + tileY;
          x2 = x1 + tileX;
          _.conj(v,_S.bbox4(x1,x2,y1,y2));
          x1 = x2;
        }
        y1 = y2;
        x1 = sx;
        _.conj(out,v);
      }
      return out;
    }
    /**
     * @public
     * @function
     */
    _S.makeCells=function(sx,sy,ex,ey,cellX,cellY){
      let cols=(ex-sx)/cellX;
      let rows=(ey-sx)/cellY;
      let out=[];
      return _mkgrid(sx,sy,rows,cols,cellX,cellY);
    };
    /**
     * @public
     * @function
     */
    _S.gridSQ=function(dim,ratio=0.6){
      let sz= ratio* (Mojo.height<Mojo.width ?Mojo.height:Mojo.width);
      let w=sz/dim;
      let h=w;
      let sy=(Mojo.height-sz)/2;
      let sx=(Mojo.width-sz)/2;
      return _mkgrid(sx,sy,dim,dim,w,h);
    };
    /**
     * @public
     * @function
     */
    _S.gridXY=function(dimX,dimY,ratio=4/5){
      let szh=Mojo.height*ratio |0; //(int)
      let szw=Mojo.width*ratio |0; //(int)
      let z=(szw>szh ? (szh/dimY) : (szw/dimX)) |0;
      let sy= (Mojo.height-(z*dimY))/2 | 0;
      let sx= (Mojo.width-(z*dimX))/2 | 0;
      return _mkgrid(sx,sy,dimY,dimX,z,z);
    };
    /**
     * @public
     * @function
     */
    _S.drawGridBox=function(grid,lineWidth,lineColor){
      let ctx= new Mojo.PXGraphics();
      let gf = grid[0][0];
      let n=grid[0].length;
      let gl = grid[grid.length-1][n-1];
      ctx.lineStyle(lineWidth,_S.color(lineColor));
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      return this.extend(ctx);
    };
    /**
     * @public
     * @function
     */
    _S.drawGridLines=function(grid,lineWidth,lineColor){
      let ctx= new Mojo.PXGraphics();
      let h= grid.length;
      let w= grid[0].length;
      ctx.lineStyle(lineWidth,_S.color(lineColor));
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
      return this.extend(ctx);
    };
    /**
     * @public
     * @function
     */
    _S.grid=function(cols, rows, cellW, cellH,
                     centerCell, xOffset, yOffset, spriteCtor, extra){
      let container = new Mojo.PXContainer();
      let length = cols * rows;
      for(let s,x,y,i=0; i < length; ++i){
        x = (i%cols) * cellW;
        y = _.floor(i/cols) * cellH;
        s= spriteCtor();
        container.addChild(s);
        s.x = x + xOffset;
        s.y = y + yOffset;
        if(centerCell){
          s.x += (cellW/2) - (s.width/2);
          s.y += (cellH/2) - (s.height/2);
        }
        extra && extra(s);
      }
      return this.extend(container)
    };
    /**
     * @public
     * @function
     */
    _S.shoot=function(shooter, angle, container,
                      bulletSpeed, bulletArray, bulletCtor,x,y){
      let soff=this.anchorOffsetXY(shooter);
      let g=this.gposXY(shooter);
      let b= this.extend(bulletCtor());
      container.addChild(b);
      b.x= g[0]-soff[0]+x;
      b.y= g[1]-soff[1]+y;
      b.mojoh5.vel[0] = Math.cos(angle) * bulletSpeed;
      b.mojoh5.vel[1] = Math.sin(angle) * bulletSpeed;
      _.conj(bulletArray, b);
      _V.dropV2(soff,g);
      return shooter;
    };
    /**
     * @public
     * @function
     */
    _S.shake=function(s, magnitude=16, angular=false){
      let self = this;
      let counter = 1;
      let numberOfShakes = 10;
      let startX = s.x;
      let startY = s.y;
      let startAngle = s.rotation;
      //Divide the magnitude into 10 units so that you can
      //reduce the amount of shake by 10 percent each frame
      let magnitudeUnit = magnitude / numberOfShakes;
      function _upAndDownShake(){
        if(counter < numberOfShakes){
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
          _.disj(WIPShakers,s);
        }
      }
      let tiltAngle = 1;
      function _angularShake(){
        if(counter < numberOfShakes){
          s.rotation = startAngle;
          magnitude -= magnitudeUnit;
          s.rotation = magnitude * tiltAngle;
          ++counter;
          //yoyo it
          tiltAngle *= -1;
        }
        if(counter >= numberOfShakes){
          s.rotation = startAngle;
          _.disj(WIPShakers,s);
        }
      }
      if(!_.has(WIPShakers,s)){
        _.conj(WIPShakers,s);
        s.updateShake = () => angular ? _angularShake() : _upAndDownShake();
      }
    };
    /**
     * @public
     * @function
     */
    _S.group=function(...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      let c= new Mojo.PXContainer();
      _.doseq(sprites, s => c.addChild(s));
      return this.extend(c);
    };
    /**
     * @public
     * @function
     */
    _S.batch=function(size = 15000, options = {rotation:true,
                                               alpha:true,
                                               uvs:true,
                                               scale:true}){
      return new Mojo.PXPContainer(size, options);
    };
    /**
     * @public
     * @function
     */
    _S.add=function(parent,...children){
      _.doseq(children,c=> c && parent.addChild(c));
      return parent;
    }
    /**
     * @public
     * @function
     */
    _S.remove=function(...sprites) {
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites, s=>{
        if(s){
          if(s.parent)
            s.parent.removeChild(s);
          s.mojoh5.dispose &&
            s.mojoh5.dispose();
          Mojo.EventBus.pub(["post.remove",s]);
        }
      });
    };
    /**
     *From: http://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
     *Utilities to convert HTML color string names to hexadecimal codes
     * @public
     * @function
     */
    _S.colorToRGBA=function(color){
      // Returns the color as an array of [r, g, b, a] -- all range from 0 - 255
      // color must be a valid canvas fillStyle. This will cover most anything
      // you'd want to use.
      // Examples:
      // colorToRGBA('red')  # [255, 0, 0, 255]
      // colorToRGBA('#f00') # [255, 0, 0, 255]
      let cvs = dom.newElm("canvas");
      let ctx = cvs.getContext("2d");
      cvs.height = 1;
      cvs.width = 1;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data;
    };
    /**
     * @public
     * @function
     */
    _S.byteToHex=function(num){
      //turns a number (0-255) into a 2-character hex number (00-ff)
      //grab last 2 digits
      return ("0"+num.toString(16)).slice(-2);
    };
    /**
     * @public
     * @function
     */
    _S.colorToHex=function(color){
      // Convert any CSS color to a hex representation
      // Examples:
      // colorToHex('red')            # '#ff0000'
      // colorToHex('rgb(255, 0, 0)') # '#ff0000'
      let rgba = this.colorToRGBA(color);
      let hex = [0,1,2].map(i => this.byteToHex(rgba[i])).join("");
      return "0x" + hex;
    };
    /**
     * @public
     * @function
     */
    _S.color=function(value){
      return isNaN(value) ? parseInt(this.colorToHex(value)) : value
    };
    /**
     * @public
     * @function
     */
    _S.add=function(par, ...sprites){
      if(sprites.length===1 && is.vec(sprites[0])){
        sprites=sprites[0];
      }
      _.doseq(sprites,s => par.addChild(s));
      return par;
    };
    /**
     * @public
     * @function
     */
    _S.resize=function(s){
      s && s.children.forEach(c=>c&&c.mojoh5&&c.mojoh5.resize&&c.mojoh5.resize(s.x,s.y,s.width,s.height));
    };
    /**
     * @private
     * @function
     */
    function _nudge(s, value, axis){
      let v= s.anchor ? s.anchor[axis] : null;
      return v !== null ? (v < 0.3 ? value : value * ((1-v) - v)) : value
    }
    function _compensate(a, b, p1, p2){
      function comp(s, v, axe){
        return s.anchor ? (s.anchor[axe] > 0 ? (v*s.anchor[axe]) : 0) : 0 }
      return comp(a, a[p1], p2) + comp(b, b[p1], p2)
    }
    function _adjustForParent(a, b){
      let bg= _S.gposXY(b.parent);
      let ag= _S.gposXY(a);
      if(bg[0] !== 0 || bg[1] !== 0){
        b.x -= ag[0];
        b.y -= ag[1];
      }
      _V.dropV2(bg,ag);
    }
    /**
     * Pin b inside a's center.
     *
     * @public
     * @function
     */
    _S.pinCenter=function(C, b, xOffset=0, yOffset=0){
      let a= Mojo.adjustForStage(C);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!C.mojoh5.stage)
        _adjustForParent(a, b);
      _V.dropV2(az,bz);
    };
    /**
     * Position `b` to the left of `a`.
     * @public
     * @function
     */
    _S.pinLeft=function(C,b, xOffset=0, yOffset=0){
      let a= Mojo.adjustForStage(C);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x - _nudge(b, b.width, "x") + xOffset - _compensate(a, b, "width", "x");
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!C.mojoh5.stage)
        _adjustForParent(a, b);
      _V.dropV2(az,bz);
    };
    /**
     * Position `b` above `a`.
     * @public
     * @function
     */
    _S.pinTop=function(C, b, xOffset = 0, yOffset = 0){
      let a = Mojo.adjustForStage(C);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y - _nudge(b, b.height, "y") + yOffset - _compensate(a, b, "height", "y");
      if(!C.mojoh5.stage)
        _adjustForParent(a, b);
      _V.dropV2(az,bz);
    };
    /**
     * Position `b` to the right of `a`.
     *
     * @function
     * @public
     */
    _S.pinRight=function(C, b, xOffset = 0, yOffset = 0){
      let a= Mojo.adjustForStage(C);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, a.width, "x") + xOffset + _compensate(a, b, "width", "x");
      b.y = a.y + _nudge(a, az[1], "y") - _nudge(b, bz[1], "y") + yOffset;
      if(!C.mojoh5.stage)
        _adjustForParent(a, b);
      _V.dropV2(az,bz);
    };
    /**
     * Position `b` below `a`.
     *
     * @public
     * @function
     */
    _S.pinBottom=function(C, b, xOffset=0, yOffset=0){
      let a= Mojo.adjustForStage(C);
      let az= this.halfSize(a);
      let bz= this.halfSize(b);
      b.x = a.x + _nudge(a, az[0], "x") - _nudge(b, bz[0], "x") + xOffset;
      b.y = a.y + _nudge(a, a.height, "y") + yOffset + _compensate(a, b, "height", "y");
      if(!C.mojoh5.stage)
        _adjustForParent(a, b);
      _V.dropV2(az,bz);
    };
    /**
     * @public
     * @function
     */
    _S.setMass=function(s,m){
      s.mojoh5.mass=m;
      s.mojoh5.invMass= _.feq0(m) ? 0 : 1/m;
    };
    /**
     * Copied from pixi.legacy, why didn;t they want to keep this????
     * so useful!
     * @public
     * @function
     */
    _S.generateTexture=function(displayObject, scaleMode, resolution, region){
      region = region || displayObject.getLocalBounds(null, true);
      // minimum texture size is 1x1, 0x0 will throw an error
      if(region.width === 0){ region.width = 1 }
      if(region.height === 0){ region.height = 1 }
      let renderTexture = Mojo.PXRTexture.create({
        width: region.width | 0,
        height: region.height | 0,
        scaleMode: scaleMode,
        resolution: resolution
      });
      Mojo.PXMatrix.tx = -region.x;
      Mojo.PXMatrix.ty = -region.y;
      Mojo.ctx.render(displayObject, renderTexture,
                      false,
                      Mojo.PXMatrix, !!displayObject.parent);
      return renderTexture;
    };
    /**
     * @public
     * @function
     */
    _S.moveBy=function(s,duration,target){
      let v=_V.makeVecAB([s.x,s.y],target);
      let d=_V.vecLen(v);
    };

    return (Mojo.Sprites= _S)
  }
  /**
   * @public
   * @module
   */
  global["io.czlab.mojoh5.Sprites"]=function(Mojo){
    return Mojo.Sprites ? Mojo.Sprites :  _module(Mojo,[])
  };

})(this);



