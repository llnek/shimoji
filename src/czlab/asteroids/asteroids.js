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

  function scenes(Mojo){

    const E_SHIP=1, E_ASTRO=2, E_BULLET=4;
    const MFL=Math.floor;

    const {Scenes:_Z,
           Sprites:_S,
           FX:_T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           ute:_,is,EventBus}=Mojo;

    const COLORS= [0,60,240];

    _G.bullets=[];
    _G.astros=[];
    _G.RANK1=3;
    _G.RANK2=4;
    _G.RANK3=5;
    _G.STARS=500;

    _Z.defScene("bg",{
      setup(){
        let ctx=new Mojo.PXGraphics();
        ctx.m5={uuid:_.nextId()};
        for(let h,s,l,r,x,y,i=0; i<_G.STARS; ++i){
          x= _.rand() * Mojo.width;
          y = _.rand() * Mojo.height;
          r= _.rand() * 1.8;
          h = _.randItem(COLORS);
          s= _.randInt(50,100)/100;//[0,1]
          l= 88/100;
          ctx.beginFill(_S.hsla(h,s,l,255));
          ctx.arc(x, y, r, 0, 360);
          ctx.endFill();
        }
        this.insert(ctx);
      }
    });

    function _repos(p){
      const d= p.g.diameter;
      if(p.y > Mojo.height+d) { p.y -= Mojo.height+d }
      if(p.x > Mojo.width+d){ p.x -= Mojo.width+d }
      if(p.y < -d) { p.y += Mojo.height+d }
      if(p.x < -d) { p.x += Mojo.width+d }
    }

    function _mkAstro(scene,kind){
      const a= _S.sprite("astro.png");
      const K= Mojo.getScaleFactor();
      //486,462
      //780,540
      _S.centerAnchor(a);
      _S.scaleXY(a,0.2*K,0.2*K);
      a.m5.type=E_ASTRO;
      a.m5.circular=true;
      a.m5.cmask=E_SHIP|E_BULLET;
      switch(kind){
        case 1:
          a.m5.rank=1;
          a.m5.speed=10*K;
          break;
        case 2:
          a.scale.x *= 0.45*K;
          a.scale.y *= 0.45*K;
          a.m5.rank=2;
          a.m5.speed=15*K;
          break;
        case 3:
          a.scale.x *= 0.25*K;
          a.scale.y *= 0.25*K;
          a.m5.rank=3;
          a.m5.speed=20*K;
          break;
      }
      let twist= _.randSign();
      a.scale.x *= K
      a.scale.y *= K;
      a.g.diameter=Math.sqrt(a.width*a.width+
                             a.height*a.height);
      a.m5.tick=(dt)=>{
        _S.move(a,dt);
        _repos(a);
        a.angle += twist*0.2*K;
      }
      a.g.explode=()=>{
        let t= a.m5.rank===1?2:(a.m5.rank===2?3:0);
        let len=0;
        let X=a.x;
        let Y=a.y;
        if(t===2){
          len=_G.RANK2;
        }
        if(t===3){
          len=_G.RANK3;
        }
        for(let g,x,i=0;i<len;++i){
          x=_mkAstro(scene,t);
          g= 120*i + _.rand() * 120;
          _S.velXY(x,Math.cos(g)*x.m5.speed,
                     Math.sin(g)*x.m5.speed);
          _S.setXY(x,X,Y);
          scene.insert(x,true);
        }
        _.disj(_G.astros,a);
        scene.queueForRemoval(a);
      }
      a.g.onHit=(col)=>{
        if(col.B.m5.type===E_BULLET){
          a.g.explode();
        }
      };
      EventBus.sub(["hit",a],"onHit",a.g);
      _G.astros.push(a);
      return a;
    }

    function _mkShip(scene){
      const s= _S.sprite(_S.frames("rocket.png",512,512));
      const K= Mojo.getScaleFactor();
      _S.centerAnchor(s);
      s.m5.showFrame(0);
      _S.accXY(s,8*K,8*K);
      s.scale.x *= 0.07*K;
      s.scale.y *= 0.07*K;
      s.m5.type=E_SHIP;
      s.angle= 0;
      _G.omega=0;
      _G.maxOmega= 400;
      _G.omegaDelta= 700;
      s.g.diameter=Math.sqrt(s.height*s.height+s.width*s.width);
      const fire=_I.keybd(_I.keySPACE);
      fire.press = ()=>{
        let S=Math.sin(s.rotation);
        let C=Math.cos(s.rotation);
        let y=s.y+s.height*S* 0.5;
        let x=s.x+s.height*C* 0.5;
        let b=_S.sprite("laser.png");
        _S.centerAnchor(b);
        b.scale.x *= 0.3*K;
        b.scale.y *= 0.5*K;
        b.m5.type=E_BULLET;
        b.angle=s.angle;
        _S.setXY(b,x,y);
        _S.velXY(b,5*C*K,5*S*K);
        b.m5.tick=()=>{
          if(!b.m5.dead) _S.move(b);
        };
        b.g.onHit=()=>{
          EventBus.unsub(["hit",b],"onHit",b.g);
          _.disj(_G.bullets,b);
          scene.queueForRemoval(b);
        };
        _G.bullets.push(b);
        scene.insert(b,true);
        EventBus.sub(["hit",b],"onHit",b.g);
      };
      s.m5.tick=(dt)=>{
        let u= _I.keyDown(_I.keyUP);
        let r= _I.keyDown(_I.keyRIGHT);
        let l=_I.keyDown(_I.keyLEFT);
        s.m5.showFrame(u?1:0);
        s.angle += _G.omega * dt;
        _G.omega *=  1 - dt;
        if(r){
          _G.omega += _G.omegaDelta * dt;
          if(_G.omega > _G.maxOmega){ _G.omega = _G.maxOmega }
        }else if(l){
          _G.omega -= _G.omegaDelta * dt;
          if(_G.omega < -_G.maxOmega) { _G.omega = -_G.maxOmega }
        }

        if(s.angle > 360) { s.angle -= 360 }
        if(s.angle < 0) { s.angle += 360 }

        if(u){
          let dy = Math.sin(s.angle * Math.PI / 180);
          let dx= Math.cos(s.angle * Math.PI / 180);
          s.m5.vel[0] += dx * s.m5.acc[0];
          s.m5.vel[1] += dy * s.m5.acc[1];
        }

        _S.move(s,dt);
        _repos(s);
      };

      s.g.onHit=()=>{
        EventBus.unsub(["hit",s],"onHit",s.g);
        scene.queueForRemoval(s);
        Mojo.pause();
      };
      EventBus.sub(["hit",s],"onHit",s.g);
      return s;
    }

    function _initAstros(scene){
      let K=Mojo.getScaleFactor();
      let a= _mkAstro(scene,1);
      let h= a.height;
      let w= a.width;
      let h2=MFL(h/2);
      let w2=MFL(w/2);
      let W= MFL(Mojo.width /w);
      let W3=MFL(W/3);
      let H= Mojo.height/h;
      let cx=Mojo.width/2;
      let cy=Mojo.height/2;
      let speed=20*K;
      for(let r,vx,vy,px,py,i=0;i <_G.RANK1;++i){
        r= _.isEven(i) ? _.randInt2(W-W3,W) : _.randInt2(0,W3);
        px=r * w + w2;
        py=_.rand()*H * h + h2;
        a=_mkAstro(scene,1);
        _S.setXY(a,px,py);
        vx=px>cx? -speed:speed;
        vy=py>cy? -speed:speed;
        _S.velXY(a,vx,vy);
        scene.insert(a,true);
      }
    }

    _Z.defScene("level1", {
      setup(){
        let s= this.ship= _mkShip(this);
        _S.setXY(s,Mojo.width/2, Mojo.height/2);
        this.insert(s,true);
        _initAstros(this);
      },
      postUpdate(dt){
        for(let a,i=_G.astros.length-1;i>=0;--i){
          a=_G.astros[i];
          this.searchSGrid(a).forEach(o=>{
            _2d.hit(a,o);
          });
        }
      }
    });
  }

  //config object
  const _$={
    assetFiles: ["astro.png","rocket.png","laser.png"],
    arena: {width:780, height:540},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("StarfieldBg");
      //Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
    }
  };

  //bootstrap
  window.addEventListener("load",()=> MojoH5(_$));
})(this);


