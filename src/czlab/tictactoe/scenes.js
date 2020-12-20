;(function(window){
  "use strict";

  window["io.czlab.tictactoe.Scenes"]=function(Mojo){
    const _S=Mojo.Sprites;
    const _Z=Mojo.Scenes;
    const _I=Mojo.Input;
    const G= Mojo.Game;
    const _= Mojo.u;

    G.playSnd= (snd) => {
      let s,c= G.state.get("pcur");
      if (c===G.X) s="x.mp3";
      if (c===G.O) s="o.mp3";
      if(snd)
        s=snd;
      if(s)
        Mojo.sound(s).play();
    };

    _Z.defScene("Splash",function(){
      let verb = Mojo.touchDevice ? "Tap": "Click";
      Mojo.Game.state.reset();
      this.insert(G.Backgd());
      let fz= 48*Mojo.contentScaleFactor().width;
      let msg=_S.text(`${verb} Play to start`,
                      {align:"center",fontSize:fz,fill:"white"},
                      Mojo.width/2, Mojo.height * 0.8);
      msg.mojoh5.resize=function(){
        msg.x=Mojo.width/2;
        msg.y=Mojo.height*0.8;
        msg.style.fontSize = 48 * Mojo.contentScaleFactor().width;
      };
      this.insert(_S.centerAnchor(msg));
      //in pixi, no fontSize, defaults to 26, left-align
      fz=24*Mojo.contentScaleFactor().width;
      let b=_I.makeButton(_S.text("Play Game!",{fill:"#cccccc",fontSize:fz,align:"center"}));
      b.mojoh5.press= () => _Z.replaceScene(this.____sid,"MainMenu");
      b.mojoh5.resize=function(){
        b.style.fontSize = 24 * Mojo.contentScaleFactor().width;
        b.x=b.y=0;
      };
      this.insert(_Z.layoutY([b]));
    });

    _Z.defScene("EndGame",{
      onCanvasResize(old){
        _S.resize({x:0,y:0,width:old[0],height:old[1],children:this.children});
      },
      setup(){
        let mode = G.state.get("mode");
        let w= G.state.get("lastWin");
        let msg="No Winner!";

        if(w===G.X)
          msg= mode===1 ? "You win !" : "X wins !";
        if(w===G.O)
          msg= mode===1 ? "You lose !" : "O wins !";

        let space=_S.text(" ");
        space.alpha=0;
        let fz=24*Mojo.contentScaleFactor().width;
        let b1=_I.makeButton(_S.text("Play Again?",{fill:"#ccc",align:"center",fontSize:fz}));
        b1.mojoh5.resize=function(){
          b1.style.fontSize= 24*Mojo.contentScaleFactor().width;
        };
        b1.mojoh5.press=()=>{
          _Z.removeScenes();
          _Z.runScene("MainMenu");
        }
        let b2=_I.makeButton(_S.text("Quit",{fill:"#ccc",align:"center",fontSize:fz}));
        b2.mojoh5.resize=function(){
          b2.style.fontSize= 24*Mojo.contentScaleFactor().width;
        };
        b2.mojoh5.press=()=>{
          _Z.removeScenes();
          _Z.runScene("Splash");
        };

        let m1=_S.text("Game Over",{fill: "white",align:"center",fontSize:fz});
        let m2=_S.text(msg,{fill: "white",align:"center",fontSize:fz});
        let gap=_S.text("or",{fill:"white",align:"center",fontSize:fz});
        m1.mojoh5.resize=function(){
          m1.style.fontSize= 24*Mojo.contentScaleFactor().width;
        };
        m2.mojoh5.resize=function(){
          m2.style.fontSize= 24*Mojo.contentScaleFactor().width;
        };
        gap.mojoh5.resize=function(){
          gap.style.fontSize= 24*Mojo.contentScaleFactor().width;
        };

        let box=_Z.layoutY([m1, m2, space, b1, gap, b2]);
        this.insert(box);
        G.playSnd("end.mp3");
      }
    });

    _Z.defScene("StartMenu", function(options){
      this.insert(G.Backgd());
      let msg1,msg2;
      let cb= (btn)=>{
        let id=btn.mojoh5.uuid;
        let who;
        if(id==="play#x") who=G.X;
        if(id==="play#o") who=G.O;
        _Z.replaceScene(this.____sid,"PlayGame",
                        {mode:options.mode,
                         startsWith: who,
                         level: options.level});
      };
      if(options.mode===1){
        msg1 = "You (X) start?";
        msg2 = "Bot (O) start?";
      }
      if(options.mode===2){
        msg1 = "(X) start?";
        msg2 = "(O) start?";
      }
      let fz=24*Mojo.contentScaleFactor().width;
      let b1=_I.makeButton(_S.text(msg1,{fill:"#cccccc",fontSize:fz,align:"center"}));
      b1.mojoh5.uuid= "play#x";
      b1.mojoh5.press=cb;
      b1.mojoh5.resize=function(){
        b1.style.fontSize= 24*Mojo.contentScaleFactor().width;
      };
      let b2=_I.makeButton(_S.text(msg2,{fill:"#cccccc",fontSize:fz,align:"center"}));
      b2.mojoh5.uuid= "play#o";
      b2.mojoh5.press=cb;
      b2.mojoh5.resize=function(){
        b2.style.fontSize= 24*Mojo.contentScaleFactor().width;
      };
      let gap=_S.text("or",{fill: "#cccccc",fontSize:fz,align:"center"});
      gap.mojoh5.resize=function(){
        gap.style.fontSize= 24*Mojo.contentScaleFactor().width;
      };
      this.insert(_Z.layoutY([b1, gap, b2]));
    });

    _Z.defScene("MainMenu", function(){
      this.insert(G.Backgd());
      let cb=(btn)=>{
        let mode, id = btn.mojoh5.uuid;
        if(id === "play#1") mode=1;
        if(id === "play#2") mode=2;
        _Z.replaceScene(this.____sid,"StartMenu", {mode:mode, level:1});
      };
      let K=Mojo.contentScaleFactor();
      let fz=24*K.width;
      let b1=_I.makeButton(_S.text("One Player",{fill:"#cccccc",fontSize:fz,align:"center"}));
      b1.mojoh5.uuid="play#1";
      b1.mojoh5.press=cb;
      b1.mojoh5.resize=function(){
        b1.style.fontSize= 24*Mojo.contentScaleFactor().width;
        b1.x=b1.y=0;
      };
      let b2=_I.makeButton(_S.text("Two Player",{fill:"#cccccc",fontSize:fz,align:"center"}));
      b2.mojoh5.uuid="play#2";
      b2.mojoh5.press=cb;
      b2.mojoh5.resize=function(){
        b2.style.fontSize= 24*Mojo.contentScaleFactor().width;
        b2.x=b2.y=0;
      };
      let gap=_S.text("or",{fill:"#cccccc",fontSize:fz,align:"center"});
      gap.mojoh5.resize=function(){
        gap.style.fontSize= 24*Mojo.contentScaleFactor().width;
        gap.x=gap.y=0;
      };
      this.insert(_Z.layoutY([b1,gap,b2]));
    });

    function _drawBox(ctx){
      let grid=G.state.get("grid"),
          gf = grid[0], gl = grid[grid.length-1];

      ctx.beginFill("#000000");
      ctx.strokeStyle= "white";
      ctx.lineWidth=4;
      ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      ctx.endFill();
      /*
      ctx.beginPath();
      ctx.moveTo(gf.x1,gf.y1);
      ctx.lineTo(gl.x2,gf.y1);
      ctx.lineTo(gl.x2,gl.y2);
      ctx.lineTo(gf.x1,gl.y2);
      ctx.lineTo(gf.x1,gf.y1);
      ctx.closePath();
      ctx.stroke();
      */
    }
    /**
     * @private
     * @function
     */
    function _drawGrid(ctx){
      let dim = G.DIM,
          dm1=dim-1,
          grid=G.state.get("grid"),
          gf = grid[0], gl = grid[grid.length-1];

      ctx.beginFill("#000000");
      //ctx.drawRect(gf.x1,gf.y1,gl.x2-gf.x1,gl.y2-gf.y1);
      ctx.lineStyle(4,_S.color("white"),1);
      for(let b,e,p,r=1;r<dm1;++r){
        p=r*dim; b=grid[p]; e=grid[p+dm1];
        ctx.moveTo(b.x1,b.y1); ctx.lineTo(e.x2,e.y1);
        ctx.moveTo(b.x1,b.y2); ctx.lineTo(e.x2,e.y2);
      }
      for(let b,e,c=1;c<dm1;++c) {
        b=grid[c]; e=grid[c+dim*dm1];
        ctx.moveTo(b.x1,b.y1); ctx.lineTo(e.x1,e.y2);
        ctx.moveTo(b.x2,b.y1); ctx.lineTo(e.x2,e.y2);
      }
      ctx.endFill();
    }

    function _seeder(){
      return _.fill(new Array(G.DIM*G.DIM),0)
    }

    /**
     * @public
     */
    _Z.defScene("PlayGame",{
      onAI(pos){
        let t= this.getChildById(`tile${pos}`);
        Mojo.EventBus.pub(["ai.moved",t]);
      },
      _initLevel(options){
        G.state.set("iconSize",[360,360]);
        let grid= G.mapGridPos(G.DIM),
            mode=options.mode,
            cz= _S.bboxSize(grid[0]);
        // o == 79, x= 88
        G.state.set({level: options.level,
                     lastWin: 0,
                     ai: null,
                     mode: mode,
                     pnum: G.X,
                     pcur: options.startsWith,
                     grid: grid,
                     cells: _seeder(),
                     goals: G.mapGoalSpace(),
                     players: _.jsVec(null,null,null),
                     iconScale: Mojo.scaleXY(G.state.get("iconSize"),cz) });
        return mode;
      },
      onCanvasResize(old){
        let g=G.mapGridPos(G.DIM);
        let cz= _S.bboxSize(g[0]);
        G.state.set("grid", g);
        G.state.set("iconScale", Mojo.scaleXY(G.state.get("iconSize"),cz));
        _S.resize({x:0,y:0,width:old[0],height:old[1],children:this.children});
      },
      setup(options){
        let mode=this._initLevel(options);
        let scale= G.state.get("iconScale");
        let self=this,grid=G.state.get("grid");
        this.insert(G.Backgd());
        let box=_S.group(_S.drawBody(_drawGrid));
        box.children[0].anchor.set(0.5);
        box.x=Mojo.width/2;
        box.y=Mojo.height/2;
        box.mojoh5.resize=function(){
          box.removeChildren();
          let b=_S.drawBody(_drawGrid);
          b.anchor.set(0.5);
          box.addChild(b);
          box.x=Mojo.width/2;
          box.y=Mojo.height/2;
        };
        this.insert(box);
        for(let id,b,s,g,i=0;i<grid.length;++i){
          b=_S.bboxCenter(grid[i]);
          id = "tile"+i;
          s=G.Tile(b[0],b[1],360,360,{uuid: id, scale: scale, gpos: i, gval: 0});
          this.insert(s);
        }
        //decide who plays X and who starts
        if(mode===1){
          let a= this.AI=G.AI(G.O);
          a.scene=this;
          Mojo.EventBus.sub(["ai.moved",this],"onAI");
          G.state.set("ai",a);
          //ai starts?
          if(G.state.get("pcur")===G.O){
            _.delay(100, () => Mojo.EventBus.pub(["ai.move", a]))
          }
        }
      }
    });

  };


})(this);

