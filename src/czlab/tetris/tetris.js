;(function(window){
  "use strict";

  function scenes(Mojo){
    let _=Mojo.u, is=Mojo.is;
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _T=Mojo.Effects;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _2d= Mojo["2d"];

    _Z.defScene("Bg",{
      setup(){
      }
    });

    _Z.defScene("PlayGame", {
      markGrid(){
        let b=_S.sprite("0.png");
        let H=Mojo.cmdArg.rows;
        let W=Mojo.cmdArg.cols;
        let Y=Mojo.height;
        let w= Mojo.width/W;
        let X=0;
        let grid=[];
        for(let row,y=0;y<(H+4);++y){
          grid.push(row=[]);
          for(let x=0;x<W;++x)
            row.push(null);
        }
        _G.grid=grid;
        _G.tileW=w;
        _G.tileH=w;
        let s=Mojo.scaleXY([b.width,b.height],
                           [_G.tileW,_G.tileH]);
        _G.rows=H;
        _G.cols=W;
        _G.scaleX=s[0];
        _G.scaleY=s[1];
        _G.vbox={x1: X, y1: Y - H*w, x2: X+w*W, y2: Y};
        return this;
      },
      initBlockMap(){
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
      setup(){
        let r= this.rightMotion= _I.keyboard(_I.keyRIGHT);
        r.press=()=>{ _G.shiftRight(this,_G.curShape) };
        let f= this.leftMotion= _I.keyboard(_I.keyLEFT);
        f.press=()=>{ _G.shiftLeft(this,_G.curShape) };
        let u= this.upMotion= _I.keyboard(_I.keyUP);
        u.press=()=>{ _G.rotateCCW(this,_G.curShape) };
        let d= this.downMotion= _I.keyboard(_I.keyDOWN);
        d.press=()=>{ _G.moveDown(this,_G.curShape) };
        let s= this.dropMotion= _I.keyboard(_I.keySPACE);
        s.press=()=>{ _G.dropDown(this,_G.curShape) };
        this.markGrid();
        let bg= _S.rectangle(_G.cols*_G.tileW,_G.rows*_G.tileH,0);
        bg.x=_G.vbox.x1;
        bg.y=_G.vbox.y1;
        this.insert(bg);
        //this.initBlockMap();
        _G.previewNext(this);
        _G.slowDown(this,_G.reifyNextShape(this));
      }
    });
  }

  function setup(Mojo){
    window["io.czlab.tetris.models"](Mojo);
    window["io.czlab.tetris.logic"](Mojo);
    Mojo.state.set({
      score:0
    });
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("PlayGame");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["1.png","2.png","3.png",
                   "4.png","5.png","6.png","0.png"],
      arena: {width: 480, height: 960},
      scaleToWindow: true,
      start: setup,
      cols:12,
      rows:22
    });
  });

})(this);


