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
           v2:_V,
           ute:_,is}=Mojo;

    _G.playSnd=(snd)=>{
      let s, {pcur}=_G;
      if(pcur===_G.X) s="x.mp3";
      if(pcur===_G.O) s="o.mp3";
      if(snd){s=snd}
      if(s) Mojo.sound(s).play() };

    _Z.defScene("Splash",function(){
    });

    _Z.defScene("EndGame",{
    });

    _Z.defScene("StartMenu", function(options){
    });

    _Z.defScene("MainMenu", function(){
    });

    _Z.defScene("hud", {
      setup(){
      },
      postUpdate(){
      }
    });

    /** @ignore */
    function _drawBox(ctx){
      let {grid}=_G,
          gf=grid[0],
          gl = grid[grid.length-1];
      ctx.strokeStyle= "white";
      ctx.lineWidth=4;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1) }

    /** @ignore */
    function _drawGrid(ctx){
      let bx=_S.gridBBox(0,0,_G.grid);
      _S.drawGridBox(bx,4,"white",ctx);
      _S.drawGridLines(0,0,_G.grid,4,"white",ctx) }

    /** @ignore */
    function _seeder(){
      return _.fill(_G.DIM).map(x=> _.fill(_G.DIM,0)) }

    _Z.defScene("level1",{
      onAI(pos){
        //let t= this.getChildById(`tile${pos}`);
        //Mojo.emit(["ai.moved",t]);
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
        _V.set(box,grid[0][0].x1,grid[0][0].y1);
        this.insert(box);

        let LT,RT;
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
            if(r===0){
              if(c===0) LT=s;
              if(c===a.length-1) RT=s;
            }
          }
        }
        cells[3][3]=1;//black
        cells[3][4]=2;
        cells[4][3]=2;
        cells[4][4]=1;

        //ui
        let s,g,t= _S.bitmapText("SCORE",{fontName:"unscii",
                                          fontSize:36,
                                          tint:_S.color("white")});
        this.insert(t);
        _S.pinLeft(LT,t,32,0);
        g=_S.sprite(_S.frames("icons.png",iconSize[0],iconSize[1]));
        _S.scaleXY(g,_G.iconScale[0],_G.iconScale[1]);
        g.m5.showFrame(_G.X);
        this.insert(g);
        _S.pinBottom(t,g);
        s= _S.bitmapText("00",{fontName:"unscii",fontSize:36,tint:_S.color("white")});
        this.insert(s);
        _S.pinBottom(g,s);
        _G.scores[_G.X]=s;
        t=s;
        g=_S.sprite(_S.frames("icons.png",iconSize[0],iconSize[1]));
        _S.scaleXY(g,_G.iconScale[0],_G.iconScale[1]);
        g.m5.showFrame(_G.O);
        this.insert(g);
        _S.pinBottom(t,g);
        s= _S.bitmapText("00",{fontName:"unscii",fontSize:36,tint:_S.color("white")});
        this.insert(s);
        _S.pinBottom(g,s);
        _G.scores[_G.O]=s;

        //decide who plays X and who starts
        if(mode===1){
          let a= this.AI=_G.AI(this,_G.O);
          a.scene=this;
          //Mojo.on(["ai.moved",this],"onAI");
          _G.ai=a;
          //ai starts?
          if(_G.pcur===_G.O){
            _.delay(100, () => Mojo.emit(["ai.move", a]))
          }
        }
      }
    });

  };


})(this);

