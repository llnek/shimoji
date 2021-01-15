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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game scenes
  function scenes(Mojo){
    const {Scenes,Sprites,Input,Game,Effects,u:_} = Mojo;

    Game.icons= IMAGEFILES;
    Game.tilesInX=6;
    Game.tilesInY=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //background
    Scenes.defScene("Bg",{
      setup(){
      }
    });
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //levels
    Scenes.defScene("level1",{
      _backdrop(){
        let rE=_.tail(this.g.grid);
        let r1=_.head(this.g.grid);
        let n=r1.length;
        let f=r1[0];
        let e=rE[n-1];
        let s=Sprites.rectangle(e.x2-f.x1,
                                e.y2-f.y1,
                                0xc9d08e,0xc9d08e,0,f.x1,f.y1);
        if(!this.g.bg){
          this.g.bg=Sprites.container();
          this.insert(this.g.bg);
        }
        this.g.bg.removeChildren();
        this.g.bg.addChild(s);
      },
      _randColor(){
        return _.randInt(Game.icons.length)
      },
      _createTile(pos,color){
        let y= pos/Game.tilesInX | 0;
        let x= pos%Game.tilesInX;
        let g= this.g.grid[y][x];
        let c= color || this._randColor();
        let s=Sprites.sprite(Game.icons[c]);
        Sprites.centerAnchor(s);
        s.width=Game.tileW;
        s.height=Game.tileH;
        s.iconColor=c;
        s.x=(g.x2+g.x1)/2 |0;
        s.y=(g.y2+g.y1)/2 |0;
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
        Mojo.pointer.press=click;
        Mojo.pointer.tap=click;
      },
      _onClick(){
        if(Game.busySignal){return}
        for(let x,y,t,i=0;i<Game.tiles.length;++i){
          t=Game.tiles[i];
          if(Mojo.pointer.hitTestSprite(t)){
            x= i%Game.tilesInX;
            y= i/Game.tilesInX |0;
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
        //updateScore(loc);
        this._removeTiles(garbo);
      },
      _shiftTiles(garbo){
        let ts= _.keys(garbo).sort();
        let shifts= [];
        // for each tile, bring down all the tiles
        // belonging to the same column that are above the current tile
        for(let pos,y,x,i=0;i<ts.length;++i){
          pos= +ts[i]; // cast str to int
          x = pos%Game.tilesInX;
          y = pos/Game.tilesInX | 0;
          // iterate through each row above the current tile
          for(let g,s,cur,top,j= y;j>=0; --j){
            // each tile gets the data of the tile exactly above it
            top= (j-1)*Game.tilesInX + x;
            cur= j*Game.tilesInX + x;
            s= Game.tiles[cur] = Game.tiles[top];
            if(s){
              g=this.g.grid[j][x];
              if(!shifts.some(o=>o.mojoh5.uuid===s.mojoh5.uuid)){
                shifts.push(s);
              }
              s.g.slideTo=[j,x];
            }
          }
          //null the very top slot
          Game.tiles[x] = null;
        }
        this.g.shifts=shifts;
      },
      _dropTiles(){
        let cnt=this.g.shifts.length;
        let e,ex,ey,g;
        this.g.shifts.forEach(s=>{
          let [row,col]=s.g.slideTo;
          let g=this.g.grid[row][col];
          ex=(g.x1+g.x2)/2|0;
          ey=(g.y1+g.y2)/2|0;
          e=Effects.slide(s, Effects.BOUNCE_OUT, ex, ey, 20);
          e.cb=()=>{
            Game.tiles[row*Game.tilesInX+col]=s;
            delete s.g["slideTo"];
            if(--cnt===0)
              this._addNewTiles();
          };
        });
        if(cnt===0)
          this._addNewTiles();
      },
      _addNewTiles(){
        this.g.shifts.length=0;
        let empty=[];
        for(let i=0;i<Game.tiles.length;++i){
          if(!Game.tiles[i]) empty.push(i);
        }
        let cnt=empty.length;
        empty.forEach(pos=>{
          let s= this._createTile(pos);
          Game.tiles[pos]=s;
          let e= Effects.fadeIn(s,30);
          e.cb=()=>{
            if(--cnt===0)
              Game.busySignal=false;
          };
        });
        // the move has finally finished, do some cleanup
        //cleanUpAfterMove();
      },
      _removeTiles(garbo){
        let cnt= _.size(garbo);
        let e,s;
        _.doseq(garbo,(v,pos)=>{
          s=Game.tiles[pos];
          Game.tiles[pos]=null;
          e=Effects.scale(s,0,0,15);
          e.cb=()=> {
            Sprites.remove(s);
            if(--cnt===0)
              this._dropTiles();
          };
        });
        this._shiftTiles(garbo);
      },
      onCanvasResize(old){
        let g= this.g.grid= Sprites.gridXY(Game.tilesInX,Game.tilesInY,9/10);
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        for(let y=0;y<Game.tilesInY;++y)
          for(let b,s,i,x=0;x<Game.tilesInX;++x){
            i= y*Game.tilesInX + x;
            s=Game.tiles[i];
            b=g[y][x];
            s.width=Game.tileW;
            s.height=Game.tileH;
            s.x=(b.x2+b.x1)/2 |0;
            s.y=(b.y2+b.y1)/2 |0;
          }
        this._bindPtr();
        this._backdrop();
        Sprites.remove(this.g.gridBox);
        this.g.gridBox= Sprites.drawGridBox(g,4,"white");
        this.insert(this.g.gridBox);
      },
      setup(){
        let g= this.g.grid= Sprites.gridXY(Game.tilesInX,Game.tilesInY,9/10);
        let b= Sprites.drawGridBox(g,4,"white");
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        this._backdrop();
        this._initLevel();
        this.g.gridBox= this.insert(b);
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //bootstrap onload
  window.addEventListener("load", ()=>{
    MojoH5({
      arena: {width:480,height:800},
      assetFiles: IMAGEFILES,
      scaleToWindow: "max",
      backgroundColor: 0,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("Bg");
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);

