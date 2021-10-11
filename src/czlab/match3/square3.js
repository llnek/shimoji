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
  const Match3=window.Match3;
  const int=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           FX:_F,
           v2:_V,
           ute:_,is} = Mojo;

    //static data
    const IMAGEFILES=(function(){
      let s= _S.sprite("candy.png");
      let dim= s.height;
      return _.shuffle(_S.frames("candy.png",dim,dim));
    })();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TILES_X=6;
    const TILES_Y=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      icons: IMAGEFILES
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene,alpha=1){
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.png"));
      _G.backDropSprite.alpha=alpha;
      return scene.insert(_G.backDropSprite);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            W2=Mojo.width/2,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Match 3",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,W2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=>{
              _Z.runSceneEx("PlayGame");
              _Z.runScene("hud");
            });
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this,0.2) && this.g.doTitle() && this.g.doNext();
      }
    });

    //hud
    _Z.defScene("hud",{
      setup(){
        let K=Mojo.getScaleFactor();
        let s=_S.bboxFrame(_G.arena,int(24*K),"#fe6dcc");
        this.insert(s);
        this.msg=_S.bitmapText("0",{fontName:"unscii",fontSize:36,tint:0xffffff});
      },
      postUpdate(){
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
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
                s=_S.rect(e.x2-f.x1,
                          e.y2-f.y1,
                          0xaaaaaa,0xaaaaaa, 0,f.x1,f.y1);
            if(!bg){
              bg=self.insert(_S.uuid(_S.container(),"bg"))
            }
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
            return self.insert(_S.centerAnchor(s));
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
                if(--cnt===0){
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
                if(--cnt===0)
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
                if(--moved===0)
                  this.endMove();
              };
            });
            shifts = _G.match3.replenishBoard();
            shifts.forEach(move=>{
              ++moved;
              t= this.createTile(_G.match3.valueAt(move.row, move.column));
              _G.match3.setCustomData(move.row,move.column,t);
              g= _G.grid[move.row][move.column];
              t.x=int((g.x1+g.x2)/2);
              t.y= TL.y1+_G.tileH * (move.row - move.deltaRow + 1) - int(_G.tileH/2);
              e=_F.slide(t,_F.BOUNCE_OUT,
                         t.x,
                         TL.y1 + _G.tileH * move.row + int(_G.tileH/2), 10*move.deltaRow);
              e.onComplete=()=>{
                if(--moved===0)
                  this.endMove();
              };
            });
          },
          endMove(){
            if(_G.match3.matchInBoard()){
              _.delay(250, ()=>this.doMatches());
            }else{
              _G.selecting = true;
            }
          }
        });
        doBackDrop(this) && this.g.backdrop() && this.g.initLevel();
        Mojo.on(["single.tap"],"onClick",this.g);
      },
      dispose(){
        Mojo.off(["single.tap"],"onClick",this.g)
      },
      _onMouseMove(){
      },
      _onMouseDown(){
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["bg.png","candy.png","click.mp3"],
    arena: {width:480,height:800},
    scaleToWindow: "max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load", ()=> MojoH5(_$));

})(this);

