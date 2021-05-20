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

  window["io/czlab/conn4/AI"]=function(Mojo){
    const Nega= window["io/czlab/mcfud/negamax"]();
    const {Game:_G,
           ute:_,is}=Mojo;


    /** @class */
    class C extends Nega.GameBoard{
      constructor(p1v,p2v){
        super();
        this.actors= [0, p1v, p2v];
        this.grid=[];
        this.depth=5;
      }
      isNil(cellv){
        return cellv === 0 }
      getFirstMove(){
        let y= this.grid.length-1;
        let r=this.grid[y];
        let out;
        if(_.every(r,0))
          out= [y, _.randInt2(0,r.length-1)];
        return out;
      }
      syncState(seed, actor){
        this.actors[0] = actor;
        this.grid= _.deepCopyArray(seed);
      }
      getNextMoves(snap){
        let width=snap.state[0].length;
        let out=[];
        for(let y,x=0;x<width;++x){
          y=_G.maxY(snap.state,x);
          if(y>=0)
            out.push([y,x])
        }
        return out;
      }
      undoMove(snap, move){
        snap.state[move[0]][move[1]]=0 }
      makeMove(snap, move){
        if(snap.state[move[0]][move[1]]===0)
          snap.state[move[0]][move[1]] = snap.cur;
        else
          throw `Error: cell [${move[0]},${move[1]}] is not free` }
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
        return _G.checkDraw(snap.state)}
      isOver(snap,move){
        return _G.check4(snap.state,
                         move[0],
                         move[1],snap.other) || this.isStalemate(snap) }
      evalScore(snap,move){
        //if we lose, return a negative value
        return _G.check4(snap.state, move[0], move[1],snap.other)?-100:0 }
    }

    _G.AI=function(){ return new C(_G.X,_G.O) };

  }

})(this);


