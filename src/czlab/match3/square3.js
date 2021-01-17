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
  const Match3=window.Match3;

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
        let rE=_.tail(Game.grid);
        let r1=_.head(Game.grid);
        let n=r1.length;
        let f=r1[0];
        let e=rE[n-1];
        let bg=this.getChildById("bg");
        let s=Sprites.rectangle(e.x2-f.x1,
                                e.y2-f.y1,
                                0xc9d08e,0xc9d08e,0,f.x1,f.y1);
        if(!bg){
          bg=Sprites.container();
          this.insert(Sprites.uuid(bg,"bg"));
        }
        bg.removeChildren();
        bg.addChild(s);
      },
      _createTile(color){
        let s=Sprites.sprite(Game.icons[color]);
        Sprites.centerAnchor(s);
        s.width=Game.tileW;
        s.height=Game.tileH;
        s.iconColor=color;
        return this.insert(s);
      },
      _initLevel(){
        Game.match3 = new Match3({
          rows: Game.tilesInY,
          columns: Game.tilesInX,
          items: IMAGEFILES.length
        });
        Game.match3.generateField();
        for(let y=0;y<Game.tilesInY;++y){
          for(let g,t,c,x=0;x<Game.tilesInX;++x){
            c=Game.match3.valueAt(y,x);
            g=Game.grid[y][x];
            t= this._createTile(c);
            t.x=(g.x1+g.x2)/2|0;
            t.y=(g.y1+g.y2)/2|0;
            Game.match3.setCustomData(y,x,t);
          }
        }
        Game.selecting=true;
        Game.dragging=false;
      },
      onCanvasResize(old){
        let g= Game.grid= Sprites.gridXY(Game.tilesInX,Game.tilesInY,9/10);
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        for(let y=0;y<Game.match3.getRows();++y)
          for(let b,s,i,x=0;x<Game.match3.getColumns();++x){
            s=Game.match3.customDataOf(y,x);
            b=g[y][x];
            s.width=Game.tileW;
            s.height=Game.tileH;
            s.x=(b.x2+b.x1)/2 |0;
            s.y=(b.y2+b.y1)/2 |0;
          }
        this._backdrop();
        this.remove("gbox");
        this.insert(Sprites.uuid(Sprites.drawGridBox(g,4,"white"),"gbox"));
      },
      setup(){
        let g= Game.grid= Sprites.gridXY(Game.tilesInX,Game.tilesInY,9/10);
        let z=g[0][0];
        Game.tileW=z.x2-z.x1;
        Game.tileH=z.y2-z.y1;
        this._backdrop();
        this._initLevel();
        this.insert(Sprites.uuid(Sprites.drawGridBox(g,4,"white"),"gbox"));
        Mojo.EventBus.sub(["mousedown"],"_onMouseDown",this);
        Mojo.EventBus.sub(["mousemove"],"_onMouseMove",this);
        Mojo.EventBus.sub(["mouseup"],"_onMouseUp",this);
      },
      _hitTest(){
        let pos;
        for(let y=0;y<Game.match3.getRows();++y)
          for(let t,x=0;x<Game.match3.getColumns();++x){
            t=Game.match3.customDataOf(y,x);
            if(Mojo.pointer.hitTestSprite(t)){
              pos= y*Game.tilesInX+x;
              break;
            }
          }
        return pos;
      },
      _swap2(row, col, row2, col2, swapBack){
        let shifts = Game.match3.swapItems(row, col, row2, col2);
        let cnt= shifts.length;
        let e,t;
        Game.selecting = false;
        shifts.forEach(move=>{
          t= Game.match3.customDataOf(move.row, move.column);
          e= Effects.slide(t, Effects.SMOOTH_CUBIC,
                           t.x + Game.tileW  * move.deltaColumn,
                           t.y + Game.tileH * move.deltaRow, 10);
          e.cb=()=>{
            if(--cnt===0){
              if(!Game.match3.matchInBoard()){
                if(swapBack){
                  this._swap2(row, col, row2, col2, false);
                }else{
                  Game.selecting = true;
                }
              }else{
                this._doMatches();
              }
            }
          };
        });
      },
      _doMatches(){
        let matched = Game.match3.getMatchList();
        let cnt = matched.length;
        let t,e;
        matched.forEach(m=>{
          t=Game.match3.customDataOf(m.row, m.column);
          e=Effects.pulse(t,0,10);
          e.cb=()=>{
            Game.match3.setCustomData(m.row,m.column,null);
            Sprites.remove(t);
            if(--cnt===0)
              this._dropTiles();
          };
        });
      },
      _dropTiles(){
        Game.match3.removeMatches();
        let g,e,t,moved = 0;
        let shifts = Game.match3.arrangeBoardAfterMatch();
        let TL=Game.grid[0][0];
        shifts.forEach(move=>{
          ++moved;
          t= Game.match3.customDataOf(move.row, move.column);
          e=Effects.slide(t,Effects.BOUNCE_OUT,
                          t.x,
                          t.y + move.deltaRow * Game.tileH,10);
          e.cb=()=>{
            if(--moved===0)
              this._endMove();
          };
        });
        shifts = Game.match3.replenishBoard();
        shifts.forEach(move=>{
          ++moved;
          t= this._createTile(Game.match3.valueAt(move.row, move.column));
          Game.match3.setCustomData(move.row,move.column,t);
          g= Game.grid[move.row][move.column];
          t.x=(g.x1+g.x2)/2|0;
          t.y = TL.y1+Game.tileH * (move.row - move.deltaRow + 1) - Game.tileH/2|0;
          e=Effects.slide(t,Effects.BOUNCE_OUT,
                          t.x,
                          TL.y1 + Game.tileH * move.row + Game.tileH/2|0, 10*move.deltaRow);
          e.cb=()=>{
            if(--moved===0)
              this._endMove();
          };
        });
      },
      _endMove(){
        if(Game.match3.matchInBoard()){
          _.delay(250, ()=>this._doMatches());
        }else{
          Game.selecting = true;
        }
      },
      _onMouseUp(){
        if(Game.selecting){
          Game.dragging = true;
          let t= this._hitTest();
          if(t>=0){
            let c,picked= Game.match3.getSelectedItem();
            let y=t/Game.tilesInX |0;
            let x=t%Game.tilesInX;
            if(!picked){
              picked=Game.match3.customDataOf(y,x);
              picked.g.sx= picked.scale.x;
              picked.g.sy= picked.scale.y;
              picked.scale.x *= 1.2;
              picked.scale.y *= 1.2;
              Game.match3.setSelectedItem(y,x);
            }else{
              if(Game.match3.areTheSame(y,x, picked.row, picked.column)){
                picked=Game.match3.customDataOf(y,x);
                picked.scale.x = picked.g.sx;
                picked.scale.y = picked.g.sy;
                Game.match3.deleselectItem();
              }else{
                if(Game.match3.areNext(y, x, picked.row, picked.column)){
                  c=Game.match3.customDataOf(picked.row, picked.column);
                  c.scale.x = c.g.sx;
                  c.scale.y = c.g.sy;
                  Game.match3.deleselectItem();
                  this._swap2(y, x, picked.row, picked.column, true);
                }else{
                  c=Game.match3.customDataOf(picked.row, picked.column);
                  c.scale.x = c.g.sx;
                  c.scale.y = c.g.sy;

                  picked=Game.match3.customDataOf(y,x);
                  picked.g.sx= picked.scale.x;
                  picked.g.sy= picked.scale.y;
                  picked.scale.x *= 1.2;
                  picked.scale.y *= 1.2;
                  Game.match3.setSelectedItem(y,x);
                }
              }
            }
          }
        }
      },
      _onMouseMove(){
      },
      _onMouseDown(){
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

