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
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           FX:_F,
           v2:_V,
           Game:_G,
           ute:_,is}=Mojo;
    const int=Math.floor;

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
          s=_S.bmpText("Maruo",{fontName:TITLE_FONT,fontSize:120*K});
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
            _.delay(CLICK_DELAY,()=> {
              _Z.runSceneEx("BackDrop");
              _Z.runScene("PlayGame");
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
    const _objFactory={

    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
      },
      postUpdate(dt){
      }
    },{sgridX:128,sgridY:128,centerStage:true,
       tiled:{name: "map.json",factory:_objFactory}
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("BackDrop",{
      setup(){
        this.insert(_S.fillMax(_S.sprite("sky.png")))
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["map.json","click.mp3","sky.png","platformPack_tilesheet.png"],
    arena: {width:1860, height:1050,scale:1},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5(_$) );

})(this);



