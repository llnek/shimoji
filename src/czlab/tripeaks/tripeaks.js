;(function(window){
  "use strict";

  function scenes(Mojo){
    let _GS=Mojo.Game.state;
    let _G=Mojo.Game;
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;

    _Z.defScene("bg",{
      setup(){
        let s= _S.sprite("bg.jpg");
        let K=Mojo.scaleXY([s.width,s.height],[Mojo.width,Mojo.height]);
        s.scale.x=K[0];
        s.scale.y=K[1];
        s.x=Mojo.width/2;
        s.y=Mojo.height/2;
        s.anchor.set(0.5);
        this.insert(s);
      }
    });
    _Z.defScene("level1",{
      _initLevel(peaks=3){
        let m= new _G.TriPeakPyramidSolitaire(this);
        //let m= new _G.BasicPyramidSolitaire(this);
        m.startGame(m.getDeck(),7,3);
        _G.model=m;
      },
      clsBoard(){
        let numRows= _G.model.getNumRows();
        for(let i=0; i<numRows; ++i){
          let width=_G.model.getRowWidth(i);
          for(let c,j=0; j<width; ++j){
            c= _G.model.getCardAt(i,j);
            if(c && c.icon && c.icon.parent){
              _S.remove(c.icon);
            }
          }
        }
      },
      drawBoard(){
        let numRows= _G.model.getNumRows();
        let lastRow=numRows-1;
        let bottom= _G.model.getRowWidth(lastRow);
        let sw=_G.iconSize[0];
        let offsetv= _G.iconSize[1]*0.3;
        let gap=0;
        let max_width= bottom*sw + (bottom-1)*gap ;
        let left=(Mojo.width-max_width)/2;
        let top= _G.iconSize[1];
        let stackBottom= top;
        for(let i=0; i<numRows; ++i){
          let width=_G.model.getRowWidth(i);
          let row_width= width*sw + (width-1)*gap;
          let pc = (max_width-row_width)/2;
          for(let j=0; j<width; ++j){
            let c= _G.model.getCardAt(i,j);
            if(c){
              c.icon.x=left+pc;
              c.icon.y=top;
              this.insert(c.icon);
              stackBottom = c.icon.y+c.icon.height;
            }
            pc += _G.iconSize[0];
          }
          top += (_G.iconSize[1] - offsetv);
        }
        _G.pyramidBottom= stackBottom;
      },
      drawDrawer(){
        let lst= _G.model.getDrawCards();
        let top= _G.pyramidBottom+ _G.iconSize[1];
        let gap=0;
        //3 draw cards
        let width= 4 * _G.iconSize[0] + 3*gap;
        let left=(Mojo.width-width)/2;
        lst.forEach(c=>{
          if(c && c.icon){
            c.icon.x=left;
            c.icon.y=top;
            left += gap + _G.iconSize[0];
            c.visible=true;
            this.insert(c.icon);
          }
        });
      },
      setup(){
        this._initLevel();
        this.clsBoard();
        this.drawBoard();
        this.drawDrawer();
      },
      postUpdate(){

      }
    });
  }

  function setup(Mojo){
    window["io.czlab.tripeaks.models"](Mojo);
    scenes(Mojo);
    Mojo.Scenes.runScene("bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles:["bg.jpg","tiles.png","images/tiles.json"],
      //24x140, 10x190
      arena:{width:3360, height:1900},
      scaleToWindow:"max",
      start: setup
    })
  });

})(this);





