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

  /**/
  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           FX:_T,
           Game:_G,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const

      UI_FONT= "Doki Lowercase",
      C_ORANGE=_S.color("#f4d52b"),
      SplashCfg= {
        title:"Tic Tac Toe",
        clickSnd:"click.mp3",
        action: {name:"MainMenu"}
      };

    const DIM=3, X=88, O=79;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in other game modules
    window["io/czlab/tictactoe/Sprites"](Mojo);
    window["io/czlab/tictactoe/AI"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //add stuff to the game object
    _.inject(_G,{
      DIM, X, O,
      playSnd(snd){
        let s;
        if(this.pcur==this.X) s="x.mp3";
        if(this.pcur==this.O) s="o.mp3";
        if(snd) s=snd;
        if(s) Mojo.sound(s).play()
      },
      getIcon(v){
        return v==this.O ?0 :(v==this.X ? 2 :1)
      },
      getOtherIcon(v){
        return v==this.O ? this.X: (v==this.X ? this.O: UNDEF)
      },
      switchPlayer(){
        let c=this.pcur, ai= this.ai;
        if(c==this.X) this.pcur=this.O;
        if(c==this.O) this.pcur=this.X;
        if(ai && ai.pnum != c) Mojo.emit(["ai.move",ai])
      },
      checkState(){
        if(!this.cells.some(c=> c==0)){
          return -1
        }
        for(let i,ok, a,g=0; g < this.goals.length; ++g){
          for(i=0,ok=0, a=this.goals[g]; i<a.length; ++i)
            if(this.cells[a[i]]==this.pcur) ++ok;
          if(ok==a.length) return 1;
        }
        return 0
      },
      mapGoalSpace(){
        let dx=[], dy= [], goals=[dx,dy];
        for(let c,h,v,r=0; r<DIM; ++r){
          h=[];
          v=[];
          for(c=0; c<DIM; ++c){
            h[c] = r * DIM + c;
            v[c] = c * DIM + r;
          }
          goals.push(h,v);
          dx[r] = r * DIM + r;
          dy[r] = (DIM - r - 1) * DIM + r
        }
        return goals;
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bgblack.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("xxEndGame",{
      setup(){
        let msg="No Winner!",
          {lastWin,mode}=_G,
          K=Mojo.getScaleFactor(),
          cfg={fontName:UI_FONT, fontSize:72*K};

        if(lastWin==_G.O) msg= mode==1 ? "You lose !" : "O wins !";
        if(lastWin==_G.X) msg= mode==1 ? "You win !" : "X wins !";

        let gap=_S.bmpText("or", cfg),
          b1=_I.mkBtn(_S.bmpText("Play Again?", cfg)),
          b2=_I.mkBtn(_S.bmpText("Quit", cfg)),
          m1=_S.bmpText("Game Over", cfg),
          m2=_S.bmpText(msg, cfg),
          space=()=> _S.opacity(_S.bmpText("I",cfg),0);

        b1.m5.press=()=> playClick() && _Z.runEx("MainMenu");
        b2.m5.press=()=> playClick() && _Z.runEx("Splash");

        Mojo.sound("game_over.mp3").play();
        this.insert( _Z.layoutY([m1, m2, space(), space(), b1, gap, b2]))
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Start1",{
      setup(){
        let self=this,
          m1,m2, K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doChoices(){
            const cfg={fontSize:64*K,fontName:UI_FONT},
              space=()=> _S.opacity(_S.bmpText("I", cfg),0);
            m1=_Z.choiceMenuY([_I.mkBtn(_S.uuid(_S.bmpText("Easy",cfg),"#easy")),
                               space(),
                               _I.mkBtn(_S.uuid(_S.bmpText("Normal",cfg),"#normal")),
                               space(),
                               _I.mkBtn(_S.uuid(_S.bmpText("Hard",cfg),"#hard"))],
                               {bg:"#cccccc",
                                opacity:0.3,
                                onClick: ()=>playClick(),
                                defaultChoice:"#easy",
                                selectedColor:C_ORANGE,
                                disabledColor:"#dddddd"});
            return self.insert(_V.set(m1, (Mojo.width-m1.width)/2, Mojo.height * 0.1));
          },
          doNext(){
            const cfg={fontSize:72*K,fontName:UI_FONT},
              space=()=> _S.opacity(_S.bmpText("I", cfg),0),
              c1=_S.uuid(_I.mkBtn(_S.bmpText("Yes",cfg)),"play#x"),
              c2=_S.uuid(_I.mkBtn(_S.bmpText("No", cfg)),"play#o");
            m2= _Z.layoutX([_S.bmpText("Player (X) starts?",cfg),
                            space(),
                            c1, _S.bmpText(" /  ",cfg), c2], {bg:"transparent"});
            _V.set(m2, (Mojo.width-m2.width)/2, Mojo.height*0.6);
            c1.m5.press=
            c2.m5.press=function(b){
              _S.tint(b,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=>{
                let who,id=b.m5.uuid;
                if(id=="play#x") who=_G.X;
                if(id=="play#o") who=_G.O;
                _Z.replace(self,"PlayGame",
                           {mode:1, startsWith: who, level: m1.getSelectedChoice()})
              });
            };
            return self.insert(m2);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doChoices() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Start2",{
      setup(options){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doMenu(){
            const cfg={fontSize:72*K, fontName:UI_FONT},
              c1=_S.uuid(_I.mkBtn(_S.bmpText("Yes",cfg)),"play#x"),
              c2=_S.uuid(_I.mkBtn(_S.bmpText("No", cfg)),"play#o"),
              space=()=> _S.opacity(_S.bmpText("I", cfg),0),
              m2= _Z.layoutX([_S.bmpText("Player (X) starts?",cfg),
                              space(), c1, _S.bmpText(" /  ",cfg), c2], {bg:"transparent"});
            _V.set(m2,(Mojo.width-m2.width)/2, Mojo.height*0.6);
            c1.m5.press=
            c2.m5.press=function(b){
              _S.tint(b,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=>{
                let who,id=b.m5.uuid;
                if(id=="play#x") who=_G.X;
                if(id=="play#o") who=_G.O;
                _Z.replace(self,"PlayGame", {mode:2, startsWith: who})
              });
            };
            return self.insert(m2);
          }
        });
        doBackDrop(this) && this.g.doMenu();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("MainMenu",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doMenu(){
            const cfg={fontSize: 64*K, fontName:UI_FONT},
              gap=_S.bmpText("or", cfg),
              space=()=> _S.opacity(_S.bmpText("I",cfg),0),
              b1=_S.uuid(_I.mkBtn(_S.bmpText("One Player", cfg)),"play#1"),
              b2=_S.uuid(_I.mkBtn(_S.bmpText("Two Player", cfg)),"play#2");
            b1.m5.press=
            b2.m5.press=(b)=>{
              _S.tint(b,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=>{
                _Z.replace(self, b.m5.uuid == "play#1"?"Start1":"Start2")
              })
            };
            return self.insert(_Z.layoutY([b1,space(),gap,space(),b2],{bg:"transparent"}))
          }
        });
        doBackDrop(this) && this.g.doMenu();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _drawBox(ctx){
      let grid=_G.grid,
        gf= grid[0],
        gl= _.last(grid),
        K=Mojo.getScaleFactor();
      ctx.beginFill(_S.SomeColors.black);
      ctx.strokeStyle= "white";
      ctx.lineWidth=4*K;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      ctx.endFill();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _drawGrid(ctx){
      let grid=_G.grid,
        gf= grid[0][0],
        K=Mojo.getScaleFactor();
      _S.drawGridLines(gf.x1,gf.y1,grid,4*K,"white",ctx)
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _seeder=()=> _.fill(new Array(DIM*DIM),0);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      onAI(pos){
        const y=_M.ndiv(pos,DIM),
          x=pos%DIM,
          t= this.getChildById(`tile,${x},${y}`);
        //tell the selected tile to do work
        Mojo.emit(["ai.moved",t]);
      },
      setup(options){
        const self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let grid= _S.gridSQ(3,0.8),
              s=_S.sprite("icons.png"),
              cz= _S.bboxSize(grid[0][0]);
            _G.iconSize=[_M.ndiv(s.width,3), s.height];
            //o == 79, x= 88
            return _.inject(_G,{lastWin: 0,
                                scene:self,
                                ai:UNDEF,
                                pnum: _G.X,
                                grid: grid,
                                cells: _seeder(),
                                mode: options.mode,
                                level: options.level,
                                pcur: options.startsWith,
                                players: _.fill(3),
                                goals: _G.mapGoalSpace(),
                                iconScale: Mojo.scaleXY(_G.iconSize,cz) });
          },
          doArena(){
            let {DIM,grid,iconSize,iconScale}=_G,
              box=_S.group(_S.drawBody(_drawGrid));
            _S.anchorXY(box.children[0],0.5);
            _V.set(box,_M.ndiv(Mojo.width,2),
                       _M.ndiv(Mojo.height,2));
            self.insert(box);
            grid.forEach((r,y)=>{
              r.forEach((o,x)=>{
                let [tx,ty]=_S.bboxCenter(o);
                let uuid= `tile,${x},${y}`;
                self.insert(_G.Tile(tx,ty,iconSize[0],iconSize[1],
                            {uuid, scale:iconScale, gpos: y*DIM+x, gval: 0})); }); });
          }
        });

        doBackDrop(this) && this.g.initLevel() && this.g.doArena();

        //decide who plays X and who starts
        if(options.mode==1){
          let a= _G.ai=_G.AI(_G.O);
          a.scene=self;
          Mojo.on(["ai.moved",this],"onAI");
          //ai starts?
          if(_G.pcur==_G.O)
            _.delay(100, ()=> Mojo.emit(["ai.move", a]))
        }

        _Z.run("AudioIcon",{ xScale:K,yScale:K });
      }
    });

    _G.endOfGame=function(s){
      s= s||_G.scene;
      if(0)
        s.children.forEach(c=>{
          if(c.m5 && (""+c.m5.uuid).startsWith("tile,")){
            _I.undoButton(c);
          }
        });

      let msg="No Winner";
      if(_G.lastWin==_G.O) msg= _G.mode==1 ? "You lose !" : "O wins !";
      if(_G.lastWin==_G.X) msg= _G.mode==1 ? "You win !" : "X wins !";

      _Z.modal("EndGame",{

        fontSize:64*Mojo.getScaleFactor(),
        replay:{name:"MainMenu"},
        quit:{name:"Splash", cfg:SplashCfg},
        msg,
        winner:msg.includes("win")

      });
    }

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles:["bgblack.jpg", "icons.png","audioOn.png","audioOff.png",
                "click.mp3","x.mp3","o.mp3","game_win.mp3","game_over.mp3"],
    arena:{width:1344, height:840},
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);



