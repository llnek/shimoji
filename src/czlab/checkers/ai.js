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

  window["io/czlab/checkers/AI"]=function(Mojo){
    const Nega= window["io/czlab/mcfud/negamax"]();
    const {Game:_G,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @class */
    class CZ extends Nega.GameBoard{
      constructor(p1v,p2v){
        super();
        this.actors= [0, p1v, p2v];
        this.grid=[];
        this.depth=5;
      }
      isNil(cellv){
        return cellv === 0 }
      getStateCopier(){
        return (s)=> JSON.parse(JSON.stringify(s))
      }
      syncState(seed, actor){
        this.actors[0] = actor;
        this.grid= JSON.parse(JSON.stringify(seed));
      }
      getNextMoves(snap){
        let out=[],
            moves = _G.calcNextMoves(snap.cur[1], snap.state)[1];
        _.doseq(moves, (v)=>{
          out.push(v);
        });
        return out;
      }
      doMove(snap, move){
        let [r,c, target] =move;
        let [row,col,act]=target;
        let S=snap.state;
        let cur=S[r][c];
        let des=S[row][col];
        switch(act){
          case "J":
            S[row>r? row-1 : row+1][col>c? col-1 : col+1]=null;
            S[row][col]=cur;
            S[r][c]=null;
            cur.row=row;
            cur.col=col;
            break;
          case "S":
            S[row][col]=cur;
            S[r][c]=null;
            cur.row=row;
            cur.col=col;
            break;
        }
      }
      takeGFrame(){
        let ff = new Nega.GFrame();
        ff.state=JSON.parse(JSON.stringify(this.grid));
        ff.other= this.getOtherPlayer(this.actors[0]);
        ff.cur= this.actors[0];
        ff.lastBestMove=null;
        return ff;
      }
      isOver(snap){
        let s= snap.state;
        let R=0;
        let B=0;
        for(let r,y=0; y< s.length; ++y){
          r=s[y];
          for(let x=0; x < r.length; ++x){
            if(r[x]){
              if(r[x].team===_G.TEAM_BLACK) ++B;
              if(r[x].team===_G.TEAM_RED) ++R;
            }
          }
        }

        return R===0 || B===0;
      }
      //if we lose, return a negative value
      evalScore(snap,move){
        return 100;
        let [r,c,target]=move;
        let [row,col,act]=target;
        let score=100;
        if(row===0 || row===(_G.ROWS-1)){
          //becomes king
          if(snap.cur===this.actors[1]){
            console.log("good to be king");
            score=0;
          }
        }
        return score;
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.AI=function(p1,p2){ return new CZ(p1,p2) };

  }

})(this);

//king cant jump back, handle draw and win

