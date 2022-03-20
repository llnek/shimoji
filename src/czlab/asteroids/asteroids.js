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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const E_SHIP=1, E_ASTRO=2, E_LASER=4;
    const int=Math.floor;

    const {Scenes:_Z,
           Sprites:_S,
           FX:_F,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#fff20f"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //type of asteroid, big,medium,small
    const KIND_1=1,
      KIND_2=2,
      KIND_3=3;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function fireLaser(){
      let s= _G.ship,
        S=Math.sin(s.rotation),
        C=Math.cos(s.rotation),
        y=s.y+s.height*S* 0.5,
        x=s.x+s.height*C* 0.5,
        K=Mojo.getScaleFactor();

      let b= takeLaser();
      b.angle=s.angle;
      _V.set(b,x,y);
      _V.set(b.m5.vel,5*C*K,5*S*K);
      _G.shoot.play();
      _G.gameScene.engrid(b);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkShip(scene,X,Y){
      const K= Mojo.getScaleFactor(),
        s= _S.sprite(_S.frames("rocket.png",512,396));
      _S.anchorXY(s,0.5).m5.showFrame(0);
      _S.scaleXY(s,0.15*K,0.15*K);
      _V.set(s.m5.acc,8*K,8*K);
      s.m5.type=E_SHIP;
      _S.tint(s,_S.SomeColors.red);
      s.angle= 0;
      _G.omega=0;
      _G.maxOmega= 400;
      _G.omegaDelta= 700;
      const fire=_I.keybd(_I.SPACE);
      fire.press = fireLaser;
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
        _S.hide(scene.degrid(s));
        _.delay(1000,()=>{
          _V.set(s,Mojo.width/2,Mojo.height/2);
          s.m5.vel[0]=0;
          s.m5.vel[1]=0;
          mkShield(scene, scene.engrid(_S.show(s)));
        });
        //Mojo.off(["hit",s],"onHit",s.g);
        //scene.queueForRemoval(s);
      };

      Mojo.on(["hit",s],"onHit",s.g);
      return mkShield(scene, _V.set(s,X,Y));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkShield(scene,ship){
      let t= _F.pulse(ship,0.4);
      _.delay(4444,()=>{
        ship.tint=_S.SomeColors.red;
        ship.g.shield=false;
        ship.alpha=1;
        _F.remove(t);
      });
      ship.tint=_S.SomeColors.white;
      return (ship.g.shield=true) && ship;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeLaser(){
      //console.log("taking a bullet");
      const K=Mojo.getScaleFactor();
      let o;
      if(_G.bullets.length==0){
        o=_S.sprite("laser.png");
        o.m5.type=E_LASER;
        _S.anchorXY(o,0.5);
        _S.scaleBy(o, 0.3*K, 0.5*K);
        _S.tint(o,_S.SomeColors.yellow);
        o.m5.tick=()=>{
          if(!o.m5.dead)
            repos(_S.move(o))
        };
        o.g.onHit=()=>{ dropLaser(o) };
        _G.gameScene.insert(o,true);
      }else{
        o=_G.bullets.pop();
      }
      Mojo.on(["hit",o],"onHit",o.g);
      o.m5.dead=false;
      return _S.show(o);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropLaser(o){
      //console.log("got rid of a bullet");
      Mojo.off(["hit",o],"onHit",o.g);
      _G.bullets.push(o);
      o.m5.dead=true;
      return _G.gameScene.degrid(_S.hide(o));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function repos(p){
      let r=p.width/2;
      if(p.m5.type==E_LASER){
        if(p.x-r>Mojo.width ||
           p.x+r<0 ||
           p.y-r>Mojo.height||
           p.y+r<0){
          dropLaser(p);
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function takeAstro(kind){
      let o;
      if(kind != KIND_3 || _G.as3.length==0){
        o=mkAstro(kind)
      }else{
        console.log("got 3 from cache");
        o=_G.as3.pop();
      }
      Mojo.on(["hit",o],"onHit",o.g);
      _G.astros.push(o);
      return _S.show(o);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function dropAstro(a){
      Mojo.off(["hit",a],"onHit",a.g);
      _G.gameScene.degrid(a);
      a.m5.dead=true;
      if(a.g.rank==KIND_3){
        console.log("put 3 back");
        _G.as3.push(a);
      }else{
        console.log("astro die");
        _G.gameScene.queueForRemoval(a);
      }
      return _S.hide(a);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkAstro(kind){
      let K= Mojo.getScaleFactor(),
        a= _S.sprite("astro.png"),
        speed,rao, twist= _.randSign();
      _S.anchorXY(a,0.5);
      _S.scaleXY(a,0.6*K,0.6*K);
      a.m5.type=E_ASTRO;
      a.m5.circle=true;
      a.g.rank=kind;
      a.m5.cmask=E_SHIP|E_LASER;
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
        let t= a.g.rank==KIND_1?KIND_2:(a.g.rank==KIND_2?KIND_3:0);
        let len=0;
        let X=a.x;
        let Y=a.y;
        dropLaser(B);
        dropAstro(a);
        if(t==KIND_2){
          len=_G.RANK2;
        }
        if(t==KIND_3){
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
        _G.score += a.g.rank * 100;
      }
      a.g.onHit=(col)=>{
        if(col.B.m5.type==E_LASER){
          a.g.explode(col.B);
        }
      };
      return _S.tint(a,_S.SomeColors.orange);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Asteroids",TITLE_FONT,120*K);
            _S.tint(s,C_TITLE);
            _V.set(s,Mojo.width/2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,64*K);
            t=_F.throb(s,0.99);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=>_Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb);
            _V.set(s,Mojo.width/2,Mojo.height*0.7);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame", {
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
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
            _.fill(20,()=> takeLaser()).forEach(o=> dropLaser(o));
            return this;
          },
          initAstros(){
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
          },
          initShip(){
            let s= _G.ship= mkShip(self, Mojo.width/2, Mojo.height/2);
            return self.insert(s,true);
          },
          initHUD(s){
            s= this.scoreText= _S.bmpText("0",UI_FONT,48*K);
            _V.set(s,0,0);
            return self.insert(s);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel() &&
          this.g.initAstros() &&
          this.g.initShip() && this.g.initHUD();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
        if(1){
          let fontName=UI_FONT,
            fontSize= 48*K,
            radius= 36*K,
            color="grey",
            alpha=0.5;
          _Z.run("HotKeys",{
            fontName, fontSize, radius, color, alpha,
            cb(obj){
              _V.set(obj.right,Mojo.width-obj.right.width,Mojo.height-obj.right.height);
              _S.pinLeft(obj.right,obj.up,obj.right.width/4);
              _S.pinLeft(obj.up,obj.left,obj.up.width/4);
              delete obj.down;
              return obj;
            },
            extra(ss){
              let b=_S.opacity(_S.circle(radius,color),alpha);
              b.addChild(_S.anchorXY(_S.bmpText("^",fontName,fontSize),0.5));
              b.m5.press=()=> fireLaser();
              _V.set(b,b.width,Mojo.height-b.height);
              ss.insert(_I.mkBtn(b));
            }
          });
        }
      },
      postUpdate(dt){
        for(let a,i=_G.astros.length-1;i>=0;--i){
          a=_G.astros[i];
          this.searchSGrid(a).forEach(o=>{
            if(a.m5.type==E_ASTRO && o.m5.type==E_SHIP){
              if(!o.g.shield){
                _S.hit(a,o);
              }
            }else{
              _S.hit(a,o);
            }
          });
        }
        this.g.scoreText.text=`${_G.score}`;
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //bootstrap
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["shoot.mp3","explosion.mp3",
                 "audioOn.png","audioOff.png",
                 "astro.png","rocket.png","laser.png",
                 "click.mp3","game_over.mp3","game_win.mp3"],
    //arena: {width:780, height:540},
    arena:{width:1680, height:1260}, //4:3
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      //Mojo.Scenes.runScene("StarfieldBg");
      Mojo.Scenes.run("Splash");
    }
  }));

})(this);


