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
      let msg=_S.text(`${verb} Play to start`,
                      {align:"center",fontSize:20,fill:"white"},
                      Mojo.canvas.width/2, Mojo.canvas.height * 0.8);
      this.insert(_S.centerAnchor(msg));
      let b=_I.makeButton(_S.text("Play Game!",{fill:"#cccccc"}));
      b.mojoh5.press= () => _Z.replaceScene(this.____sid,"MainMenu");
      this.insert(_Z.layoutY([b]));
    });

    _Z.defScene("EndGame",function(){
      let mode = G.state.get("mode");
      let w= G.state.get("lastWin");
      let msg="No Winner!";

      if(w===G.X)
        msg= mode===1 ? "You win !" : "X wins !";
      if(w===G.O)
        msg= mode===1 ? "You lose !" : "O wins !";

      let space=_S.text(" ");
      space.alpha=0;
      let b1=_I.makeButton(_S.text("Play Again?",{fill:"#ccc"}));
      b1.mojoh5.press=()=>{
        _Z.replaceScene(this.____sid,"MainMenu");
      }
      let b2=_I.makeButton(_S.text("Quit",{fill:"#ccc"}));
      b2.mojoh5.press=()=>{
        _Z.replaceScene(this.____sid,"Splash");
      }
      let box=_Z.layoutY([_S.text("Game Over",{fill: "white"}),
                          _S.text(msg,{fill: "white"}),
                          space,
                          b1, _S.text("or",{fill:"white"}), b2]);
      this.insert(box);
      G.playSnd("end.mp3");
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
      let b1=_I.makeButton(_S.text(msg1,{fill:"#cccccc"}));
      b1.mojoh5.uuid= "play#x";
      b1.mojoh5.press=cb;
      let b2=_I.makeButton(_S.text(msg2,{fill:"#cccccc"}));
      b2.mojoh5.uuid= "play#o";
      b2.mojoh5.press=cb;
      this.insert(_Z.layoutY([b1,
                              _S.text("or",{fill: "#cccccc"}), b2]));
    });

    _Z.defScene("MainMenu", function(){
      this.insert(G.Backgd());
      let cb=(btn)=>{
        let mode, id = btn.mojoh5.uuid;
        if(id === "play#1") mode=1;
        if(id === "play#2") mode=2;
        _Z.replaceScene(this.____sid,"StartMenu", {mode:mode, level:1});
      };
      let b1=_I.makeButton(_S.text("One Player",{fill:"#cccccc"}));
      b1.mojoh5.uuid="play#1";
      b1.mojoh5.press=cb;
      let b2=_I.makeButton(_S.text("Two Player",{fill:"#cccccc"}));
      b2.mojoh5.uuid="play#2";
      b2.mojoh5.press=cb;
      this.insert(_Z.layoutY([b1,_S.text("or",{fill:"#cccccc"}),b2]));
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
        let grid= G.mapGridPos(G.DIM),
            mode=options.mode,
            xz= [360,360],
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
                     iconSize: xz,
                     goals: G.mapGoalSpace(),
                     iconScale: Mojo.scaleXY(xz,cz),
                     players: _.jsVec(null,null,null)});
        return mode;
      },
      setup(options){
        let mode=this._initLevel(options);
        let scale= G.state.get("iconScale");
        let self=this,grid=G.state.get("grid");
        this.insert(G.Backgd());
        let box=_S.drawBody(_drawGrid);
        box.anchor.set(0.5);
        box.x=Mojo.canvas.width/2;
        box.y=Mojo.canvas.height/2;
        this.insert(box);
        for(let id,b,s,g,i=0;i<grid.length;++i){
          b=_S.bboxCenter(grid[i]);
          id = "tile"+i;
          s=G.Tile(b[0],b[1],{uuid: id, scale: scale, gpos: i, gval: 0});
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

