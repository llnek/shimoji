MojoH5.GameMain=function(Mojo) {
  let _=Mojo.u,
      G= Mojo.Game,
      EBus= Mojo.EventBus;

  /**
   * @public
   * @function
   */
  G.getIcon = (v) => {
    if(v===G.O || v==="O") return "o.png";
    if(v===G.X || v==="X") return "x.png";
    return "z.png";
  };

  /**
   * @public
   * @function
   */
  G.getIconValue = (v) => {
    if(v===G.O) return G.O;
    if(v===G.X) return G.X;
  };

  G.getIconImage = (v) => {
    if(v===G.O) return "O";
    if(v===G.X) return "X";
  };

  G.switchPlayer = () => {
    let c=Mojo.state.get("pcur"),
        ai= Mojo.state.get("ai");
    if(c===G.X)
      Mojo.state.set("pcur", G.O);
    if(c===G.O)
      Mojo.state.set("pcur", G.X);
    if(ai && ai.pnum !== c) {
      EBus.pub("ai.move",ai);
    }
  };

  /**
   * @public
   * @function
   */
  G.checkTie= () => {
    let data= Mojo.state.get("cells");
    for(let i=0;i<data.length;++i)
      if(data[i]===0)
        return false;
    return true;
  };

  /**
   * @public
   * @function
   */
  G.checkState= () => {
    let v= Mojo.state.get("pcur"),
        d= Mojo.state.get("cells"),
        tied=true,
        goals= Mojo.state.get("goals");
    for(let i=0;i<d.length;++i) if(d[i]===0) tied=false;
    if(tied)
      return -1;
    for(let ok, arr,g=0; g < goals.length; ++g) {
      arr=goals[g];
      ok=0;
      for(let i=0; i<arr.length; ++i) {
        if(d[arr[i]]===v) ++ok;
      }
      if(ok===arr.length) return 1;
    }
    return 0;
  };

  /** Calculate position of each individual cells in the grid,
    * so that we can detect when a user clicks on the cell
    * @public
    * @function
    */
  G.mapGridPos= (dim) => {
    let wb = Mojo.v2(Mojo.width/2,Mojo.height/2),
        cx,cy,x0,y0,x1,y1,x2,y2,out= _.jsVec(),
        sz = 0.6 * (Mojo.height>Mojo.width ? Mojo.width : Mojo.height);
    //size of cell
    cz = _.floor(sz/dim);
    //size of grid
    sz = cz * dim;
    //top,left
    y1=y0=(Mojo.height - sz)/2;
    x1=x0=(Mojo.width - sz)/2;
    for(let r=0; r<dim; ++r) {
      for(let c= 0; c<dim; ++c) {
        y2 = y1 + cz;
        x2 = x1 + cz;
        _.conj(out,Mojo.bbox4(x1,x2,y1,y2));
        x1 = x2;
      }
      y1 = y2;
      x1 = x0;
    }
    return out;
  };

  /**
   * @public
   * @function
   */
  G.mapGoalSpace = () => {
    let dx=[],
        dy= [],
        goals= _.jsVec(),
        dim=Mojo.Game.DIM;
    for(let r=0; r<dim; ++r) {
      let h=[], v=[];
      for(let c=0; c<dim; ++c) {
        h[c] = r * dim + c;
        v[c] = c * dim + r;
      }
      _.conj(goals,h);
      _.conj(goals,v);
      dx[r] = r * dim + r;
      dy[r] = (dim - r - 1) * dim + r;
    }
    _.conj(goals,dx);
    _.conj(goals,dy);
    return goals;
  };



};



MojoH5.Config= {
  modules: "NegaMax,GameMain,GameSprites,GameUI,GameAI,GameScenes",
  devMode: true,
  mouse: { cursor: "on"},
  maximize: true,
  //width: 320, height: 480,
  //scaleToFit: true,
  start: function(Mojo) {
    Mojo.load(["bgblack.jpg","z.png","x.png","o.png"], function() {
      Mojo.u.inject(Mojo.Game, {DIM:3, X:88, O:79});
      Mojo.runScene("Splash");
    });
  }
};



