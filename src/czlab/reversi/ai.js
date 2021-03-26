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

  window["io/czlab/reversi/AI"]=function(Mojo){
    const Nega= window["io/czlab/mcfud/negamax"]();
    const {Game:_G,
           ute:_,is,EventBus} = Mojo;

    //used by the AI to give more importance to the border
    const BOARD_SCORE = [[9,3,3,3,3,3,3,9],
                         [3,1,1,1,1,1,1,3],
                         [3,1,1,1,1,1,1,3],
                         [3,1,1,1,1,1,1,3],
                         [3,1,1,1,1,1,1,3],
                         [3,1,1,1,1,1,1,3],
                         [3,1,1,1,1,1,1,3],
                         [9,3,3,3,3,3,3,9]];

    function _possibleMoves(cells,cur,other){
      let moves=[],
          pos=[0,0];
      for(let f,row,r=0;r<cells.length;++r){
        row=cells[r];
        for(let c=0;c<row.length;++c){
          if(row[c]===0){
            pos[0]=r;
            pos[1]=c;
            f=_G.piecesFlipped(cells, pos,cur,other);
            if(f.length>0)
              moves.push([r,c]);
          }
        }
      }
      return moves;
    }

    class C extends Nega.GameBoard{
      constructor(p1v,p2v){
        super();
        this.actors= [0, p1v, p2v];
        this.cells=[];
        this.depth=8;
      }
      getStateCopier(){
        return (state)=>{ return _.deepCopyArray(state) }
      }
      /*
      getFirstMove(snap){
        let moves=_possibleMoves(snap.state,snap.cur,snap.other);
        return moves.length>0?moves[0]:null;
      }
      */
      syncState(seed, actor){
        this.cells.length=0;
        this.actors[0] = actor;
        seed.forEach(s=> this.cells.push(s.slice()));
      }
      getNextMoves(snap){
        return _possibleMoves(snap.state,snap.cur,snap.other)
      }
      makeMove(snap, move){
        _.assert(move[1] >= 0 && move[1] < snap.state[0].length);//col
        _.assert(move[0] >= 0 && move[0] < snap.state.length);//row
        let f= _G.piecesFlipped(snap.state,move, snap.cur,snap.other);
        _.assert(f.length>0,"nothing flipped!!!!");
        f.forEach(p=>{ snap.state[p[0]][p[1]]=snap.cur; });
        snap.state[move[0]][move[1]]=snap.cur;
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
      takeGFrame(){
        let ff = new Nega.GFrame();
        ff.other= this.getOtherPlayer(this.actors[0]);
        ff.cur= this.actors[0];
        ff.state=_.deepCopyArray(this.cells);
        ff.lastBestMove= null;
        return ff;
      }
      evalScore(snap){
        let c_cnt=0;
        let c_sum=0;
        let o_cnt=0;
        let o_sum=0;
        let e_cnt=0;
        snap.state.forEach((row,r) => row.forEach((v,c) => {
          if(v===snap.cur){
            ++c_cnt;
            c_sum += BOARD_SCORE[r][c];
          }else if(v===snap.other){
            ++o_cnt;
            o_sum += BOARD_SCORE[r][c];
          }else{
            ++e_cnt;
          }
        }));
        //less than half the board is full
        return e_cnt>32 ? (c_sum-o_sum) : (c_cnt-o_cnt);
      }
      isOver(snap){
        let e=0;
        for(let row,r=0;r<snap.state.length;++r){
          row=snap.state[r];
          for(let c=0;c<row.length;++c){
            if(row[c]===0){
              ++e;
              break;
            }
          }
        }
        return e===0 || this.isStalemate(snap);
      }
      isStalemate(snap){
        return _possibleMoves(snap.state,snap.cur,snap.other).length===0 &&
               _possibleMoves(snap.state,snap.other,snap.cur).length===0;
      }
    }

    _G.Reversi=function(p1v,p2v){
      return new C(p1v,p2v)
    }
  }

})(this);


