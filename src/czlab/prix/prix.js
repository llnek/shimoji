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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           FX:_F,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil, abs=Math.abs;
    const sin=Math.sin, cos=Math.cos;
    const E_CAR=1;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Grand Prix",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bgblack.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _objF= {};

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor(true);
        let cfg={fontName:UI_FONT,fontSize:64*K};
        let alpha=0.5,grey=_S.color("#cccccc");
        let L,R,F,offX, offY,r=32*K;
        //////
        R= _S.circle(r,grey,grey,4);
        R.addChild(_S.anchorXY(_S.bmpText(">",cfg),0.5));
        offY=K*R.height/2;
        offX=offY;
        _V.set(R, Mojo.width-offX-R.width/2, Mojo.height-offY-R.height/2);
        this.insert(_S.opacity(_I.makeHotspot(R),alpha));
        //////
        L= _S.circle(r,grey,grey,4);
        L.addChild(_S.anchorXY(_S.bmpText("<",cfg),0.5));
        _S.pinLeft(R,L,offX/2);
        this.insert(_S.opacity(_I.makeHotspot(L),alpha));
        //////
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        R.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT) }
        L.m5.touch=(o,t)=>{ t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT) }
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
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
            _S.anchorXY(p,0.5);
            p.angle=90;
            p.x=x+tileW+2;
            p.y=y;
            self.insert(_S.scaleBy(p,0.2,0.2));
            ////////
            s.x=x;
            s.y=y;
            s.m5.maxSpeed=200;
            s.m5.speed=s.m5.maxSpeed;
            s.g.move=_U.Meander(s);
            s.m5.tick=(dt)=> s.g.move(dt) ;
            self.insert(s,true);
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
            _S.anchorXY(_S.scaleBy(s,0.08*K,0.08*K),0.5);
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
                p1.g.move(dt)
              }
            };
            p1.g.move=_U.Meander(p1);
            return self.insert(p1,true);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        _Z.run("HUD");
        this.g.cam= _U.Camera(this, tiledWidth, tiledHeight,Mojo.canvas);
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

        this.g.cam.follow(_G.car);
      }
    },{sgridX:128,sgridY:128,centerStage:true, tiled:{name:"racing.json",factory:_objF}});


    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["roadTextures_tilesheet.png",
                 "towerDefense_tilesheet.png",
                 "red.png","green.png","orange.png",
                 "start.png","bgblack.jpg","racing.json","click.mp3"],
    arena: {width: 1344, height: 840, scale:1},
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);


