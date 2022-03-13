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
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window["io.czlab.tetris.models"]=function(Mojo){

    const {Sprites:_S,
           Game:_G,
           ute:_, is}=Mojo;

    const D_GREEN= "#1B8463",
      L_GREEN= "#26AE88",
      D_RED= "#B02722",
      L_RED="#DC352E",
      D_YELLOW= "#C1971F",
      L_YELLOW= "#EBBA16",
      D_PURPLE= "#75348B",
      L_PURPLE= "#7F4491",
      D_BLUE= "#1F436D",
      L_BLUE= "#366BB3",
      D_ORANGE= "#D8681C",
      L_ORANGE= "#EC8918";

    const COLORS=[
      [L_GREEN, D_GREEN],
      [L_RED, D_RED],
      [L_YELLOW, D_YELLOW],
      [L_PURPLE, D_PURPLE],
      [L_BLUE, D_BLUE],
      [L_ORANGE, D_ORANGE]
    ].map(c=>{
      c[0]=_S.color(c[0]);
      c[1]=_S.color(c[1]);
      return c;
    });

    /**/
    const _sp=(c)=> _S.tint(_S.sprite("tile.png"),c);

    /** abstract base class */
    class BModel{
      //lines= [startline,endline,totallines]
      constructor(ln){ this._lines=ln }
      lines(){ return this._lines }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece = []
    class BoxModel extends BModel{
      constructor(){
        super([0,1,2]);
        /*
        [[1,1],
         [1,1]]
        */
      }
      clone(){
        let c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        return [[_sp(c[0]),_sp(c[1])],
                [_sp(c[1]),_sp(c[0])]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece = L
    class ElModel extends BModel{
      constructor(){
        super([0,1,2]);
        /*
        [[0,0,1],
         [1,1,1],
         [0,0,0]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,      n,      _sp(c[1])],
                [_sp(c[0]),_sp(c[1]),_sp(c[0])],
                [n,n,n]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece J
    class ElxModel extends BModel{
      constructor(){
        super([1,2,2]);
        /*
        [[0,0,0],
         [1,1,1],
         [0,0,1]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,n,n],
                [_sp(c[0]),_sp(c[1]),_sp(c[0])],
                [n,      n,      _sp(c[1])]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece I
    class LineModel extends BModel{
      constructor(){
        super([1,1,1]);
        /*
        [[0,0,0,0],
         [1,1,1,1],
         [0,0,0,0],
         [0,0,0,0]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,n,n,n],
                [_sp(c[0]),_sp(c[1]),_sp(c[0]),_sp(c[1])],
                [n,n,n,n],
                [n,n,n,n]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece T
    class NubModel extends BModel{
      constructor(){
        super([1,2,2]);
        /*
        [[0,0,0],
         [0,1,0],
         [1,1,1]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,n,n],
                [n,      _sp(c[0]),n],
                [_sp(c[0]),_sp(c[1]),_sp(c[0])]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece S
    class StModel extends BModel{
      constructor(){
        super([0,1,2]);
        /*
        [[0,1,1],
         [1,1,0],
         [0,0,0]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,      _sp(c[0]),_sp(c[1])],
                [_sp(c[0]),_sp(c[1]),n],
                [n,n,n]]
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //piece Z
    class StxModel extends BModel{
      constructor(){
        super([1,2,2]);
        /*
        [[0,0,0],
         [1,1,0],
         [0,1,1]]
        */
      }
      clone(){
        let n,c=_.randItem(COLORS);
        if(_.randSign()>0){_.swap(c,0,1)}
        n=null;
        return [[n,n,n],
                [_sp(c[0]),_sp(c[1]),n],
                [n,      _sp(c[0]),_sp(c[1])]]
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //list of models
    _G.ModelList=[new BoxModel(), new ElModel(), new ElxModel(),
                  new LineModel(), new NubModel(), new StModel(), new StxModel()]
  };

})(this);


