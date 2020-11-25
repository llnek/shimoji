;(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _=Mojo.u;

    _Z.defScene("Bg",{
      setup(){
      }
    });

    function _initGrid(){
      //let g = _S.gridXY(45,30,0.8,0.8);
      let g = _S.gridSQ(30,0.8);
      let t=g[0][0];
      _G.tileX=t.x2-t.x1;
      _G.tileY=t.y2-t.y1;
      return g;
    }

    function _drawGrid(scene){
      let n= _S.drawGridLines(_G.grid,2,"#fff");
      let b= _S.drawGridBox(_G.grid,2,"#fff");
      scene.insert(b);
      scene.insert(n);
    }

    _Z.defScene("level1",{
      setup(){
        _G.grid= _initGrid();
        _drawGrid(this);
        this.makeSnake();
        this.grow();
        //Mojo.EventBus.sub(["post.update",this],"postUpdate");
        _.delay(500,()=>{ this.postUpdate(); });
      },
      grow(){
        _.delay(3000,()=>{
          _G.growSnake(this);
          this.grow();
        });
      },
      makeSnake(){
        _G.Snake(this,_.floor(_G.grid.length/2),_.floor(_G.grid[0].length/2));
      },
      postUpdate(){
        let c=_G.snakeDir;
        if(_I.keyDown(_I.keyRIGHT)){
          if(c !== Mojo.LEFT)
            _G.snakeMoveRight(this);
        } else if(_I.keyDown(_I.keyLEFT)){
          if(c !== Mojo.RIGHT)
            _G.snakeMoveLeft(this);
        } else if(_I.keyDown(_I.keyUP)){
          if(c !== Mojo.DOWN)
            _G.snakeMoveUp(this);
        } else if(_I.keyDown(_I.keyDOWN)){
          if(c !== Mojo.UP)
            _G.snakeMoveDown(this);
        } else if(c===Mojo.RIGHT){
          _G.snakeMoveRight(this);
        } else if(c===Mojo.LEFT){
          _G.snakeMoveLeft(this);
        } else if(c===Mojo.UP){
          _G.snakeMoveUp(this);
        } else if(c===Mojo.DOWN){
          _G.snakeMoveDown(this);
        }
        _.delay(500,()=>{ this.postUpdate(); });
      }
    });
  }

  function setup(Mojo){
    window["io.czlab.snake.models"](Mojo);
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load", ()=>{
    MojoH5({
      assetFiles:["head.png","snake.png"],
      arena: {width:640,height:480},
      scaleToWindow: "max",
      //backgroundColor: 0x51b2ee,
      backgroundColor:0x239920,
      tile: 32,
      start:setup
    })
  });
})(this);


