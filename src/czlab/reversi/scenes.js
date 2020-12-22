;(function(window){
  "use strict";

  window["io.czlab.reversi.Scenes"]=function(Mojo){
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _I=Mojo.Input;
    const _T=Mojo.Tiles;
    const _G= Mojo.Game;
    const _= Mojo.u;

    _G.playSnd= (snd) => {
      return;
      let s,c= _G.state.get("pcur");
      if (c===_G.X) s="x.mp3";
      if (c===_G.O) s="o.mp3";
      if(snd)
        s=snd;
      if(s)
        Mojo.sound(s).play();
    };

    _Z.defScene("Splash",function(){
    });

    _Z.defScene("EndGame",{
    });

    _Z.defScene("StartMenu", function(options){
    });

    _Z.defScene("MainMenu", function(){
    });

    function _drawBox(ctx){
      let grid=_G.state.get("grid"),
          gf = grid[0], gl = grid[grid.length-1];
      ctx.strokeStyle= "white";
      ctx.lineWidth=4;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
    }
    /**
     * @private
     * @function
     */
    function _drawGrid(ctx){
      let dim = _G.DIM,
          dm1=dim-1,
          grid=_G.state.get("grid"),
          gf = grid[0][0], gl = grid[dm1][dm1];
      ctx.lineStyle(4,_S.color("white"),1);
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      for(let r,i=0;i<dm1;++i){
        r=grid[i];
        ctx.moveTo(r[0].x1,r[0].y2);
        ctx.lineTo(r[dm1].x2,r[dm1].y2);
      }

      let s=grid[0];
      let e=grid[dm1];
      for(let i=0;i<dm1;++i){
        ctx.moveTo(s[i].x2,s[i].y1);
        ctx.lineTo(e[i].x2,e[i].y2);
      }
    }

    function _seeder(){
      let out=[];
      for(let i=0;i<_G.DIM;++i)
        out[i]= _.fill(new Array(_G.DIM),0);
      return out;
    }

    /**
     * @public
     */
    _Z.defScene("PlayGame",{
      onAI(pos){
        //let t= this.getChildById(`tile${pos}`);
        //Mojo.EventBus.pub(["ai.moved",t]);
      },
      _initLevel(options){
        _G.state.set("iconSize",[120,120]);
        let grid= _T.mapGridPos(_G.DIM,_G.gridLineWidth,0.9),
            mode=options.mode,
            cz= _S.bboxSize(grid[0][0]);
        _G.state.set({level: options.level,
                      lastWin: 0,
                      ai: null,
                      mode: mode,
                      pnum: _G.X,
                      pcur: options.startsWith||_G.X,
                      grid: grid,
                      cells: _seeder(),
                      //goals: G.mapGoalSpace(),
                      players: _.jsVec(null,null,null),
                      iconScale: Mojo.scaleXY(_G.state.get("iconSize"),cz) });
        return mode;
      },
      onCanvasResize(old){
        let g=_T.mapGridPos(_G.DIM,_G.gridLineWidth,0.9);
        let cz= _S.bboxSize(g[0][0]);
        _G.state.set("grid", g);
        _G.state.set("iconScale", Mojo.scaleXY(_G.state.get("iconSize"),cz));
        _S.resize({x:0,y:0,width:old[0],height:old[1],children:this.children});
      },
      setup(options){
        let mode=this._initLevel(options);
        let sz=_G.state.get("iconSize");
        let scale= _G.state.get("iconScale");
        let cells=_G.state.get("cells");
        let self=this,grid=_G.state.get("grid");
        this.insert(_G.Backgd());
        let box=_S.group(_S.drawBody(_drawGrid));
        box.x=grid[0][0].x1;
        box.y=grid[0][0].y1;
        box.mojoh5.resize=function(){
          box.removeChildren();
          let g=_G.state.get("grid");
          let b=_S.drawBody(_drawGrid);
          box.addChild(b);
          box.x=g[0][0].x1;
          box.y=g[0][0].y1;
        };
        this.insert(box);
        for(let a,r=0;r<grid.length;++r){
          a=grid[r];
          for(let v,s,id,b,c=0;c<a.length;++c){
            b=_S.bboxCenter(a[c]);
            id= `${r}:${c}`;
            v=0;
            if(r===3){
              if(c===3)v=1;
              if(c===4)v=2;
            }
            if(r===4){
              if(c===3)v=2;
              if(c===4)v=1;
            }
            s=_G.Tile(b[0],b[1],sz[0],sz[1],{uuid: id, scale: scale, gpos: [r,c], gval: v});
            this.insert(s);
          }
        }
        cells[3][3]=1;//black
        cells[3][4]=2;
        cells[4][3]=2;
        cells[4][4]=1;
        //decide who plays X and who starts
        if(mode===1){
          let a= this.AI=_G.AI(G.O);
          a.scene=this;
          Mojo.EventBus.sub(["ai.moved",this],"onAI");
          _G.state.set("ai",a);
          //ai starts?
          if(_G.state.get("pcur")===G.O){
            _.delay(100, () => Mojo.EventBus.pub(["ai.move", a]))
          }
        }
      }
    });

  };


})(this);

