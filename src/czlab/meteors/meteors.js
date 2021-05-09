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

  /** all the scenes */
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_, is}=Mojo;

    window["io/czlab/meteors/models"](Mojo);

    /** background */
    _Z.defScene("bg",{
      setup(){
        let s,K= Mojo.getScaleFactor();
        //background sky
        s=_S.sprite("bg.png");
        s=_S.sizeXY(s,Mojo.width,Mojo.height);
        this.insert(s);

        //cityscape back
        s=_S.sprite("city1.png");
        s=_S.scaleXY(s,K,K);
        _V.set(s,0,Mojo.height-s.height*1.2);
        this.insert(s);
        s=_S.sprite("city1.png");
        s=_S.scaleXY(s,K,K);
        _V.set(s,s.width,Mojo.height-s.height*1.2);
        this.insert(s);

        //cityscape front
        s=_S.sprite("city2.png");
        s=_S.scaleXY(s,K,K);
        _V.set(s,0,Mojo.height-s.height);
        this.insert(s);
        s=_S.sprite("city2.png");
        s=_S.scaleXY(s,K,K);
        _V.set(s,s.width,Mojo.height-s.height);
        this.insert(s);

        //plant some trees
        for(let i=0;i<4;++i){
          s=_S.sprite("trees.png");
          s=_S.scaleXY(s,K,K);
          _V.set(s,i*s.width,Mojo.height-s.height);
          this.insert(s);
        }
        _G.cityLine=Mojo.height - s.height;


        this.g.clouds=[];
        //how about some clouds
        for(let x,y,i=0;i<4;++i){
          s=_S.sprite("cloud.png");
          y = Mojo.height*(i%2? 0.06 : 0.02);
          x=Mojo.width * 0.1 + i* Mojo.width * 0.3;
          _S.scaleXY(s,K,K);
          _V.set(s,x,y);
          this.insert(s);
          this.g.clouds.push(s);
        }
        this._updateClouds();
      },
      _updateClouds(){
        this.g.clouds.forEach(c=>{
          c.x -= 1;
          if(c.x+c.width<0) c.x=Mojo.width;
        });
        _.delay(84,()=> this._updateClouds());
      }
    });

    /** game */
    _Z.defScene("game",{
      _initLevel(){
        _G.ufo= new _G.UfoSM(this);
        _G.meteors=new _G.MeteorSM(this);
        _G.bomb=new _G.BombSM(this);
        _G.health=new _G.HealthPackSM(this);
      },
      onClick(){
        _G.bomb.discharge(Mojo.mouse.x,Mojo.mouse.y);
      },
      setup(){
        this._initLevel();
        Mojo.on(["single.tap"],"onClick",this);
      },
      postUpdate(dt){
        _G.meteors.lifeCycle(dt);
        _G.ufo.lifeCycle(dt);
        _G.health.lifeCycle(dt);
      }
    });
  }

  const _$={
    assetFiles: ["bg.png","city1.png","city2.png","pics.png","images/pics.json"],
    arena: {width:2048,height:1536},
    scaleToWindow: "max",
    scaleFit:"x",

    meteorInterval: 3.5,
    meteorSpeed: 10,

    ufoInterval: 10,//20,
    ufoSpeed:8,

    healthInterval: 15,
    healthSpeed: 10,

    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("game");
    }
  };

  //load and run
  window.addEventListener("load", ()=>MojoH5(_$));

})(this);
