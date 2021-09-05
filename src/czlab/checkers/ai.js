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
        return (state)=>{ return _.deepCopyArray(state) }
      }
      //getFirstMove(){ }
      syncState(seed, actor){
        this.actors[0] = actor;
        this.grid= _.deepCopyArray(seed);
      }
      getNextMoves(snap){

      }
      makeMove(snap, move){

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
        ff.state=_.deepCopyArray(this.grid);
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

        //if we lose, return a negative value
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.AI=function(){ return new CZ(_G.X,_G.O) };

  }

})(this);


