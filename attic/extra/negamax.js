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
 * Copyright © 2020, Kenneth Leung. All rights reserved. */

(function(global, undefined) {
  "use strict";
  let MojoH5 = global.MojoH5;

  if(!MojoH5)
    throw "Fatal: MojoH5 not loaded";

  /**
   * @module
   */
  MojoH5.NegaMax = function(Mojo) {
    Mojo.NegaMax={};
    let _= Mojo.u,
        PINF = 1000000,
        Nega= Mojo.NegaMax;

    /**
     * @public
     * @function
     */
    Nega.FFrame = function(sz) {
      this.state= _.fill(new Array(sz*sz),0);
      this.lastBestMove=0;
      this.other=0;
      this.cur=0;
    };

    /**
     * @public
     * @function
     */
    Mojo.defType("GameBoard", {
      getNextMoves: (frame) => {},
      evalScore: (frame) => {},
      isStalemate: (frame) => {},
      isOver: (f) => {},
      undoMove: (frame, move) => {},
      makeMove: (f, move) => {},
      switchPlayer: (frame) => {},
      takeFFrame: () => {}
    }, Nega);

    /**Nega Min-Max algo.
     * @public
     * @function
     */
    let negaMax = (board, game, maxDepth, depth, alpha, beta) => {
      if(depth === 0 ||
         board.isOver(game)) return board.evalScore(game);

      let openMoves = board.getNextMoves(game),
          bestValue = -PINF,
          bestMove = openMoves[0];

      if(depth === maxDepth)
        game.lastBestMove = openMoves[0];

      for(let rc, move, i=0; i<openMoves.length; ++i) {
        move = openMoves[i];
        //try a move
        board.makeMove(game, move);
        board.switchPlayer(game);
        rc= -negaMax(board, game, maxDepth, depth-1, -beta, -alpha);
        //now, roll it back
        board.switchPlayer(game);
        board.undoMove(game, move);
        //how did we do ?
        bestValue = _.max(bestValue, rc);
        if(alpha < rc) {
          alpha = rc;
          bestMove = move;
          if(depth === maxDepth)
            game.lastBestMove = move;
          if(alpha >= beta) break;
        }
      }
      return bestValue;
    };

    // Main method for nega-max algo
    Nega.evalNegaMax = (board) => {
      let f= board.takeFFrame();
      negaMax(board, f, 10, 10, -PINF, PINF);
      return f.lastBestMove;
    };

    return Mojo;
  };

})(this);

