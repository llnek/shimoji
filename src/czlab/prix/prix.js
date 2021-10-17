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
    function doBackDrop(scene){
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
            _.delay(CLICK_DELAY,()=>{
              _Z.runSceneEx("PlayGame");
              _Z.runScene("HUD");
            });
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
    function _touches(scene){
      let K=Mojo.getScaleFactor(true);
      let cfg={fontName:UI_FONT,fontSize:64*K};
      let alpha=0.2,grey=_S.color("#cccccc");
      let L,R,F,offX, offY;
      R= _S.rect(120,72,grey,grey,4);
      _S.centerAnchor(R);
      R.addChild(_S.centerAnchor(_S.bmpText("->",cfg)));
      offY=K*R.height/2;
      offX=offY;
      _V.set(R, Mojo.width-offX-R.width/2, Mojo.height-offY-R.height/2);
      scene.insert(_S.opacity(_I.makeHotspot(R),alpha));
      //////
      //////
      L= _S.rect(120,72,grey,grey,4);
      _S.centerAnchor(L);
      L.addChild(_S.centerAnchor(_S.bmpText("<-",cfg)));
      _S.pinLeft(R,L,offX/2);
      scene.insert(_S.opacity(_I.makeHotspot(L),alpha));
      //////
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      R.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT) }
      L.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT) }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("HUD",{
      setup(){
        if(1||Mojo.touchDevice) _touches(this);
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor(),
              {tiledWidth,tiledHeight, tilesInX,tilesInY,tileW,tileH}=self.tiled;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let {row,column}= self.getNamedItem("startpos")[0];
            let x,y,items=self.getObjectGroup("items");
            items.sprites.forEach(s=>s.visible=false);
            let cps= self.getNamedItem("check").sort((a,b)=>{
              return a.order<b.order?-1:(a.order>b.order?1:0)
            });
            let r,p,s= this.mkCar("red");
            x=column*tileW+s.width/2;
            y=row*tileH+s.height/2;
            p=_S.sprite("start.png");
            _S.centerAnchor(p);
            p.angle=90;
            p.x=x+tileW+2;
            p.y=y;
            self.insert(_S.scaleBy(p,0.2,0.2));
            ////////
            s.x=x;
            s.y=y;
            s.m5.maxSpeed=400;
            s.m5.speed=s.m5.maxSpeed;
            s.m5.tick=(dt)=>{
              s["2d"].onTick(dt)
            };
            self.insert(Mojo.addMixin(s,"2d"),true);
            let p1=this.cfgCar(this.mkCar("green"),cps);
            let p2=this.cfgCar(this.mkCar("orange"),cps);
            return _.inject(_G,{
              car:s,
              racers:[s,p1,p2]
            });
          },
          mkCar(color){
            let K=Mojo.getScaleFactor(),
                s=_S.sprite(`${color}.png`);
            _S.centerAnchor(_S.scaleBy(s,0.08*K,0.08*K));
            s.m5.type=E_CAR;
            s.m5.cmask=E_CAR;
            s.m5.maxSpeed=280*K;
            s.m5.speed=s.m5.maxSpeed;
            s.m5.vel[0] = s.m5.speed;
            return s;
          },
          cfgCar(p1,cps){
            let K=Mojo.getScaleFactor(),
                A=0.05*K,r,R=K*p1.width*2.2;
            p1.g.cps=cps.slice();
            p1.g.cpn=0;
            while(1){
              r=_.randItem(cps); if(r.angle!==undefined){break;}}
            p1.x=r.column*tileW+tileW/2;
            p1.y=r.row*tileH+tileH/2;
            p1.angle=r.angle;
            p1.g.cpn=cps.indexOf(r);
            p1.m5.tick=(dt)=>{
              let c= p1.g.cps[p1.g.cpn];
              let t=[c.column*tileW+tileW/2,
                     c.row*tileH+tileH/2];
              let dx=t[0]-p1.x;
              let dy=t[1]-p1.y;
              let a,dr,D=Math.sqrt(dx*dx+dy*dy);
              if(D<R){//next checkpoint
                p1.g.cpn= (p1.g.cpn+1)%p1.g.cps.length;
              }else{
                p1.m5.angVel = sin(p1.rotation-Math.atan2(dy,dx))<0? A : -A;
                p1.rotation += p1.m5.angVel;
                p1.m5.vel[0]=cos(p1.rotation)*p1.m5.speed;
                p1.m5.vel[1]=sin(p1.rotation)*p1.m5.speed;
                p1["2d"].onTick(dt)
              }
            };
            return self.insert(Mojo.addMixin(p1,"2d"),true);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        Mojo.addMixin(this,"camera2d", tiledWidth, tiledHeight,Mojo.canvas);
      },
      postUpdate(dt){
        if(_I.keyDown(_I.LEFT)){
          _G.car.angle -= 3;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.car.angle += 3;
        }
        _G.car.m5.vel[0] = cos(_G.car.rotation)*_G.car.m5.speed;
        _G.car.m5.vel[1] = sin(_G.car.rotation)*_G.car.m5.speed;

        for(let a,i=_G.racers.length-1;i>=0;--i){
          a=_G.racers[i];
          this.searchSGrid(a).forEach(o=>{
            _S.collide(a,o);
          });
        }

        this["camera2d"].follow(_G.car);
      }
    },{sgridX:128,sgridY:128,centerStage:true, tiled:{name:"racing.json",factory:_objF}});

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roadTextures_tilesheet.png",
                 "towerDefense_tilesheet.png",
                 "red.png","green.png","orange.png",
                 "start.png","bg.png","racing.json","click.mp3"],
    arena: {width: 1680, height: 1050, scale:1},
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


