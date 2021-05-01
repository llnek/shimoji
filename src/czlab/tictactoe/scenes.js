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

  window["io/czlab/tictactoe/Scenes"]=function(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;
    const MFL=Math.floor;

    _Z.defScene("Splash",function(){
      let verb = Mojo.touchDevice ? "Tap": "Click";
      let K= Mojo.getScaleFactor();
      let msg=_S.bitmapText(`${verb} Play to start`,
                            {fontName:"unscii",
                             align:"center",
                             fontSize:48*K,fill:"white"},
                            Mojo.width/2, Mojo.height*0.8);
      _S.centerAnchor(msg);
      //in pixi, no fontSize, defaults to 26, left-align
      let b=_I.makeButton(_S.bitmapText("Play Game!",
                                        {fill:"#cccccc",
                                         fontName:"unscii",
                                         fontSize:24*K,align:"center"}));
      b.m5.press= ()=> _Z.replaceScene(this,"MainMenu");
      this.insert(_G.Backgd());
      this.insert(msg);
      this.insert(_Z.layoutY([b]));
    });

    _Z.defScene("EndGame",{
      setup(){
        let K=Mojo.getScaleFactor();
        let mode = _G.mode;
        let w= _G.lastWin;
        let msg="No Winner!";

        if(w===_G.X)
          msg= mode===1 ? "You win !" : "X wins !";
        if(w===_G.O)
          msg= mode===1 ? "You lose !" : "O wins !";

        let space=_S.bitmapText(" ",{fontName:"unscii"});
        space.alpha=0;
        let b1=_I.makeButton(_S.bitmapText("Play Again?",
                                           {fill:"#ccc",
                                            fontName:"unscii",
                                            align:"center",fontSize:24*K}));
        let b2=_I.makeButton(_S.bitmapText("Quit",
                                           {fill:"#ccc",
                                            fontName:"unscii",
                                            align:"center",fontSize:24*K}));
        let m1=_S.bitmapText("Game Over",{fill: "white",
                                          fontName:"unscii",
                                          align:"center",fontSize:24*K});
        let m2=_S.bitmapText(msg,{fill: "white",
                                  fontName:"unscii",
                                  align:"center",fontSize:24*K});
        let gap=_S.bitmapText("or",{fill:"white",
                                    fontName:"unscii",
                                    align:"center",fontSize:24*K});
        b1.m5.press=()=>{ _Z.runSceneEx("MainMenu") };
        b2.m5.press=()=>{ _Z.runSceneEx("Splash") };
        _G.playSnd("end.mp3");
        this.insert( _Z.layoutY([m1, m2, space, b1, gap, b2])) }
    });

    _Z.defScene("StartMenu", function(options){
      let K=Mojo.getScaleFactor();
      let msg1,msg2;
      let cb=(btn)=>{
        let id=btn.m5.uuid;
        let who;
        if(id=="play#x") who=_G.X;
        else if(id=="play#o") who=_G.O;
        _Z.replaceScene(this,"PlayGame",
                        {mode:options.mode,
                         startsWith: who,
                         level: options.level}) };
      if(options.mode===1){
        msg1 = "You (X) start?";
        msg2 = "Bot (O) start?";
      }else if(options.mode===2){
        msg1 = "(X) start?";
        msg2 = "(O) start?";
      }
      let b1=_I.makeButton(_S.bitmapText(msg1,{fill:"#cccccc",
                                               fontName:"unscii",
                                               fontSize:24*K,align:"center"}));
      b1.m5.uuid= "play#x";
      b1.m5.press=cb;
      let b2=_I.makeButton(_S.bitmapText(msg2,{fill:"#cccccc",
                                               fontName:"unscii",
                                               fontSize:24*K,align:"center"}));
      b2.m5.uuid= "play#o";
      b2.m5.press=cb;
      let gap=_S.bitmapText("or",{fill: "#cccccc",
                                  fontName:"unscii",
                                  fontSize:24*K,align:"center"});
      this.insert(_G.Backgd());
      this.insert(_Z.layoutY([b1, gap, b2]));
    });

    _Z.defScene("MainMenu", function(){
      let K=Mojo.getScaleFactor();
      let cb=(btn)=>{
        let mode, id = btn.m5.uuid;
        if(id == "play#1") mode=1;
        else if(id == "play#2") mode=2;
        _Z.replaceScene(this,"StartMenu", {mode:mode, level:1}) };
      let b1=_I.makeButton(_S.bitmapText("One Player",{fill:"#cccccc",
                                                       fontName:"unscii",
                                                       fontSize:24*K,align:"center"}));
      let b2=_I.makeButton(_S.bitmapText("Two Player",{fill:"#cccccc",
                                                       fontName:"unscii",
                                                       fontSize:24*K,align:"center"}));
      let gap=_S.bitmapText("or",{fill:"#cccccc",
                                  fontName:"unscii",fontSize:24*K,align:"center"});

      b1.m5.uuid="play#1";
      b1.m5.press=cb;
      b2.m5.uuid="play#2";
      b2.m5.press=cb;

      this.insert(_G.Backgd());
      this.insert(_Z.layoutY([b1,gap,b2])) });

    function _drawBox(ctx){
      let grid=_G.grid,
          gf= grid[0],
          gl= grid[grid.length-1];
      let K=Mojo.getScaleFactor();

      ctx.beginFill("#000000");
      ctx.strokeStyle= "white";
      ctx.lineWidth=4*K;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      ctx.endFill();
    }
    /**
     * @private
     * @function
     */
    function _drawGrid(ctx){
      let grid=_G.grid,
          gf= grid[0][0],
          K=Mojo.getScaleFactor();
      _S.drawGridLines(gf.x1,gf.y1,grid,4*K,"white",ctx) }

    function _seeder(){
      return _.fill(new Array(_G.DIM*_G.DIM),0) }

    /**
     * @public
     */
    _Z.defScene("PlayGame",{
      onAI(pos){
        let y=MFL(pos/_G.DIM);
        let x=pos%_G.DIM;
        let t= this.getChildById(`tile,${x},${y}`);
        Mojo.emit(["ai.moved",t]);
      },
      _initLevel(options){
        let mode=options.mode,
            grid= _S.gridSQ(3,0.8),
            s=_S.sprite("icons.png"),
            cz= _S.bboxSize(grid[0][0]);
        _G.iconSize=[MFL(s.width/3), s.height];
        // o == 79, x= 88
        _.inject(_G,{level: options.level,
                     lastWin: 0,
                     ai: null,
                     mode: mode,
                     pnum: _G.X,
                     grid: grid,
                     cells: _seeder(),
                     goals: _G.mapGoalSpace(),
                     pcur: options.startsWith,
                     players: _.jsVec(null,null,null),
                     iconScale: Mojo.scaleXY(_G.iconSize,cz) });
        return mode;
      },
      setup(options){
        let mode=this._initLevel(options);
        let scale= _G.iconScale;
        let self=this,
            grid=_G.grid,
            dim=grid.length;
        let box=_S.group(_S.drawBody(_drawGrid));
        _S.centerAnchor(box.children[0]);
        _V.set(box,MFL(Mojo.width/2),
                   MFL(Mojo.height/2));
        this.insert(_G.Backgd());
        this.insert(box);
        for(let r,y=0; y< grid.length;++y){
          r=grid[y];
          for(let s,id,b,x=0; x<r.length;++x){
            b=_S.bboxCenter(r[x]);
            id= `tile,${x},${y}`;
            s=_G.Tile(b[0],b[1],_G.iconSize[0],_G.iconSize[1],
                      {uuid: id, scale: scale, gpos: y*dim+x, gval: 0});
            this.insert(s);
          }
        }
        //decide who plays X and who starts
        if(mode===1){
          let a= this.AI=_G.AI(_G.O);
          a.scene=this;
          Mojo.on(["ai.moved",this],"onAI");
          _G.ai=a;
          //ai starts?
          if(_G.pcur===_G.O){
            _.delay(100, () => Mojo.emit(["ai.move", a])) } }
      }
    });

  };

})(this);

