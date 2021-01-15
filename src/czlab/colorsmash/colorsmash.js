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

  //const IMAGEFILES= ["cherry.png","apple.png","orange.png","lemon.png","plum.png"];
  const IMAGEFILES= ["1s.png","2s.png","3s.png","4s.png","5s.png"];

  function scenes(Mojo){
    const {Scenes,Sprites,Input,Game,Effects,u:_} = Mojo;

    Game.icons= IMAGEFILES;
    // 12 icons across, 18 icons down
    //Game.tilesInX=12;
    //Game.tilesInY=18;
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
        let r1=this.grid[0];
        let n=r1.length;
        let f=r1[0];
        let rE=this.grid[this.grid.length-1];
        let e=rE[n-1];
        let s=Sprites.rectangle(e.x2-f.x1,e.y2-f.y1,0xc9d08e,0xc9d08e);
        s.x=f.x1;
        s.y=f.y1;
        this.insert(s);
      },
      _randColor(){
        return _.randInt(Game.icons.length)
      },
      _createTile(pos,color){
        let s=Sprites.sprite(Game.icons[color]);
        let y= pos/Game.tilesInX | 0;
        let x= pos%Game.tilesInX;
        let g=this.grid[y][x];
        Sprites.centerAnchor(s);
        //s.scale.x=Game.scaleX;
        //s.scale.y=Game.scaleY;
        s.width=Game.tileW;
        s.height=Game.tileH;
        s.iconColor=color;
        s.x=(g.x2+g.x1)/2 |0;
        s.y=(g.y2+g.y1)/2 |0;
        this.insert(s);
        return s;
      },
      _initLevel(){
        //let s=Sprites.sprite("apple.png");
        let s=Sprites.sprite("1s.png");
        let w=s.width;
        let h=s.height;
        let K=Mojo.scaleXY([w,h],[Game.tileW,Game.tileH]);
        Game.scaleX=K[0];
        Game.scaleY=K[1];
        Game.tiles=[];
        let pos=0;
        for(let y=0;y<Game.tilesInY;++y){
          for(let x=0;x<Game.tilesInX;++x){
            Game.tiles[pos]= this._createTile(pos, this._randColor());
            ++pos;
          }
        }
        let click=()=>{ this._onClick() };
        Mojo.pointer.press=click;
        Mojo.pointer.tap=click;
      },
      _onClick(){
        if(Game.busySignal){return}
        for(let x,y,t,i=0;i<Game.tiles.length;++i){
          t=Game.tiles[i];
          if(Mojo.pointer.hitTestSprite(t)){
            //y= _.floor(i/Game.tilesInX);
            y= (i/Game.tilesInX) | 0;
            x= i % Game.tilesInX;
            _.delay(0,()=>{
              this.onSelected(y,x);
            })
            Game.busySignal=true;
            break;
          }
        }
      },
      matchTiles(garbo,row,col,color){
        if (col<0  || col >= Game.tilesInX ||
            row <0 || row >= Game.tilesInY){return}
        let pos = row * Game.tilesInX + col;
        // match color?
        if(Game.tiles[pos].iconColor !== color){return}
        //check if tile is already saved
        if(garbo[pos]){return}
        garbo[pos]=1;
        // check up and down
        this.matchTiles(garbo, row-1, col, color);
        this.matchTiles(garbo, row+1, col,color);
        // check left and right
        this.matchTiles(garbo, row,col-1, color);
        this.matchTiles(garbo, row,col+1, color);
      },
      onSelected(row,col){
        let t= Game.tiles[row*Game.tilesInX+col];
        let c= t.iconColor;
        let garbo={};
        this.matchTiles(garbo,row,col,c);
        //updateScore(loc);
        this.removeTiles(garbo);
        this.shiftTiles(garbo);
        //this.addNewTiles();
        //Game.busySignal=false;
      },
      shiftTiles(garbo){
        let ts= _.keys(garbo).sort();
        let shifts= [];
        // for each tile, bring down all the tiles
        // belonging to the same column that are above the current tile
        for(let pos,y,x,i=0;i<ts.length;++i){
          pos= +ts[i];
          x = pos % Game.tilesInX;
          y = pos/Game.tilesInX | 0;
          // iterate through each row above the current tile
          for(let g,s,cur,top,j= y;j>=0; --j){
            // each tile gets the data of the tile exactly above it
            top= (j-1) * Game.tilesInX + x;
            cur= j * Game.tilesInX + x;
            s= Game.tiles[cur] = Game.tiles[top];
            if(s){
              g=this.grid[j][x];
              if(!shifts.some(o=>o.mojoh5.uuid===s.mojoh5.uuid)){
                shifts.push(s);
              }
              s.slideTo=[j,x];
              //s.x=(g.x1+g.x2)/2;
              //s.y=(g.y1+g.y2)/2;
              //_.assoc(shifts, s.mojoh5.uuid,[s,g]);
            }
          }
          //null the very top slot
          Game.tiles[x] = null;
        }
        this.shifts=shifts;
      },
      dropTiles(){
        let cnt=this.shifts.length;
        let e,ex,ey,g;
        this.shifts.forEach(s=>{
          let [row,col]=s.slideTo;
          let g=this.grid[row][col];
          ex=(g.x1+g.x2)/2|0;
          ey=(g.y1+g.y2)/2|0;
          e=Effects.slide(s, Effects.BOUNCE_OUT, ex, ey, 20);
          e.cb=()=>{
            Game.tiles[row*Game.tilesInX+col]=s;
            delete s["slideTo"];
            --cnt;
            if(cnt===0){
              this.addNewTiles();
            }
          };
        });
        if(cnt===0)
          this.addNewTiles();
      },
      addNewTiles(){
        this.shifts.length=0;
        let empty=[];
        for(let i=0;i<Game.tiles.length;++i){
          if(!Game.tiles[i]){
            empty.push(i);
          }
        }
        let cnt=empty.length;
        empty.forEach(pos=>{
          let c=this._randColor();
          let s= this._createTile(pos,c);
          Game.tiles[pos]=s;
          let e= Effects.fadeIn(s,30);
          e.cb=()=>{
            --cnt;
            if(cnt===0){
              Game.busySignal=false;
            }
          };
        });
        // the move has finally finished, do some cleanup
        //cleanUpAfterMove();
      },
      removeTiles(garbo){
        let cnt= _.size(garbo);
        let e,s;
        _.doseq(garbo,(v,pos)=>{
          s=Game.tiles[pos];
          Game.tiles[pos]=null;
          e=Effects.scale(s,0,0,15);
          e.cb=()=> {
            Sprites.remove(s);
            --cnt;
            if(cnt===0){
              this.dropTiles();
            }
          };
        });
      },
      setup(){
        let g= Sprites.gridXY(Game.tilesInX,Game.tilesInY,9/10);
        //let b= Sprites.drawGridBox(g,2,0x958ed0);
        let b= Sprites.drawGridBox(g,4,"white");
        //let n= Sprites.drawGridLines(g,2,0x958ed0);
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        this.grid=g;
        this._backdrop();
        this.insert(b);
        //this.insert(n);
        this._initLevel();
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

