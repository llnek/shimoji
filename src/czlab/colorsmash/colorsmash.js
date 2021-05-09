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
  //static data
  const IMAGEFILES= ["1s.png","2s.png","3s.png","4s.png","5s.png"];
  const MFL=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game scenes
  function scenes(Mojo){
    const {Scenes,
           Sprites,
           Input,
           v2:_V,
           Game,FX,ute:_} = Mojo;

    //
    Game.icons= IMAGEFILES;
    Game.tilesInX=6;
    Game.tilesInY=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //background
    Scenes.defScene("bg",{
      setup(){
      }
    });

    //hud
    Scenes.defScene("hud",{
      setup(){
        let b=Sprites.gridBBox(0,0,Game.grid);
        let K=Mojo.getScaleFactor();
        let s=Sprites.bboxFrame(b,MFL(24*K));
        this.insert(s);
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //levels
    Scenes.defScene("level1",{
      _backdrop(){
        let rE=_.tail(Game.grid);
        let r1=_.head(Game.grid);
        let n=r1.length;
        let f=r1[0];
        let e=rE[n-1];
        let s=Sprites.rect(e.x2-f.x1,
                           e.y2-f.y1,
                           0xc9d08e,0xc9d08e,0,f.x1,f.y1);
        let bg=this.getChildById("bg");
        if(!bg){
          bg=Sprites.container();
          this.insert(Sprites.uuid(bg,"bg"));
        }
        bg.removeChildren();
        bg.addChild(s);
      },
      _randColor(){
        return _.randInt(Game.icons.length)
      },
      _createTile(pos,color){
        let c= color===undefined? this._randColor() : color;
        let [x,y]= Mojo.splitXY(pos,Game.tilesInX);
        let g= Game.grid[y][x];
        let s=Sprites.sprite(Game.icons[c]);
        Sprites.centerAnchor(s);
        Sprites.sizeXY(s,Game.tileW, Game.tileH);
        s.iconColor=c;
        _V.set(s,MFL((g.x1+g.x2)/2),
                 MFL((g.y1+g.y2)/2));
        return this.insert(s);
      },
      _initLevel(){
        let s=Sprites.sprite(IMAGEFILES[0]);
        let w=s.width;
        let h=s.height;
        Game.tiles=[];
        let pos=0;
        for(let y=0;y<Game.tilesInY;++y){
          for(let x=0;x<Game.tilesInX;++x){
            Game.tiles[pos]= this._createTile(pos);
            ++pos;
          }
        }
        this._bindPtr();
      },
      _bindPtr(){
        let click=()=>{ this._onClick() };
        Mojo.mouse.press=click;
        Mojo.mouse.tap=click;
      },
      _onClick(){
        if(Game.busySignal){return}
        for(let x,y,t,i=0;i<Game.tiles.length;++i){
          t=Game.tiles[i];
          if(Mojo.mouse.hitTest(t)){
            [x,y]=Mojo.splitXY(i,Game.tilesInX);
            _.delay(0,()=> this._onSelected(y,x))
            Game.busySignal=true;
            break;
          }
        }
      },
      _matchTiles(garbo,row,col,color){
        if (col<0  || col >= Game.tilesInX ||
            row <0 || row >= Game.tilesInY){return}
        let pos = row*Game.tilesInX + col;
        // match color?
        if(Game.tiles[pos].iconColor !== color){return}
        //check if tile is already saved
        if(garbo[pos]){return}
        garbo[pos]=1;
        // check up and down
        this._matchTiles(garbo, row-1, col, color);
        this._matchTiles(garbo, row+1, col,color);
        // check left and right
        this._matchTiles(garbo, row,col-1, color);
        this._matchTiles(garbo, row,col+1, color);
      },
      _onSelected(row,col){
        let t= Game.tiles[row*Game.tilesInX+col];
        let c= t.iconColor;
        let garbo={};
        this._matchTiles(garbo,row,col,c);
        this._removeTiles(garbo);
      },
      _shiftTiles(garbo){
        let ts= _.keys(garbo).sort();
        let shifts= [];
        // for each tile, bring down all the tiles
        // belonging to the same column that are above the current tile
        for(let pos,y,x,i=0;i<ts.length;++i){
          pos= +ts[i]; // cast str to int
          [x,y]=Mojo.splitXY(pos,Game.tilesInX);
          // iterate through each row above the current tile
          for(let g,s,cur,top,j= y;j>=0; --j){
            // each tile gets the data of the tile exactly above it
            top= (j-1)*Game.tilesInX + x;
            cur= j*Game.tilesInX + x;
            s= Game.tiles[cur] = Game.tiles[top];
            if(s){
              g=Game.grid[j][x];
              if(!shifts.some(o=>o.m5.uuid==s.m5.uuid)){
                shifts.push(s);
              }
              s.g.slideTo=[j,x];
            }
          }
          //null the very top slot
          Game.tiles[x] = null;
        }
        Game.shifts=shifts;
      },
      _dropTiles(){
        let cnt=Game.shifts.length;
        let e,ex,ey,g;
        Game.shifts.forEach(s=>{
          let [row,col]=s.g.slideTo;
          let g=Game.grid[row][col];
          ex=MFL((g.x1+g.x2)/2);
          ey=MFL((g.y1+g.y2)/2);
          e=FX.slide(s, FX.BOUNCE_OUT, ex, ey, 20);
          e.onComplete=()=>{
            Game.tiles[row*Game.tilesInX+col]=s;
            if(--cnt===0)
              this._addNewTiles();
          };
        });
        if(cnt===0)
          this._addNewTiles();
      },
      _addNewTiles(){
        Game.shifts.length=0;
        let empty=[];
        for(let i=0;i<Game.tiles.length;++i){
          if(!Game.tiles[i]) empty.push(i);
        }
        let cnt=empty.length;
        empty.forEach(pos=>{
          let s= this._createTile(pos);
          Game.tiles[pos]=s;
          let e= FX.fadeIn(s,30);
          e.onComplete=()=>{
            if(--cnt===0)
              Game.busySignal=false;
          };
        });
      },
      _removeTiles(garbo){
        let cnt= _.size(garbo);
        let e,s;
        _.doseq(garbo,(v,pos)=>{
          s=Game.tiles[pos];
          Game.tiles[pos]=null;
          e=FX.scale(s,0,0,15);
          e.onComplete=()=> {
            Sprites.remove(s);
            if(--cnt===0)
              this._dropTiles();
          };
        });
        this._shiftTiles(garbo);
      },
      setup(){
        let g= Game.grid= Sprites.gridXY([Game.tilesInX,Game.tilesInY]);
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        this._backdrop();
        this._initLevel();
        //this.insert(Sprites.uuid(Sprites.drawGridBox(g,4,"white"),"gbox"));
      }
    });
  }

  const _$={
    assetFiles: IMAGEFILES.slice(0),
    arena: {width:480,height:800},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5(_$));

})(this);

