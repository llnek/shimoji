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

  function scenes(Mojo){

    //load in game modules
    window["io.czlab.tetris.models"](Mojo);
    window["io.czlab.tetris.logic"](Mojo);

    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           FX:_T,
           Input:_I,
           Game:_G,
           v2:_V,
           "2d":_2d,
           ute:_, is}=Mojo;

    _Z.defScene("level1",{
      _initLevel(){
        let K=Mojo.getScaleFactor();
        let b=_S.sprite("0.png");
        let H=Mojo.u.rows;
        let W=Mojo.u.cols;
        let Y=Mojo.height;
        let X=0;
        let grid=[];

        _S.scaleXY(b,K,K);
        _G.score=0;
        _G.grid=grid;
        _G.rows=H;
        _G.cols=W;
        _G.scaleX=K;
        _G.scaleY=K;
        _G.tileW=MFL(b.width);
        _G.tileH=MFL(b.height);

        for(let row,y=0;y<(H+4);++y){
          grid.push(row=[]);
          for(let x=0;x<W;++x)
            row.push(null);
        }

        //center the arena
        H= _G.tileH*_G.rows;
        W=_G.tileW*_G.cols;
        let x1=MFL((Mojo.width-W)/2);
        let y1=MFL((Mojo.height-H)/2);
        let x2=x1+W;
        let y2=y1+H;

        _G.vbox={x1,x2,y1,y2};
        return this;
      },
      _initBlockMap(){
        let b=_S.sprite("0.png");
        for(let s,y=_G.rows-1;y>=0;--y){
          for(let p,x=0;x<_G.cols;++x){
            s=_S.sprite("3.png");
            s.scale.x=_G.scaleX;
            s.scale.y=_G.scaleY;
            s.x=_G.tileW*x;
            s.y=_G.vbox.y2-_G.tileH*(y+1);
            this.insert(s);
          }
        }
        return this;
      },
      _ctrl(){
        let K=Mojo.getScaleFactor();
        let j=Mojo.Touch.joystick({
          onChange(dir,angle,power){
            if(Mojo.sideRight(dir)){
              _G.rightMotion.press()
            }
            if(Mojo.sideLeft(dir)){
              _G.leftMotion.press()
            }
          }
        });
        j.x=MFL((Mojo.width-_G.vbox.x2)/2+_G.vbox.x2);
        j.y=MFL(Mojo.height/2);
        this.insert(j);
      },
      setup(){
        this._initLevel();
        let bg= _S.rectangle(_G.cols*_G.tileW,10+_G.rows*_G.tileH,0,"white",1);
        let r= _G.rightMotion= _I.keybd(_I.RIGHT);
        let f= _G.leftMotion= _I.keybd(_I.LEFT);
        let u= _G.upMotion= _I.keybd(_I.UP);
        let d= _G.downMotion= _I.keybd(_I.DOWN);
        let s= _G.dropMotion= _I.keybd(_I.SPACE);
        r.press=()=>{ _G.shiftRight(this,_G.curShape) };
        f.press=()=>{ _G.shiftLeft(this,_G.curShape) };
        u.press=()=>{ _G.rotateCCW(this,_G.curShape) };
        d.press=()=>{ _G.moveDown(this,_G.curShape) };
        s.press=()=>{ _G.dropDown(this,_G.curShape) };
        bg.x=_G.vbox.x1;
        bg.y=_G.vbox.y1-10;
        this.insert(bg);

        this._ctrl();

        _G.gameScene=this;
        _G.previewNext(this);
        _G.slowDown(this,_G.reifyNextShape(this));
      },
      previewNext(){
        _G.previewNext(this) },
      postUpdate(){
        //if(_G.gameOver) _.log("Over!");
      }
    });

    _Z.defScene("hud",{
      setup(){
        let s= this.score= _S.bitmapText("0",{
          fontName:"unscii",fontSize:32,fill:"white"
        });
        Mojo.on(["preview.shape",this],"onPreview");
        this.insert(s);

        let r= _S.rectangle(_G.tileW*6,_G.tileH*6,0,"white",1);
        let Y = MFL(Mojo.height/2);
        let X = MFL(_G.vbox.x1/2);
        Y -= MFL(r.height/2);
        X -= MFL(r.width/2);
        r.x = X;
        r.y = Y;
        _G.previewBox=r;
        _G.gameScene.insert(r);

        _G.hud=this;
        _G.gameScene.previewNext();
      },
      onPreview(s){
        let X = _G.previewBox.x;
        let Y = _G.previewBox.y;
        X += _G.tileW;
        Y += 2*_G.tileH;
        s.col=0;
        s.row=0;
        for(let k=0,r,y=0;y<s.tiles.length;++y){
          r=s.tiles[y];
          for(let p,x=0;x<r.length;++x){
            if(r[x]===1){
              _V.set(s.cells[k],X+(s.col+x)*_G.tileW,
                                Y-((s.row-y)+1)*_G.tileH);
              s.cells[k].visible=true;
              ++k;
            }
          }
        }
      },
      postUpdate(){
        this.score.text=`Score: ${_G.score}`;
      }
    });
  }

  const _$={
    assetFiles: ["1.png","2.png","3.png",
                 "4.png","5.png","6.png","0.png"],
    arena: {width: 768, height: 1408},
    scaleToWindow:"max",
    scaleFit:"y",
    cols:12,
    rows:22,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


