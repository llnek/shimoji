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
    function doBackDrop(scene){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.jpg"));
      return scene.insert(_S.opacity(_G.backDropSprite));
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
    const FONTCFG={fontName:UI_FONT,fontSize:128*Mojo.getScaleFactor()};

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function initCache(w,h,cache){
      const K=Mojo.getScaleFactor(), cfg= FONTCFG;
      _G.NUMS.forEach(n=>{
        let z=_G.NUMS.length+1;
        let out=[];
        for(let c,s,i=0;i<z;++i){
          s=_S.centerAnchor(_S.sprite("cell.png"));
          c=_S.centerAnchor(_S.bmpText(n,cfg));
          //c.tint=_S.color("black");
          s.addChild(c);
          s=_S.sizeXY(s,w,h);
          out.push(s);
        }
        cache[+n]=out;
      });
      return cache;
    }

    function deselect(){
      if(_G.curMarked){
        _G.curMarked.g.marked=false;
        whichColor(_G.curMarked);
        _G.curMarked=null;
      }
    }
    function select(s){
      if(_G.curMarked!==s){
        _G.curMarked=s;
        s.g.marked=true;
        s.tint=_S.color("black");//"#d2f22e");
      }
      return s;
    }
    function erase(){
      let s= _G.curMarked;
      if(s && s.g.value !=0){
        _G.prevAction=new Deletion(s);
        delNum(s);
        s.g.value=0;
        _G.sudoku[s.g.row][s.g.col]=0;
        idleColor(s);
        _G.curMarked=null;
      }
    }
    function idleColor(s){
      s.g.value=0;
      return whichColor(s);
    }
    function assign(v){
      let s=_G.curMarked;
      if(s){
        _G.prevAction=new Assignment(s,v);
        s.g.marked=false;
        s.g.value=v;
        addNum(s,v);
        whichColor(s);
        _G.sudoku[s.g.row][s.g.col]=v;
        _G.curMarked=null;
      }
    }
    function whichColor(s){
      if(s.g.value != 0){
        s.tint=_S.color("#f1ad2e");
      }else{
        s.tint=_S.color("#e6e83b");
      }
      return s;
    }
    function addNum(s,v){
      s.removeChildren();
      s.addChild(_S.centerAnchor(_S.bmpText(""+v,FONTCFG)));
    }
    function delNum(s){
      s.removeChildren();
    }

    function undoMarked(s){
      s.g.marked=false;
      if(_G.curMarked){
        _G.curMarked.g.marked=false;
        _G.curMarked=null;
      }
    }

    class Action{
      constructor(){ }
      postUndo(s){
        _G.sudoku[s.g.row][s.g.col]=this.prevValue;
        if(this.prevValue==0)
          delNum(s);
        else
          addNum(s,this.prevValue);
        undoMarked(s);
        whichColor(s);
      }
    }
    class Assignment extends Action{
      constructor(s,v){
        super();
        this.cell=s;
        this.prevValue=s.g.value;
      }
      undo(){
        this.cell.g.value=this.prevValue;
        this.postUndo(this.cell);
      }
    }
    class Deletion extends Action{
      constructor(s){
        super()
        this.cell=s;
        this.prevValue=s.g.value;
      }
      undo(){
        this.cell.g.value=this.prevValue;
        this.postUndo(this.cell);
      }
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
              tileW:w,
              tileH:h,
              grid,
              sudoku:_G.sudoku(),
              cache: initCache(w,h,{})
            });
            return this;
          },
          initGame(){
            for(let r,game=_G.sudoku, y=0;y<_G.DIM;++y){
              r=_G.grid[y];
              for(let cx,cy,v,s,g,x=0;x<_G.DIM;++x){
                g=r[x];
                cx=int((g.x1+g.x2)/2);
                cy=int((g.y1+g.y2)/2);
                if((v=game[y][x]) != 0){
                  s= _G.cache[v].pop();
                  s.tint=_S.color("#f27c2e");
                  s.g.value=v;
                  self.insert(_V.set(s,cx,cy));
                }else{
                  s=_S.sprite("cell.png");
                  s.g.value=0;
                  s.g.cell=true;
                  idleColor(s);
                  _V.set(_S.centerAnchor(s),cx,cy);
                  s.m5.press=()=>{
                    if(_G.curMarked!==s){
                      deselect();
                      select(s);
                    }
                  }
                  self.insert(_S.sizeXY(_I.mkBtn(s),_G.tileW,_G.tileH));
                }
                s.g.row=y;
                s.g.col=x;
              }
            }
            return this;
          },
          initSel(){
            let K=Mojo.getScaleFactor(),
                pad= 8 *K,
                g=_G.grid[0][0],
                w=g.x2-g.x1,
                p,h=g.y2-g.y1,
                W=_S.color("white"),
                C=_S.color("#56d5ef");
            for(let n,i=0;i<_G.NUMINTS.length;++i){
              n=_G.NUMINTS[i];
              let s= _G.cache[n].pop();
              s.children[0].tint=W;
              s.g.value=n;
              s.tint=C;
              if(n==1){
                s.y= int((g.y1+g.y2)/2);
                s.x= int((g.x1+g.x2)/2) - s.width - pad;
                p= self.insert(_I.mkBtn(s));
              }else{
                _S.pinBottom(p,s,0);
                p=self.insert(_I.mkBtn(s));
              }
              s.m5.press=()=>{
                assign(s.g.value);
              };
            }
            return this;
          },
          initHUD(){
            let p,s=_S.sizeXY(_S.sprite("cell.png"),_G.tileW,_G.tileH);
            let g=_G.grid[0][_G.grid[0].length-1];
            let K=Mojo.getScaleFactor();
            let cy= int((g.y1 +g.y2)/2);
            let cx= int(g.x2 + 8*K + s.width/2);
            //let cfg={fontName:UI_FONT,fontSize:256*K};
            _V.set(_S.centerAnchor(s),cx,cy);
            s.addChild(_S.centerAnchor(_S.bmpText("U",FONTCFG)));
            s.m5.press=()=>{
              if(_G.prevAction){
                _G.prevAction.undo();
                _G.prevAction=null;
              }
            }
            s.tint=_S.color("magenta");
            this.undoBtn=s;
            p=self.insert(_I.mkBtn(s));
            ///
            let s2=_S.sizeXY(_S.sprite("cell.png"),_G.tileW,_G.tileH);
            _S.centerAnchor(s2);
            s2.addChild(_S.centerAnchor(_S.bmpText("X",FONTCFG)));
            s2.m5.press=()=>{
              erase();
            }
            s2.tint=_S.color("red");
            this.eraseBtn=s2;
            _S.pinBottom(p,s2,0);
            return self.insert(_I.mkBtn(s2));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() &&
          this.g.initGame() && this.g.initSel() && this.g.initHUD();
      },
      postUpdate(dt){
        if(this.g.undoBtn){
          this.g.undoBtn.alpha= _G.prevAction?1:0.4;
        }
        if(this.g.eraseBtn){
          let found;
          for(let s,i=0; i<this.children.length;++i){
            s=this.children[i];
            if(s.g && s.g.cell && s.g.value != 0){
                found=1;
                break;
            }
          }
          this.g.eraseBtn.alpha= found?1:0.4;
        }
        if(_I.keyDown(_I.SPACE)){
          console.log("==> " + JSON.stringify(_G.sudoku));
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bg.jpg","cell.png","click.mp3"],
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


