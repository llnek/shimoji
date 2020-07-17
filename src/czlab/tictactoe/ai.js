MojoH5.GameAI = function(Mojo) {
  let _ = Mojo.u,
      G= Mojo.Game,
      Nega= Mojo.NegaMax;

  /**
   * @public
   * @class
   */
  Mojo.defType(["TTToe", Nega.GameBoard], {
    init: function(p1v, p2v) {
      this.actors = [0, p1v, p2v];
      this.grid=[];
      this.goals= G.mapGoalSpace();
    },
    isNil: (cellv) => {
      return cellv === 0;
    },
    getFirstMove: function() {
      let sz= this.grid.length;
      return sz>0 && _.every(this.grid, 0) ? _.randBetween(0,sz-1) : -1;
    },
    syncState: function(seed, actor)  {
      this.grid.length=0;
      _.append(seed,this.grid);
      this.actors[0] = actor;
    },
    getNextMoves: function(snap) {
      let rc= [],
          sz= snap.state.length;
      for(let i=0; i<sz; ++i)
        if(this.isNil(snap.state[i])) _.conj(rc,i);
      return rc;
    },
    undoMove: function(snap, move) {
      _.assert(move >= 0 && move < snap.state.length);
      snap.state[move] = 0;
    },
    makeMove: function(snap, move) {
      _.assert(move >= 0 && move < snap.state.length);
      if(this.isNil(snap.state[move]))
        snap.state[move] = snap.cur;
      else
        throw "Error: cell [" + move + "] is not free";
    },
    switchPlayer: function(snap) {
      let t = snap.cur;
      snap.cur= snap.other;
      snap.other= t;
    },
    getOtherPlayer: function(pv) {
      if(pv === this.actors[1]) return this.actors[2];
      if(pv === this.actors[2]) return this.actors[1];
      return 0;
    },
    takeFFrame: function() {
      let ff = new Nega.FFrame(G.DIM);
      ff.other= this.getOtherPlayer(this.actors[0]);
      ff.cur= this.actors[0];
      _.copy(this.grid, ff.state);
      ff.lastBestMove= -1;
      return ff;
    },
    evalScore: function(snap) {
      // if we lose, return a negative value
      for(let g, i=0; i<this.goals.length; ++i) {
        g= this.goals[i];
        if(this.testWin(snap.state, snap.other, g))
          return -100;
      }
      return 0;
    },
    isOver: function(snap) {
      for(let g, i=0; i < this.goals.length; ++i) {
        g= this.goals[i];
        if (this.testWin(snap.state, snap.cur, g) ||
            this.testWin(snap.state, snap.other, g)) return true;
      }
      return this.isStalemate(snap);
    },
    isStalemate: function(snap) {
      return _.notAny(snap.state, 0);
    },
    getWinner: function(snap, combo) {
      let win= -1;
      for(let g,i=0; i< this.goals.length; ++i) {
        g= this.goals[i];
        if(this.testWin(snap.state, snap.other, g))
          win=snap.other;
        else if(this.testWin(snap.state, snap.cur, g))
          win=snap.cur;
        ;
        if(win>0) { _.append(g,combo); break; }
      }
      return win;
    },
    testWin: function(vs, actor, g) {
      let cnt=g.length;
      for(let n= 0; n<g.length; ++n) {
        if(actor === vs[g[n]]) --cnt;
      }
      return cnt === 0;
    }

  }, G);

};


