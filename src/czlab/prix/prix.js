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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil, abs=Math.abs;
    const sin=Math.sin, cos=Math.cos;

    const E_CAR=1;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){return 1;
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.png"));
      return scene.insert(_S.opacity(_G.backDropSprite,0.148));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            W2=Mojo.width/2,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Grand Prix",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,W2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame"));
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _objF= {};

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              {tiledWidth,tiledHeight, tilesInX,tilesInY,tileW,tileH}=self.tiled;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let x= _S.sprite("cars.png"),
                h=x.height,
                w=x.width/4;
            let {row,column}= self.getNamedItem("startpos")[0];
            let items=self.getObjectGroup("items");
            items.sprites.forEach(s=>s.visible=false);
            let cps= self.getNamedItem("check").sort((a,b)=>{
              return a.order<b.order?-1:(a.order>b.order?1:0)
            });
            let s,cs= _S.frames("cars.png",w,h);
            _S.centerAnchor(s=_S.sprite(cs[0]));
            s.x=column*tileW+s.width/2;
            s.y=row*tileH+s.height/2;
            s.m5.type=E_CAR;
            s.m5.cmask=E_CAR;
            s.m5.maxSpeed=400;
            s.m5.speed=s.m5.maxSpeed;
            s.m5.tick=(dt)=>{
              //s["2d"].onTick(dt)
            };
            self.insert(Mojo.addMixin(s,"2d"));
            if(true){
              let p1=_S.centerAnchor(_S.sprite(cs[1]));
              let R=p1.width*1.4;
              p1.m5.type=E_CAR;
              p1.m5.cmask=E_CAR;
              p1.m5.maxSpeed=250;
              p1.m5.speed=p1.m5.maxSpeed;
              p1.x= s.x;
              p1.y= s.y - s.height - s.height/8;
              p1.m5.vel[0] = p1.m5.speed;//cos(p1.rotation)*p1.m5.speed;
              //p1.m5.vel[1] = sin(p1.rotation)*p1.m5.speed;
              p1.g.cps=cps.slice();
              p1.g.cpn=0;
              p1.g.recalc=true;
              p1.g.targetRot=null;
              p1.m5.tick=(dt)=>{
                let c= p1.g.cps[p1.g.cpn];
                let t=[c.column*tileW+tileW/2,
                       c.row*tileH+tileH/2];
                let dx=t[0]-p1.x;
                let dy=t[1]-p1.y;
                let dr,D=Math.sqrt(dx*dx+dy*dy);
                if(D<R){//next checkpoint
                  p1.g.cpn= (p1.g.cpn+1)%p1.g.cps.length;
                  return;
                }
                let beta=p1.rotation-Math.atan2(dy,dx);
                if(sin(beta)<0){
                  p1.m5.angVel = 0.03;
                  //+beta
                }else{
                  //-beta
                  p1.m5.angVel = -0.03;
                }
                p1.rotation += p1.m5.angVel;
                p1.m5.vel[0]=cos(p1.rotation)*p1.m5.speed;
                p1.m5.vel[1]=sin(p1.rotation)*p1.m5.speed;
                p1["2d"].onTick(dt)
              };
              p1.g.onHit=()=>{
                p1.g.recalc=true;
              }
              Mojo.on(["hit",p1],"onHit",p1.g);
              self.insert(Mojo.addMixin(p1,"2d"));
              let p2=_S.centerAnchor(_S.sprite(cs[2]));
              p2.m5.type=E_CAR;
              p2.m5.cmask=E_CAR;
              p2.m5.maxSpeed=200;
              p2.m5.speed=p2.m5.maxSpeed;
              p2.x= s.x;
              p2.y= s.y + s.height + s.height/8;
              p2.m5.vel[0] = cos(p2.rotation)*p2.m5.speed;
              p2.m5.vel[1] = sin(p2.rotation)*p2.m5.speed;
              p2.g.cps=cps.slice();
              p2.g.cpn=0;
              p2.m5.tick=(dt)=>{
                //p2["2d"].onTick(dt)
              };
              self.insert(Mojo.addMixin(p2,"2d"));
            }
            _.inject(_G,{
              car:s
            });
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        Mojo.addMixin(this,"camera2d", tiledWidth, tiledHeight,Mojo.canvas);
      },
      postUpdate(dt){
        if(_I.keyDown(_I.DOWN)){
          _G.car.m5.speed=0;
        }else if(_I.keyDown(_I.UP)){
          _G.car.m5.speed=_G.car.m5.maxSpeed;
        }
        if(_I.keyDown(_I.LEFT)){
          _G.car.angle -= 3;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.car.angle += 3;
        }

        _G.car.m5.vel[0] = cos(_G.car.rotation)*_G.car.m5.speed;
        _G.car.m5.vel[1] = sin(_G.car.rotation)*_G.car.m5.speed;

        this["camera2d"].follow(_G.car);
      }
    },{sgridX:128,sgridY:128,centerStage:true, tiled:{name:"racing.json",factory:_objF}});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("HUD",{
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roadTextures_tilesheet.png",
                 "towerDefense_tilesheet.png",
                 "cars.png","racing.json","click.mp3"],
    arena: {},//width: 1680, height: 1050
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


