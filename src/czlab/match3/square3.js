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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const Match3=window.Match3;
  const int=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is} = Mojo;

    //static data
    const IMAGEFILES=(function(){
      let s= _S.sprite("candy.png");
      let dim= s.height;
      return _.shuffle(_S.frames("candy.png",dim,dim));
    })();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Match3",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s,a=1)=> s.insert(_S.opacity(_S.fillMax(_S.sprite("bg.png")),a));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const TILES_X=6;
    const TILES_Y=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      icons: IMAGEFILES
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let K=Mojo.getScaleFactor();
        let s=_S.bboxFrame(_G.arena,int(24*K),"#f05680");
        this.insert(s);
        this.msg=_S.bmpText("0",{fontName:"unscii",fontSize:36,tint:0xffffff});
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor(),
          grid= _S.gridXY([TILES_X,TILES_Y]);
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          backdrop(){
            let rE=_.tail(grid),
              r1=_.head(grid),
              n=r1.length,
              f=r1[0],
              e=rE[n-1],
              bg=self.getChildById("bg"),
              s=_S.rect(e.x2-f.x1, e.y2-f.y1, 0xaaaaaa);
            _V.set(s,f.x1,f.y1);
            if(!bg)
              bg=self.insert(_S.uuid(_S.container(),"bg"))
            bg.removeChildren();
            bg.addChild(s);
            return this;
          },
          initLevel(){
            let z=grid[0][0],
              match3= new Match3({rows: TILES_Y,
                                  columns: TILES_X,
                                  items: IMAGEFILES.length });
            _.inject(_G,{
              arena: _S.gridBBox(0,0,grid),
              tilesInY: TILES_Y,
              tilesInX: TILES_X,
              tileW: z.x2-z.x1,
              tileH: z.y2-z.y1,
              grid,
              match3,
              selecting: true,
              dragging: false
            });
            match3.generateField();
            for(let y=0; y<TILES_Y; ++y)
            for(let g,t,c,x=0;x<TILES_X; ++x){
              c=match3.valueAt(y,x);
              g=grid[y][x];
              t= this.createTile(c);
              _V.set(t,int((g.x1+g.x2)/2),
                       int((g.y1+g.y2)/2));
              match3.setCustomData(y,x,t);
            }
            return this;
          },
          createTile(color){
            let s=_S.sprite(_G.icons[color]);
            s.iconColor=color;
            _S.sizeXY(s,_G.tileW, _G.tileH);
            return self.insert(_S.anchorXY(s,0.5));
          },
          onClick(){
            if(!_G.selecting){return}else{_G.dragging=true}
            let picked,c,x,y,t=this.hitTest();
            if(t >=0){
              picked= _G.match3.getSelectedItem();
              x=t% TILES_X;
              y=int(t/TILES_X);
              if(!picked){
                picked=_G.match3.customDataOf(y,x);
                picked.g.sx= picked.scale.x;
                picked.g.sy= picked.scale.y;
                picked.scale.x *= 1.2;
                picked.scale.y *= 1.2;
                _G.match3.setSelectedItem(y,x);
              }else if(_G.match3.areTheSame(y,x, picked.row, picked.column)){
                picked=_G.match3.customDataOf(y,x);
                picked.scale.x = picked.g.sx;
                picked.scale.y = picked.g.sy;
                _G.match3.deleselectItem();
              }else if(_G.match3.areNext(y, x, picked.row, picked.column)){
                c=_G.match3.customDataOf(picked.row, picked.column);
                c.scale.x = c.g.sx;
                c.scale.y = c.g.sy;
                _G.match3.deleselectItem();
                this.swap2(y, x, picked.row, picked.column, true);
              }else{
                c=_G.match3.customDataOf(picked.row, picked.column);
                c.scale.x = c.g.sx;
                c.scale.y = c.g.sy;
                picked=_G.match3.customDataOf(y,x);
                picked.g.sx= picked.scale.x;
                picked.g.sy= picked.scale.y;
                picked.scale.x *= 1.2;
                picked.scale.y *= 1.2;
                _G.match3.setSelectedItem(y,x);
              }
            }
          },
          hitTest(){
            let pos;
            for(let y=0;y< _G.match3.getRows();++y)
            for(let t,x=0;x<_G.match3.getColumns();++x){
              t=_G.match3.customDataOf(y,x);
              if(Mojo.mouse.hitTest(t)){
                pos= y* TILES_X +x;
                break;
              }
            }
            return pos;
          },
          swap2(row, col, row2, col2, swapBack){
            let shifts = _G.match3.swapItems(row, col, row2, col2);
            let e,t,cnt= shifts.length;
            _G.selecting = false;
            shifts.forEach(move=>{
              t= _G.match3.customDataOf(move.row, move.column);
              e= _F.slide(t, _F.SMOOTH_CUBIC,
                          t.x + _G.tileW  * move.deltaColumn,
                          t.y + _G.tileH * move.deltaRow, 10);
              e.onComplete=()=>{
                if(--cnt==0){
                  if(!_G.match3.matchInBoard()){
                    if(swapBack){
                      this.swap2(row, col, row2, col2, false);
                    }else{
                      _G.selecting = true;
                    }
                  }else{
                    this.doMatches();
                  }
                }
              };
            });
          },
          doMatches(){
            let matched = _G.match3.getMatchList();
            let e,t,cnt = matched.length;
            matched.forEach(m=>{
              t=_G.match3.customDataOf(m.row, m.column);
              e=_F.pulse(t,0,10,false);
              e.onComplete=()=>{
                _G.match3.setCustomData(m.row,m.column,null);
                _S.remove(t);
                if(--cnt==0)
                  this.dropTiles();
              };
            });
          },
          dropTiles(){
            _G.match3.removeMatches();
            let g,e,t,moved = 0;
            let shifts = _G.match3.arrangeBoardAfterMatch();
            let TL=_G.grid[0][0];
            shifts.forEach(move=>{
              ++moved;
              t= _G.match3.customDataOf(move.row, move.column);
              e=_F.slide(t,_F.BOUNCE_OUT,
                         t.x,
                         t.y + move.deltaRow * _G.tileH,10);
              e.onComplete=()=>{
                if(--moved==0)
                  this.endMove();
              };
            });
            shifts = _G.match3.replenishBoard();
            if(shifts.length>0)
              Mojo.sound("chimes.mp3").play();
            shifts.forEach(move=>{
              ++moved;
              t= this.createTile(_G.match3.valueAt(move.row, move.column));
              _G.match3.setCustomData(move.row,move.column,t);
              g= _G.grid[move.row][move.column];
              t.x=_M.ndiv(g.x1+g.x2,2);
              t.y= TL.y1+_G.tileH * (move.row - move.deltaRow + 1) - _M.ndiv(_G.tileH,2);
              e=_F.slide(t,_F.BOUNCE_OUT,
                         t.x,
                         TL.y1 + _G.tileH * move.row + _M.ndiv(_G.tileH,2), 10*move.deltaRow);
              e.onComplete=()=>{
                if(--moved==0)
                  this.endMove();
              };
            });
          },
          endMove(){
            if(_G.match3.matchInBoard()){
              self.future(()=>this.doMatches(),250)
            }else{
              self.future(()=>{
                if(!_G.match3.hasAvailableMoves()){
                  self.m5.dead=true;
                  _.delay(100,()=> _Z.modal("EndGame",{

                    fontSize:64*Mojo.getScaleFactor(),
                    replay:{name:"PlayGame"},
                    quit:{name:"Splash", cfg:SplashCfg},
                    msg:"",
                    winner:0

                  }));
                }else{
                  _G.selecting = true;
                }
              },100);
            }
          }
        });
        doBackDrop(this) && this.g.backdrop() && this.g.initLevel();
        _I.on(["single.tap"],"onClick",this.g);
        _Z.run("HUD");
      },
      dispose(){
        _I.off(["single.tap"],"onClick",this.g)
      },
      _onMouseMove(){
      },
      _onMouseDown(){
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5({

    assetFiles: ["bg.png","candy.png","click.mp3",
                 "chimes.mp3","game_over.mp3","game_win.mp3"],
    arena: {width:480,height:800},
    scaleToWindow: "max",
    scaleFit:"y",
    start(...args){ scenes(...args) }

  }));

})(this);

