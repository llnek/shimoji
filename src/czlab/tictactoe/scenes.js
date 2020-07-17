MojoH5.GameScenes = function(Mojo) {

  let _= Mojo.u,
      G= Mojo.Game,
      EBus = Mojo.EventBus;

  G.playSnd= (snd) => {
    let s,c= Mojo.state.get("pcur");
    if (c===G.X) s="x.mp3";
    if (c===G.O) s="o.mp3";
    if(snd)
      s=snd;
    if(s)
      Mojo.audio.play(s);
  }

  /**
   * @public
   */
  Mojo.defScene("Splash",function() {
    let verb = Mojo.touchDevice ? "Tap": "Click";
    Mojo.state.reset();
    this.insert(new Mojo.Game.Backgd());
    this.insert(new Mojo.UI.Text({
      label: verb+" Play to start",
      color: "white",
      size: 20,
      x: Mojo.width/2,
      y: Mojo.height * 0.8
    }));
    let box = this.insert(new Mojo.UI.VerticalLayout({x: Mojo.width/2,
                                                 y: Mojo.height/2,
                                                 fill: "rgba(0,0,0,0.5)"}));
    box.openLayout();
    box.addLayout(new Mojo.UI.Button({fill: "#CCCCCC",
                                      label: "Play Game!"},
                                     () => { Mojo.runScene("MainMenu"); }));
    box.lockLayout();
  });

  Mojo.defScene("EndGame",function() {
    let mode = Mojo.state.get("mode"),
        w= Mojo.state.get("lastWin"),
        box = new Mojo.UI.VerticalLayout({x: Mojo.width/2,
                                          y: Mojo.height/2,
                                          fit: 128,
                                          fill: "rgba(0,0,0,0.5)"});
    if(w===G.X)
      msg= mode===1 ? "You win !" : "X wins !";
    if(w===G.O)
      msg= mode===1 ? "You lose !" : "O wins !";
    if(w===0) msg= "No winner!";

    let cb1= () => {
      Mojo.removeScenes();
      Mojo.runScene("MainMenu");
    };
    let cb2= () => {
      Mojo.removeScenes();
      Mojo.runScene("Splash");
    };

    this.insert(box);
    box.openLayout();
    box.addLayout(new Mojo.UI.Text({label: "Game Over", color: "white"}),
      new Mojo.UI.Text({label: msg, color: "white"}),
      new Mojo.UI.Text({label: " "}),
      new Mojo.UI.Button({label: "Play Again?",fill:"#ccc"}, cb1),
      new Mojo.UI.Button({label: "or",fontColor:"white"}),
      new Mojo.UI.Button({label: "Quit",fill:"#ccc"}, cb2));
    box.lockLayout();
    G.playSnd("end.mp3");
  });

  Mojo.defScene("StartMenu", function() {
    this.insert(new Mojo.Game.Backgd());
    let msg1,msg2, mode= this.o.mode,
        box = new Mojo.UI.VerticalLayout({x: Mojo.width/2,
                                            y: Mojo.height/2,
                                            fill: "rgba(0,0,0,0.5)"});
    let cb= (btn) => {
      let id=btn.p.id;
      if(id==="play#x") who=G.X;
      if(id==="play#o") who=G.O;
      Mojo.runScene("PlayGame", {mode: mode,
                                 startsWith: who,
                                 level: this.o.level});
    };
    if(mode===1) {
      msg1 = "You (X) start?";
      msg2 = "Bot (O) start?";
    }
    if(mode===2) {
      msg1 = "(X) start?";
      msg2 = "(O) start?";
    }
    this.insert(box);
    box.openLayout();
    box.addLayout(new Mojo.UI.Button({id: "play#x",
                                      fill: "#CCCCCC", label: msg1}, cb),
      new Mojo.UI.Button({label: "or", fontColor: "white"}),
                  new Mojo.UI.Button({id: "play#o", fill: "#CCCCCC", label: msg2}, cb));
    box.lockLayout();
  });

  Mojo.defScene("MainMenu", function() {
    this.insert(new Mojo.Game.Backgd());
    let box = this.insert(new Mojo.UI.VerticalLayout({x: Mojo.width/2,
                                                      y: Mojo.height/2,
                                                      fill: "rgba(0,0,0,0.5)"}));
    let cb = (btn) => {
      let mode, id = btn.p.id;
      if(id === "play#1") mode=1;
      if(id === "play#2") mode=2;
      Mojo.runScene("StartMenu", {mode: mode, level: 1});
    };
    box.openLayout();
    box.addLayout(new Mojo.UI.Button({id: "play#1",
                                      fill: "#CCCCCC",
                                      label: "One Player"}, cb),
                  new Mojo.UI.Button({id: "play#2",
                                      fill: "#CCCCCC",
                                      label: "Two Player"}, cb));
    box.lockLayout();
  });

  /**
   * @private
   * @function
   */
  let _drawBox=(ctx) => {
    let grid=Mojo.state.get("grid"),
        gf = grid[0], gl = grid[grid.length-1];

    ctx.strokeStyle= "white";
    ctx.lineWidth=4;

    ctx.beginPath();
    ctx.moveTo(gf.x1,gf.y1);
    ctx.lineTo(gl.x2,gf.y1);
    ctx.lineTo(gl.x2,gl.y2);
    ctx.lineTo(gf.x1,gl.y2);
    ctx.lineTo(gf.x1,gf.y1);
    ctx.closePath();
    ctx.stroke();
  };

  /**
   * @private
   * @function
   */
  let _drawGrid=(ctx) => {
    let dim = Mojo.Game.DIM,
        dm1=dim-1,
        grid=Mojo.state.get("grid"),
        gf = grid[0], gl = grid[grid.length-1];

    ctx.strokeStyle= "white";
    ctx.lineWidth=4;

    for(let b,e,p,r=1;r<dm1;++r) {
      p=r*dim; b=grid[p]; e=grid[p+dm1];
      ctx.beginPath();
      ctx.moveTo(b.x1,b.y1); ctx.lineTo(e.x2,e.y1);
      ctx.moveTo(b.x1,b.y2); ctx.lineTo(e.x2,e.y2);
      ctx.stroke();
    }
    for(let b,e,c=1;c<dm1;++c) {
      b=grid[c]; e=grid[c+dim*dm1];
      ctx.beginPath();
      ctx.moveTo(b.x1,b.y1); ctx.lineTo(e.x1,e.y2);
      ctx.moveTo(b.x2,b.y1); ctx.lineTo(e.x2,e.y2);
      ctx.stroke();
    }
  };

  /**
   * @private
   * @function
   */
  let _seeder= () => {
    return _.fill(new Array(G.DIM*G.DIM),0);
  };

  /**
   * @public
   */
  Mojo.defScene("PlayGame",{
    postrender: function(ctx) {
      _drawGrid(ctx);
    },
    onAI: function(pos) {
      let t= this.find("tile"+pos);
      EBus.pub("ai.moved",t);
    },
    initLevel: function() {
      let grid= G.mapGridPos(G.DIM),
          mode=this.o.mode,
          x= Mojo.asset("x.png"),
          xz= [x.width,x.height],
          cz= Mojo.bboxSize(grid[0]);
      // o == 79, x= 88
      Mojo.state.set({level: this.o.level,
                      lastWin: 0,
                      ai: null,
                      mode: mode,
                      pnum: G.X,
                      pcur: this.o.startsWith,
                      grid: grid,
                      cells: _seeder(),
                      iconSize: xz,
                      goals: G.mapGoalSpace(),
                      iconScale: Mojo.scaleXY(xz,cz),
                      players: _.jsVec(null,null,null)});
      return mode;
    },
    setup: function() {
      this.insert(new Mojo.Game.Backgd());
      let mode=this.initLevel(),
          scale= Mojo.state.get("iconScale"),
          self=this,grid=Mojo.state.get("grid");
      for(let b,s,g,i=0;i<grid.length;++i) {
        b=Mojo.bboxCenter(grid[i]);
        id = "tile"+i;
        s=new G.Tile({id: id, x: b[0], y: b[1],
                      scale: scale, gpos: i, gval: 0});
        self.insert(s);
      }
      //decide who plays X and who starts
      if(mode===1) {
        let a= this.insert(new G.AI(G.O));
        EBus.sub("ai.moved",this,"onAI",this);
        Mojo.state.set("ai",a);
        //ai starts?
        if(Mojo.state.get("pcur")===G.O) {
          _.timer(() => { EBus.pub("ai.move", a); },100);
        }
      }
    }
  });


};
