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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const E_SHIP=1, E_ASTRO=2, E_BULLET=4;
    const int=Math.floor;

    const {Scenes:_Z,
           Sprites:_S,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#fff20f");
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //type of asteroid, big,medium,small
    const KIND_1=1;
    const KIND_2=2;
    const KIND_3=3;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkShip(scene,X,Y){
      const K= Mojo.getScaleFactor(),
            s= _S.sprite(_S.frames("rocket.png",512,396));
      _S.centerAnchor(s).m5.showFrame(0);
      _S.scaleXY(s,0.15*K,0.15*K);
      _V.set(s.m5.acc,8*K,8*K);
      s.m5.type=E_SHIP;
      _S.tint(s,_S.color("red"));
      s.angle= 0;
      _G.omega=0;
      _G.maxOmega= 400;
      _G.omegaDelta= 700;
      const fire=_I.keybd(_I.SPACE);
      fire.press = ()=>{
        let S=Math.sin(s.rotation);
        let C=Math.cos(s.rotation);
        let y=s.y+s.height*S* 0.5;
        let x=s.x+s.height*C* 0.5;
        let b= takeBullet();
        b.angle=s.angle;
        _V.set(b,x,y);
        _V.set(b.m5.vel,5*C*K,5*S*K);
        _G.shoot.play();
      };
      s.m5.tick=(dt)=>{
        let u= _I.keyDown(_I.UP);
        let r= _I.keyDown(_I.RIGHT);
        let l=_I.keyDown(_I.LEFT);
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

        repos(_S.move(s,dt));
      };

      s.g.onHit=()=>{
        Mojo.off(["hit",s],"onHit",s.g);
        scene.queueForRemoval(s);
        Mojo.pause();
      };

      Mojo.on(["hit",s],"onHit",s.g);
      return mkShield(scene, _V.set(s,X,Y));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkShield(scene,ship){
      let t= _F.pulse(ship,0.4);
      _.delay(4444,()=>{
        ship.g.shield=false;
        ship.alpha=1;
        _F.remove(t);
      });
      return (ship.g.shield=true) && ship;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeBullet(){
      //console.log("taking a bullet");
      const K=Mojo.getScaleFactor();
      let o;
      if(_G.bullets.length===0){
        o=_S.sprite("laser.png");
        o.m5.type=E_BULLET;
        _S.centerAnchor(o);
        _S.scaleBy(o, 0.3*K, 0.5*K);
        _S.tint(o,_S.color("yellow"));
        o.m5.tick=()=>{
          if(!o.m5.dead)
            repos(_S.move(o))
        };
        o.g.onHit=()=>{
          dropBullet(o)
        };
        _G.gameScene.insert(o,true);
        Mojo.on(["hit",o],"onHit",o.g);
      }else{
        o=_G.bullets.pop();
      }
      o.m5.dead=false;
      return _S.manifest(o);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropBullet(o){
      //console.log("got rid of a bullet");
      Mojo.off(["hit",o],"onHit",o.g);
      _G.bullets.push(o);
      o.m5.dead=true;
      return _G.gameScene.degrid(_S.manifest(o,false));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function repos(p){
      let r=p.width/2;
      if(p.m5.type===E_BULLET){
        if(p.x-r>Mojo.width ||
           p.x+r<0 ||
           p.y-r>Mojo.height||
           p.y+r<0){
          dropBullet(p);
        }
      }else{
        //asteroids and ship
        if(p.x-r>Mojo.width){
          p.x= -r;
        }else if(p.x+r<0){
          p.x=Mojo.width+r;
        }
        if(p.y-r>Mojo.height){
          p.y= -r;
        }else if(p.y+r<0){
          p.y=Mojo.height+r;
        }
      }
    }

    function takeAstro(kind){
      let o;
      if(kind !== KIND_3 || _G.as3.length===0){
        o=mkAstro(kind)
      }else{
        console.log("got 3 from cache");
        o=_G.as3.pop();
      }
      Mojo.on(["hit",o],"onHit",o.g);
      _G.astros.push(o);
      return _S.manifest(o,true);
    }

    function dropAstro(a){
      Mojo.off(["hit",a],"onHit",a.g);
      _G.gameScene.degrid(a);
      a.m5.dead=true;
      if(a.g.rank===KIND_3){
        console.log("put 3 back");
        _G.as3.push(a);
      }else{
        console.log("astro die");
        _G.gameScene.queueForRemoval(a);
      }
      return _S.manifest(a,false);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkAstro(kind){
      let K= Mojo.getScaleFactor(),
          a= _S.sprite("astro.png"),
          speed,rao, twist= _.randSign();
      _S.centerAnchor(a);
      _S.scaleXY(a,0.6*K,0.6*K);
      a.m5.type=E_ASTRO;
      a.m5.circle=true;
      a.g.rank=kind;
      a.m5.cmask=E_SHIP|E_BULLET;
      switch(kind){
        case KIND_1:
          rao=0.6;
          speed=100;
          break;
        case KIND_2:
          //_S.scaleXY(a,0.3*K,0.3*K);
          speed=120;
          rao=0.3;
          break;
        case KIND_3:
          //_S.scaleXY(a,0.1*K,0.1*K);
          speed=140;
          rao=0.1;
          break;
      }
      a.m5.speed=speed*K;
      _S.scaleXY(a,rao*K,rao*K);
      a.m5.tick=(dt)=>{
        repos(_S.move(a,dt));
        a.angle += twist*0.2*K;
      }
      a.g.explode=(B)=>{
        let t= a.g.rank===KIND_1?KIND_2:(a.g.rank===KIND_2?KIND_3:0);
        let len=0;
        let X=a.x;
        let Y=a.y;
        dropBullet(B);
        dropAstro(a);
        if(t===KIND_2){
          len=_G.RANK2;
        }
        if(t===KIND_3){
          len=_G.RANK3;
        }
        for(let g,x,i=0;i<len;++i){
          x= takeAstro(t);
          g= 120*i + _.rand() * 120;
          _V.set(x.m5.vel,Math.cos(g)*x.m5.speed*_.randSign(),
                          Math.sin(g)*x.m5.speed*_.randSign());
          _V.set(x,X,Y);
          _G.gameScene.insert(x,true);
        }
        _G.explode.play();
        if(a.g.rank===KIND_3){
          ++_G.score;
        }
      }
      a.g.onHit=(col)=>{
        if(col.B.m5.type===E_BULLET){
          a.g.explode(col.B);
        }
      };
      return _S.tint(a,_S.color("orange"));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Asteroids",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,Mojo.width/2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        this.g.doNext=(b,s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          b=_I.mkBtn(s);
          t=_F.throb(b,0.99);
          b.m5.press=(btn)=>{
            _F.remove(t);
            _S.tint(btn,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=>_Z.replaceScene(self,"PlayGame"));
          };
          _V.set(b,Mojo.width/2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(b));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle() && this.g.doNext();
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame", {
      setup(){
        let self=this,
            K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          _G.explode=Mojo.sound("explosion.mp3");
          _G.shoot=Mojo.sound("shoot.mp3");
          _G.gameScene=self;
          _G.score=0;
          _G.bullets=[];
          _G.astros=[];
          _G.as3=[];
          _G.RANK1=4;
          _G.RANK2=3;
          _G.RANK3=6;
          _.fill(int(_G.RANK1*_G.RANK2*_G.RANK3/2),
                 ()=> takeAstro(KIND_3)).forEach(o=>dropAstro(o));
          _.fill(20,()=> takeBullet()).forEach(o=> dropBullet(o));
          return this;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initAstros=()=>{
          const A= _S.sprite("astro.png");
          const G=_S.divXY([3,3],1,1);
          let nums=[0,1,2,3,5,6,7,8];
          let py,cy=Mojo.height/2;
          let px,cx=Mojo.width/2;
          let a,g,n,
              total=_G.RANK1,
              vx,vy,speed=100*K;
          while(total>0){
            n=_.randItem(_.shuffle(nums));
            _.disj(nums,n);
            g=G[int(n/3)][n%3];
            px=g.x1+ (g.x2-g.x1)/2;
            py=g.y1+ (g.y2-g.y1)/2;
            a=takeAstro(KIND_1);
            vx=px>cx? -speed: speed;
            vy=py>cy? -speed: speed;
            _V.set(a.m5.vel,vx,vy);
            _V.set(a,px,py);
            --total;
            self.insert(a,true);
          }
          return this;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initShip=()=>{
          let s= this.ship= mkShip(this, Mojo.width/2, Mojo.height/2);
          return this.insert(s,true);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHUD=(s)=>{
          s= this.scoreText= _S.bmpText("Score: 0",{fontName:UI_FONT,fontSize:48*K});
          _V.set(s,0,0);
          return self.insert(s);
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() && this.g.initAstros() && this.g.initShip() && this.g.initHUD();
      },
      postUpdate(dt){
        for(let a,i=_G.astros.length-1;i>=0;--i){
          a=_G.astros[i];
          this.searchSGrid(a).forEach(o=>{
            if(a.m5.type===E_ASTRO && o.m5.type===E_SHIP){
              if(!o.g.shield){
                //_S.collide(a,o);
              }
            }else{
              _S.hit(a,o);
            }
          });
        }
        this.scoreText.text=`Score: ${_G.score}`;
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config object
  const _$={
    assetFiles: ["shoot.mp3","explosion.mp3",
                 "astro.png","rocket.png","laser.png",
                 "click.mp3","game_over.mp3","game_win.mp3"],
    //arena: {width:780, height:540},
    arena:{width:1680, height:1260}, //4:3
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("StarfieldBg");
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //bootstrap
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


