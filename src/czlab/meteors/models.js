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

;(function(window){

  "use strict";

  window["io/czlab/meteors/models"]=function(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_F,
           "2d":_M,
           v2:_V,
           Game:_G,
           ute:_, is}=Mojo;

    /** @ignore */
    class MeteorSM extends _M.PeriodicDischarge{
      constructor(scene){
        super(()=>{
          let s= _S.sprite("meteor.png");
          let K=Mojo.getScaleFactor();
          _S.scaleXY(s,K,K);
          s.visible=false;
          s.m5.tick=(dt)=>{
            s.rotation += 0.01;
            _S.move(s,dt);
            if(s.y >= _G.cityLine){
              Mojo.emit(["meteor.blow",scene],s.x,s.y);
              this.drop(s);
            }
          };
          _S.centerAnchor(s);
          return scene.insert(s);
        },Mojo.u.meteorInterval,30);
      }
      drop(m){
        m.visible=false;
        if(this._pool.length>=this._size){
          _S.remove(m);
        }else{
          super.reclaim(m);
        }
      }
      discharge(){
        let m= this._take();
        let sy= 0-m.height;
        let ey=_G.cityLine;
        let sx=_.randInt2(m.width,Mojo.width-m.width);
        let ex= _.randInt(Mojo.width);
        let dt= Mojo.u.meteorSpeed;
        m.m5.vel[0]=(ex-sx)/dt;
        m.m5.vel[1]=(ey-sy)/dt;
        m.visible=true;
        _V.set(m,sx,sy);
      };
    }

    /** @ignore */
    class HealthPackSM extends _M.PeriodicDischarge{
      constructor(scene){
        super(()=>{
          let s= _S.sprite("health_pack2.png");
          let K=Mojo.getScaleFactor();
          _S.scaleXY(s,K,K);
          s.visible=false;
          s.m5.tick=(dt)=>{
            _S.move(s,dt);
            if(s.y >= _G.cityLine){
              this.drop(s);
            }
          };
          _S.centerAnchor(s);
          return scene.insert(s);
        },Mojo.u.healthInterval,30);
      }
      drop(m){
        m.visible=false;
        if(this._pool.length>=this._size){
          _S.remove(m);
        }else{
          super.reclaim(m);
        }
      }
      discharge(){
        let m= this._take();
        let sy= 0-m.height;
        let ey=_G.cityLine;
        let sx=_.randInt2(m.width,Mojo.width-m.width);
        let ex= _.randInt(Mojo.width);
        let dt= Mojo.u.healthSpeed;
        m.m5.vel[0]=(ex-sx)/dt;
        m.m5.vel[1]=(ey-sy)/dt;
        m.visible=true;
        _V.set(m,sx,sy);
      };
    }

    /** @ignore */
    class UfoSM extends _M.PeriodicDischarge{
      constructor(scene){
        super(()=>{
          let pngs=[1,2,3,4].map(i=>`ufo${i}.png`);
          let K=Mojo.getScaleFactor();
          let c,s= _S.spriteFrom(...pngs);
          s.m5.speed=Mojo.u.ufoSpeed*K;
          s.m5.vel[0]=s.m5.speed;
          c=_S.sprite("ray.png");
          c.x=(s.width-c.width)/2;
          c.y=s.height-1;
          s.addChild(c);
          s.visible=false;
          _S.scaleXY(s,K,K);
          s.m5.tick=(dt)=>{
            _S.move(s,dt);
            if((s.m5.vel[0]<0 &&
               (s.x+s.width<0)) || (s.x>Mojo.width)){
              this.drop(s);
            }
            if(s.visible){
              if((s.m5.heading===Mojo.RIGHT &&
                  s.x>s.g.killPos) || s.x<s.g.killPos){
                s.children[0].visible=true;
                Mojo.emit(["ufo.blow",scene],s.x,_G.cityLine);
              }
            }
          };
          return scene.insert(s);
        },Mojo.u.ufoInterval,4);
      }
      drop(m){
        m.m5.stopFrames();
        m.visible=false;
        if(this._pool.length>=this._size){
          _S.remove(m);
        }else{
          super.reclaim(m);
        }
      }
      discharge(){
        let y= _.randInt(3)*0.1*Mojo.height;
        let x= _.rand()>0.5?0:Mojo.width;
        let dx=Mojo.width/8;
        let s= this._take();
        _V.set(s,x,y);
        s.m5.speed=dx;
        s.visible=true;
        s.children[0].visible=false;
        s.m5.playFrames([0,3]);
        s.m5.vel[0]=s.m5.speed*(x===0?1:-1);
        s.m5.heading=(x===0?Mojo.RIGHT:Mojo.LEFT);
        s.g.killPos=_.randInt(Mojo.width);
      }
    }

    /** @ignore */
    class BombSM extends _M.PeriodicDischarge{
      constructor(scene){
        super(()=>{
          let s= _S.sprite("ring.png");
          let K=Mojo.getScaleFactor();
          _S.centerAnchor(s);
          s.m5.circle=true;
          s.visible=false;
          s.g.k=K*0.2;
          _S.scaleXY(s,s.g.k,s.g.k);
          s.m5.tick=(dt)=>{
            s.scale.x += 0.002;
            s.scale.y += 0.002;
            if(s.scale.x>s.g.trigger){
              this.drop(s);
              Mojo.emit(["bomb.blow"],s);
            }
          };
          return scene.insert(s);
        },0,4);
      }
      drop(m){
        m.visible=false;
        if(this._pool.length>=this._size){
          _S.remove(m);
        }else{
          super.reclaim(m);
        }
      }
      discharge(x,y){
        let s= this._take();
        _V.set(s,x,y);
        s.visible=true;
        _S.scaleXY(s,s.g.k,s.g.k);
        s.g.trigger=s.g.k*2;//1.5;
        return s;
      }
    }

    _.inject(_G,{UfoSM,MeteorSM,HealthPackSM,BombSM});
  }

})(this);
