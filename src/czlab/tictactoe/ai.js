;(function(window){
  "use strict";

  window["io/czlab/tictactoe/AI"]=function(Mojo){
    const Nega= window["io/czlab/mcfud/negamax"]();
    const _ = Mojo.u;
    const G= Mojo.Game;

    class C extends Nega.GameBoard{
      constructor(p1v,p2v){
        super();
        this.actors= [0, p1v, p2v];
        this.grid=[];
        this.depth=6;
        this.goals= G.mapGoalSpace();
      }
      isNil(cellv){
        return cellv === 0
      }
      getFirstMove(){
        let sz= this.grid.length;
        return sz>0 && _.every(this.grid, 0) ? _.randInt2(0,sz-1) : -1;
      }
      syncState(seed, actor){
        this.grid.length=0;
        _.append(this.grid,seed);
        this.actors[0] = actor;
      }
      getNextMoves(snap){
        let rc= [],
            sz= snap.state.length;
        for(let i=0; i<sz; ++i)
          if(this.isNil(snap.state[i])) _.conj(rc,i);
        return rc;
      }
      undoMove(snap, move){
        _.assert(move >= 0 && move < snap.state.length);
        snap.state[move] = 0;
      }
      makeMove(snap, move){
        _.assert(move >= 0 && move < snap.state.length);
        if(this.isNil(snap.state[move]))
          snap.state[move] = snap.cur;
        else
          throw `Error: cell [${move}] is not free`;
      }
      switchPlayer(snap){
        let t = snap.cur;
        snap.cur= snap.other;
        snap.other= t;
      }
      getOtherPlayer(pv){
        if(pv === this.actors[1]) return this.actors[2];
        if(pv === this.actors[2]) return this.actors[1];
        return 0;
      }
      takeFFrame(){
        let ff = new Nega.FFrame(G.DIM);
        ff.state=_.fill(new Array(G.DIM*G.DIM),0);
        ff.other= this.getOtherPlayer(this.actors[0]);
        ff.cur= this.actors[0];
        _.copy(ff.state,this.grid);
        ff.lastBestMove= -1;
        return ff;
      }
      evalScore(snap){
        // if we lose, return a negative value
        for(let g, i=0; i<this.goals.length; ++i){
          g= this.goals[i];
          if(this.testWin(snap.state, snap.other, g))
            return -100;
        }
        return 0;
      }
      isOver(snap){
        for(let g, i=0; i < this.goals.length; ++i){
          g= this.goals[i];
          if (this.testWin(snap.state, snap.cur, g) ||
              this.testWin(snap.state, snap.other, g)) return true;
        }
        return this.isStalemate(snap);
      }
      isStalemate(snap){
        return _.notAny(snap.state, 0);
      }
      getWinner(snap, combo){
        let win= -1;
        for(let g,i=0; i< this.goals.length; ++i){
          g= this.goals[i];
          if(this.testWin(snap.state, snap.other, g))
            win=snap.other;
          else if(this.testWin(snap.state, snap.cur, g))
            win=snap.cur;
          ;
          if(win>0){ _.append(combo,g); break; }
        }
        return win;
      }
      testWin(vs, actor, g){
        let cnt=g.length;
        for(let n= 0; n<g.length; ++n){
          if(actor === vs[g[n]]) --cnt;
        }
        return cnt === 0;
      }
    }

    G.TTToe=function(p1v,p2v){
      return new C(p1v,p2v)
    }
  }

})(this);


