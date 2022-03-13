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

  /**/
  function scenes(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in game modules
    window["io.czlab.tetris.models"](Mojo);
    window["io.czlab.tetris.logic"](Mojo);

    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           FX:_T,
           Input:_I,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_, is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const C_TITLE=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b"),
      TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //set up some globals
    _.inject(_G,{
      CELLS:4,
      cur:UNDEF,
      next:UNDEF,
      backDropSprite:UNDEF
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Tetris",TITLE_FONT, 120*K);
            _V.set(_S.tint(s,C_TITLE),Mojo.width/2,Mojo.height *0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT, 72*K);
            t=_T.throb(s,0.747,0.747);
            function cb(){
              Mojo.off(["single.tap"],cb);
              _S.tint(s, C_ORANGE);
              _T.remove(t);
              playClick();
              _.delay(CLICK_DELAY, ()=> {
                _Z.runEx("PlayGame");
                _Z.run("HUD");
              });
            }
            Mojo.on(["single.tap"],cb);
            _V.set(s,Mojo.width/2,Mojo.height * 0.7);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let os={fontName:UI_FONT,
                fontSize: 72*Mojo.getScaleFactor()},
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=>{
          _Z.runEx("PlayGame");
          _Z.run("HUD");
        };
        s6.m5.press=()=> _Z.runEx("Splash");
        this.insert(_Z.layoutY([s1,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      onPtrDown(){
        if(_G.cur){
          _G.dragMode=true;
          _G.cur.sx=Mojo.mouse.x;
          _G.cur.sy=Mojo.mouse.y; }
      },
      onPtrUp(){
        _G.dragMode=false },
      onPtrMove(){
        if(_G.cur && _G.dragMode){
          let reset,
              dx=Mojo.mouse.x - _G.cur.sx,
              dy=Mojo.mouse.y - _G.cur.sy;
          if(Math.abs(dx)>=_G.tileW){
            _G.shiftHZ(dx>0?1:-1);
            reset=true;
          }
          if(dy>=_G.tileH){
            _G.shiftDown();
            reset=true;
          }
          if(reset){
            _G.cur.sx=Mojo.mouse.x;
            _G.cur.sy=Mojo.mouse.y; }
        }
      },
      onSwipeDown(){ _G.dropDown() },
      postUpdate(){
        if(_G.gameOver){
          this.m5.dead=true;
          _.delay(100, ()=> {
            Mojo.sound("game_over.mp3").play();
            _I.resetAll();
            _Z.run("EndGame");
          });
        }else{
          let sx=_G.vbox.x1,
              sy=_G.vbox.y1,
              ex=_G.vbox.x2,
              ey=_G.vbox.y2;
          //show the grid
          _G.gfx.clear();
          _G.gfx.lineStyle(1,_S.color("#cccccc"),0.2);
          for(let i=1;i<_G.rows;++i){
            _G.gfx.moveTo(sx,sy+i*_G.tileH);
            _G.gfx.lineTo(ex,sy+i*_G.tileH);
          }
          for(let i=1;i<_G.cols;++i){
            _G.gfx.moveTo(sx+i*_G.tileW,sy);
            _G.gfx.lineTo(sx+i*_G.tileW,ey);
          }
        }
      },
      setup(){
        let self=this,
          H=Mojo.u.rows,
          W=Mojo.u.cols,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let grid=[],
              a= _S.gridXY([W,H],0.8,0.8),
              x1,y1,X=0,Y=Mojo.height, a0=a[0][0];
            _G.tileW=_.evenN(a0.x2-a0.x1);
            _G.tileH=_G.tileW;
            _G.gameOver=false;
            _G.grid=grid;
            _G.score=0;
            _G.rows=H;
            _G.cols=W;
            _G.cur=
            _G.next=UNDEF;
            //make it taller but hide the top 4
            for(let row,y=0;y<(4+H);++y){
              grid.push(row=[]);
              for(let x=0;x<W;++x) row.push(null);
            }
            //center the arena
            H= _G.tileH*_G.rows;
            W=_G.tileW*_G.cols;
            x1=_M.ndiv(Mojo.width-W,2);
            y1=_M.ndiv(Mojo.height-H,2);
            return _G.vbox={x1,x2:x1+W,y1,y2:y1+H};
          },
          initInput(){
            _G.rightMotion= _I.keybd(_I.RIGHT);
            _G.leftMotion= _I.keybd(_I.LEFT);
            _G.upMotion= _I.keybd(_I.UP);
            _G.downMotion= _I.keybd(_I.DOWN);
            _G.dropMotion= _I.keybd(_I.SPACE);
            _G.rightMotion.press=()=> _G.shiftHZ(1);
            _G.leftMotion.press=()=> _G.shiftHZ(-1);
            _G.upMotion.press=()=> _G.rotateCCW();
            _G.downMotion.press=()=> _G.shiftDown();
            _G.dropMotion.press=()=> _G.dropDown();
            if(Mojo.touchDevice){
              Mojo.on(["touchstart"],"onPtrDown",self);
              Mojo.on(["touchend"],"onPtrUp",self);
              Mojo.on(["touchmove"],"onPtrMove",self);
            }else{
              Mojo.on(["mouseup"],"onPtrUp",self);
              Mojo.on(["mousedown"],"onPtrDown",self);
              Mojo.on(["mousemove"],"onPtrMove",self);
            }
            Mojo.on(["swipe.down"],"onSwipeDown",self);
            return this;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _G.gameScene=this;
        this.g.initLevel() && this.g.initInput();
        this.insert(_G.gfx= _S.graphics());
        this.futureX(()=>{ _.shuffle(_G.ModelList) },500);
        Mojo.on(["single.tap"],_.debounce(()=>{
          if(Mojo.mouse.x >= _G.vbox.x1 && Mojo.mouse.x <= _G.vbox.x2 &&
             Mojo.mouse.y >= _G.vbox.y1 && Mojo.mouse.y <= _G.vbox.y2 &&
             _G.cur)
            _G.rotateCCW();
        },150));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor(), LW=30*K;
        Mojo.on(["preview.shape"],"onPreview", this);
        this.insert(_S.rect(Mojo.width,_G.vbox.y1, 0));
        this.insert(_S.bboxFrame(_G.vbox,LW));
        this.insert(this.g.score= _S.bmpText("Score: 0", UI_FONT,84*K));
        let Y = _M.ndiv(Mojo.height,2),
            X = _M.ndiv(_G.vbox.x1,2),
            r= _S.rect(_G.tileW*6,_G.tileH*6,0);
        _V.set(r, X - _M.ndiv(r.width,2), Y - _M.ndiv(r.height,2));
        _G.previewBox=r;
        ////////
        _G.gameScene.insert(_S.bboxFrame({x1:r.x, y1:r.y,
                                          x2:r.x+r.width,y2:r.y+r.height},LW));
        _G.previewNext();
        _.delay(343, ()=> _G.reifyNext() && _G.slowDown());
        _Z.run("AudioIcon",{
          xScale:2*K, yScale:2*K,
          xOffset: -10*K, yOffset:0
        });
      },
      onPreview(s){
        let X = _G.previewBox.x + _G.previewBox.width/2,
            Y = _G.previewBox.y + _G.previewBox.height/2,
            wy= _G.tileH* s.lines[2],
            wx= s.cells[0].length*_G.tileW;
        X = int(X- wx/2);
        Y= int(Y- wy/2);
        s.col=0;
        s.row=0;
        for(let r,k,w=0,y=0;y<s.cells.length;++y){
          r=s.cells[y];
          k=0;
          for(let p,x=0;x<r.length;++x){
            if(r[x]){
              _V.set(r[x],X+(s.col+x)*_G.tileW,
                          Y-((s.row-w)+1)*_G.tileH);
              r[x].visible=true;
              ++k;
            }
          }
          if(k) ++w;
        }
      },
      postUpdate(){
        this.g.score.text=`Score: ${_G.score}`;
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({
    assetFiles: ["click.mp3","line.mp3",
                 "audioOn.png","audioOff.png",
                 "tile.png", "bg.jpg", "game_over.mp3"],
    arena: {width: 768, height: 1408},
    scaleToWindow:"max",
    scaleFit:"y",
    cols:12,
    rows:22,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }
  }));

})(this);


