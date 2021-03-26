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

  window["io/czlab/reversi/Scenes"]=function(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Tiles:_T,
           Game:_G,
           ute:_,is,EventBus}=Mojo;

    _G.playSnd=function(snd){
      let s, {pcur}=_G;
      if(pcur===_G.X) s="x.mp3";
      if(pcur===_G.O) s="o.mp3";
      if(snd){s=snd}
      if(s) Mojo.sound(s).play();
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
      let {grid}=_G,
          gf=grid[0], gl = grid[grid.length-1];
      ctx.strokeStyle= "white";
      ctx.lineWidth=4;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
    }

    /**
     * @private
     * @function
     */
    function _drawGrid(ctx){
      let bx=_S.gridBBox(0,0,_G.grid);
      _S.drawGridBox(bx,4,"white",ctx);
      _S.drawGridLines(0,0,_G.grid,4,"white",ctx);
    }

    function _seeder(){
      let out=[];
      for(let i=0;i<_G.DIM;++i)
        out[i]= _.fill(_G.DIM,0);
      return out;
    }

    _Z.defScene("level1",{
      onAI(pos){
        //let t= this.getChildById(`tile${pos}`);
        //Mojo.EventBus.pub(["ai.moved",t]);
      },
      _initLevel(options){
        let z=_S.sprite("icons.png");
        let g=_S.gridSQ(_G.DIM,0.9);
        let c=g[0][0];
        let K=(c.y2-c.y1)/z.height;
        _G.iconSize=[z.height,z.height];
        _G.iconScale=[K,K];
        _.inject(_G,{lastWin: 0,
                     ai: null,
                     grid: g,
                     pnum: _G.X,
                     cells: _seeder(),
                     mode: options.mode,
                     level: options.level,
                     pcur: options.startsWith||_G.X,
                     players: _.jsVec(null,null,null)});
        return 1;
      },
      setup(options){
        let mode=this._initLevel(options);
        let self=this;
        let {cells,grid,
             iconSize,iconScale}=_G;
        //let sz=_G.state.get("iconSize");
        //let scale= _G.state.get("iconScale");
        //let cells=_G.state.get("cells");
        //let self=this,grid=_G.state.get("grid");
        this.insert(_G.Backgd());
        let box=_S.group(_S.drawBody(_drawGrid));
        _S.setXY(box,grid[0][0].x1,grid[0][0].y1);
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
            s=_G.Tile(id, b[0],b[1],
                      iconSize[0],iconSize[1], {gpos: [r,c], gval: v});
            this.insert(s);
          }
        }
        cells[3][3]=1;//black
        cells[3][4]=2;
        cells[4][3]=2;
        cells[4][4]=1;
        //decide who plays X and who starts
        if(mode===1){
          let a= this.AI=_G.AI(this,_G.O);
          a.scene=this;
          //Mojo.EventBus.sub(["ai.moved",this],"onAI");
          _G.ai=a;
          //ai starts?
          if(_G.pcur===_G.O){
            _.delay(100, () => EventBus.pub(["ai.move", a]))
          }
        }
      }
    });

  };


})(this);

