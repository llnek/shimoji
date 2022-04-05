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
  window["io/czlab/reversi/Scenes"]=function(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_X,
           Ute2D:_U,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b");

    _G.SplashCfg= {
      title:"Reversi",
      clickSnd:"click.mp3",
      action: {name:"MainMenu"}
    };


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bggreen.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doMenu(){
            const cfg={fontSize: 64*K, fontName:UI_FONT},
              space=()=> _S.opacity(_S.bmpText("I",cfg),0),
              gap=_S.bmpText("or", cfg),
              b1=_S.uuid(_I.mkBtn(_S.bmpText("One Player", cfg)),"p1"),
              b2=_S.uuid(_I.mkBtn(_S.bmpText("Two Player", cfg)),"p2");
            b1.m5.press=
            b2.m5.press=(b)=>{
              b.tint=C_ORANGE;
              playClick();
              _.delay(CLICK_DELAY,()=>_Z.runEx("StartMenu", {mode: b.m5.uuid == "p1"?1:2}))
            };
            return self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doMenu();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("StartMenu",{
      setup(options){
        const self=this,
          K=Mojo.getScaleFactor(),
          cfg={fontName: UI_FONT, fontSize: 64*K},
          gap=_S.bmpText(" / ", cfg),
          b1=_I.mkBtn(_S.bmpText("Yes", cfg)),
          b2=_I.mkBtn(_S.bmpText("No", cfg)),
          s= _S.bmpText("Player 1 (Black) Starts? ", cfg);
        b1.m5.press=
        b2.m5.press=(b)=>{
          options.startsWith= b===b1?1:2;
          _S.tint(b,C_ORANGE);
          playClick();
          _.delay(CLICK_DELAY, ()=> _Z.runEx("PlayGame", options));
        };
        doBackDrop(this);
        self.insert(_Z.layoutX([s, b1, gap, b2],{bg:"transparent"}));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("XXXEndGame",{
      setup(){
        let w= _G.lastWin,
          mode = _G.mode,
          msg="No Winner!",
          snd="game_over.mp3",
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT, fontSize:64*K};
        if(_G.points[_G.X]>_G.points[_G.O]){
          msg= mode==1 ? "You win !" : "Player 1 (Black) wins !";
          snd="game_win.mp3";
        }else if(_G.points[_G.X]<_G.points[_G.O]){
          msg= mode==1 ? "You lose !" : "Player 2 (White) wins !";
        }
        let b1=_I.mkBtn(_S.bmpText("Play Again?", cfg)),
          b2=_I.mkBtn(_S.bmpText("Quit", cfg)),
          m1=_S.bmpText("Game Over", cfg),
          m2=_S.bmpText(msg, cfg),
          gap=_S.bmpText("or", cfg),
          space=()=> _S.opacity(_S.bmpText("I",cfg),0);
        b1.m5.press=()=> playClick() && _Z.runEx("MainMenu");
        b2.m5.press=()=> playClick() && _Z.runEx("Splash");
        _G.playSnd(snd);
        this.insert( _Z.layoutY([m1, m2, space(), space(), b1, gap, b2]));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(options){
        let self=this,
          mode=options.mode,
          K=Mojo.getScaleFactor(),
          LT,RT, startsWith=options.startsWith;
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        const _seeder=()=> _.fill(_G.DIM).map(x=> _.fill(_G.DIM,0));
        function _drawGrid(ctx){
          const bx=_S.gridBBox(0,0,_G.grid);
          _S.drawGridBox(bx,4*K,"white",ctx);
          _S.drawGridLines(0,0,_G.grid,4*K,"white",ctx);
        }
        _.inject(this.g,{
          initLevel(){
            let z=_S.sprite("icons.png"),
              g=_S.gridSQ(_G.DIM,0.9),
              c=g[0][0],
              k=(c.y2-c.y1)/z.height;
            _.inject(_G,{lastWin: 0,
                         mode,
                         ai:UNDEF,
                         grid: g,
                         pnum: _G.X,
                         gameOver:false,
                         cells: _seeder(),
                         iconScale:[k,k],
                         iconSize:[z.height, z.height],
                         pcur: startsWith==1?_G.X:_G.O,
                         players: _.fill(3,UNDEF)
            });
            const box=_S.group(_S.drawBody(_drawGrid));
            _V.set(box,_G.grid[0][0].x1,_G.grid[0][0].y1);
            return self.insert(box);
          },
          initArena(){
            _G.grid.forEach((g,r)=> g.forEach((a,c)=>{
              let v=0,
                id= `${r}:${c}`,
                b=_S.bboxCenter(a);
              //starting 4 pieces
              if(r==3){
                if(c==3)v=1;
                if(c==4)v=2;
              }
              if(r==4){
                if(c==3)v=2;
                if(c==4)v=1;
              }
              let s=_G.Tile(id, b[0],b[1],
                            _G.iconSize[0],_G.iconSize[1], {gpos: [r,c], gval: v});
              self.insert(s);
              if(r==0){
                if(c==0) LT=s;
                if(c==a.length-1) RT=s;
              }
            }));
            _G.cells[3][3]=1;//black
            _G.cells[3][4]=2;
            _G.cells[4][3]=2;
            _G.cells[4][4]=1;
            return this;
          },
          initUI(){
            let s,g,t= _S.bmpText("Score",UI_FONT, 36*K);
            self.insert(t);
            _S.pinLeft(LT,t,32,0);
            g=_S.sprite(_S.frames("icons.png",_G.iconSize[0],_G.iconSize[1]));
            _S.scaleXY(g, _G.iconScale[0],_G.iconScale[1]);
            g.m5.showFrame(_G.X);
            self.insert(g);
            _S.pinBelow(t,g);
            s= _S.bmpText("00",UI_FONT,36*K);
            self.insert(s);
            _S.pinBelow(g,s);
            _G.scores[_G.X]=s;
            t=s;
            g=_S.sprite(_S.frames("icons.png",_G.iconSize[0],_G.iconSize[1]));
            _S.scaleXY(g,_G.iconScale[0],_G.iconScale[1]);
            g.m5.showFrame(_G.O);
            self.insert(g);
            _S.pinBelow(t,g);
            s= _S.bmpText("00",UI_FONT,36*K);
            self.insert(s);
            _S.pinBelow(g,s);
            _G.scores[_G.O]=s;
            return this;
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() && this.g.initArena() && this.g.initUI();
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        //decide who plays X and who starts
        if(mode==1){
          let a= _G.ai= _G.AI(this,_G.O);
          a.scene=this;
          //ai starts?
          if(_G.pcur==_G.O)
            _.delay(100, ()=> Mojo.emit(["ai.move", a]));
        }
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
      },
      postUpdate(){
        if(_G.gameOver) this.m5.dead=true;
      }
    });

  };

})(this);


