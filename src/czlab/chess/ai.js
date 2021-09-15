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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window["io/czlab/chess/AI"]=function(Mojo){
    const Mini= window["io/czlab/mcfud/minimax"]();
    const {Game:_G,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** @class */
    class CZ extends Mini.GameBoard{
      constructor(p1v,p2v){
        super();
        this.actors= [0, p1v, p2v];
        this.grid=null;
        this.depth=4;
      }
      syncState(seed, actor){
        this.actors[0] = actor;
        this.grid= seed;
      }
      getNextMoves(snap){
        let moves= snap.state.moves({verbose:true});
        //console.log("ai-moves ====== ");
        //console.log( JSON.stringify(moves));
        return moves;
      }
      undoMove(snap,move){
        snap.state.undo();
      }
      doMove(snap, move){
        let r= snap.state.move(move);
        console.log(snap.state.ascii());
        return r;
      }
      takeGFrame(){
        let ff = new Mini.GFrame();
        ff.state=this.grid;
        ff.other= this.getOtherPlayer(this.actors[0]);
        ff.cur= this.actors[0];
        ff.lastBestMove=null;
        return ff;
      }
      isStalemate(snap){
      }
      isOver(snap,move){
      }
      evalScore(snap,move){
        return 0;
        //if we lose, return a negative value
      }
    }

    _G.AI=function(p1,p2){ return new CZ(p1,p2) };

  }

})(this);


