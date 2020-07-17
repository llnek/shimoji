MojoH5.GameSprites = function(Mojo) {

  let _=Mojo.u,
      is= Mojo.is,
      G= Mojo.Game,
      EBus=Mojo.EventBus;

  /**
   * @public
   */
  Mojo.defType(["Backgd",Mojo.Sprite], {
    init: function() {
      let pic=Mojo.asset("bgblack.jpg"),
          pz=[pic.width,pic.height],
          scale=Mojo.scaleXY(pz);
      this._super({x: Mojo.width/2,
                   y: Mojo.height/2,
                   scale: scale,
                   type: Mojo.E_NONE,
                   asset: "bgblack.jpg"});
    }
  },Mojo.Game);

  Mojo.defType(["AI", Mojo.Sprite], {
    init: function(v) {
      this._super({type: Mojo.E_NONE});
      this.pnum=v;
      this.hide();
      this.board= new G.TTToe(G.X, G.O);
      EBus.sub("ai.move",this, "aiMove",this);
    },
    dispose: function() {
      EBus.unsub("ai.move",this, "aiMove",this);
    },
    update: function() {},
    render: function() {},
    aiMove: function() {
      _.timer(()=> {
        this.makeMove();
      },500);
    },
    makeMove: function() {
      let rc, pos,
          cells= Mojo.state.get("cells");
      this.board.syncState(cells, this.pnum);
      pos= this.board.getFirstMove();
      if(pos < 0)
        pos= Mojo.NegaMax.evalNegaMax(this.board);

      cells[pos] = this.pnum;
      EBus.pub("ai.moved",this.scene,pos);
      G.playSnd();

      rc= G.checkState();
      if(rc===0)
        G.switchPlayer();
      else {
        Mojo.state.set("lastWin", rc===1 ? Mojo.state.get("pcur") : 0);
        Mojo.runScene("EndGame",5);
      }
    }
  }, G);

  /**
   * @public
   */
  Mojo.defType(["Tile",Mojo.Sprite], {
    init: function(p) {
      this._super(p,{asset: G.getIcon(0)});
      EBus.sub([["touch",this],
                ["ai.moved",this,"aiMoved"]]);
    },
    aiMoved: function() {
      EBus.unsub("touch",this);
      this.p.marked=true;
      this.p.asset= G.getIcon(Mojo.state.get("pcur"));
    },
    touch: function(arg) {
      let s= Mojo.state,
          v=s.get("pcur"),
          ai=s.get("ai"),
          p1= s.get("pnum"),
          cells= Mojo.state.get("cells");
      if(ai && v===ai.pnum) { return; }
      if(this.p.marked) {return;}

      EBus.unsub("touch",this);
      this.p.marked=true;
      G.playSnd();

      if(cells[this.p.gpos] !== 0)
        throw "Fatal: cell marked already!!!!";

      this.p.asset= G.getIcon(v);
      //this.p.gval=v;
      cells[this.p.gpos]= v;

      let rc= G.checkState();
      if(rc===0)
        G.switchPlayer();
      else {
        Mojo.state.set("lastWin", rc===1 ? Mojo.state.get("pcur") : 0);
        Mojo.runScene("EndGame",5);
      }
    }
  },Mojo.Game);


};
