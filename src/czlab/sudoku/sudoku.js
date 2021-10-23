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
    window["io/czlab/sudoku/model"](Mojo);

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
          s=_S.bmpText("Sudoku",{fontName:TITLE_FONT,fontSize:120*K});
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
            });
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
        _G.sudoku();
      }
    });


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      DIM:9,
      D3:3,
      DIMCNT:81,
      NUMS: "123456789".split(/(\d{1})/).filter(s=>s.length)
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      NUMINTS: _G.NUMS.map(n=> +n),
      NUMSTR: _G.NUMS.join("")
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function initCache(w,h,cache){
      const K=Mojo.getScaleFactor(),
            cfg={fontName:UI_FONT,fontSize:128*K};
      _G.NUMS.forEach(n=>{
        let out=[];
        for(let c,s,i=0;i<_G.NUMS.length;++i){
          s=_S.centerAnchor(_S.sprite("cell.png"));
          c=_S.centerAnchor(_S.bmpText(n,cfg));
          c.tint=_S.color("black");
          s.addChild(c);
          s=_S.sizeXY(s,w,h);
          out.push(s);
        }
        cache[+n]=out;
      });
      return cache;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            let out={};
            let grid= _S.gridSQ(9,0.9,out);
            let c= grid[0][0];
            let w= c.x2-c.x1;
            let h= c.y2-c.y1;
            let gfx=self.insert(_S.drawGridBox(out));
            _S.drawGridLines(0,0,grid,1,"white",gfx);
            _.inject(_G,{
              grid,
              sudoku:_G.sudoku(),
              cache: initCache(w,h,{})
            });
          },
          poo(){
            for(let r,game=_G.sudoku, y=0;y<_G.DIM;++y){
              r=_G.grid[y];
              for(let v,s,g,x=0;x<_G.DIM;++x){
                if((v=game[y][x]) != 0){
                  g=r[x];
                  s= _G.cache[v].pop();
                  s.x=int((g.x1+g.x2)/2);
                  s.y=int((g.y1+g.y2)/2);
                  self.insert(s);
                }
              }
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.g.poo();
      },
      postUpdate(dt){
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["cell.png","click.mp3"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


