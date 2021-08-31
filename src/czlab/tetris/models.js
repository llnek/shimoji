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

  window["io.czlab.tetris.models"]=function(Mojo){

    const {Game:_G,
           ute:_, is}=Mojo;

    /** abstract base class */
    class BModel{
      constructor(m){
        this.model=m
      }
      rand(){
        let n=_.randInt(_G.CELLS);
        let b=this.model;
        if(n===0){
          b=this.clone(b);
        }else{
          for(let i=0;i<n;++i)
            b=_G.transposeCCW(b)
        }
        return b
      }
      dim(){
        return this.model.length }
      clone(){
        return _.deepCopyArray(this.model) } }

    // piece = []
    class BoxModel extends BModel{
      constructor(){
        super([[1,1],
               [1,1]]) }
      lines(){
        return [0,1,2] }
    }
    // piece = L
    class ElModel extends BModel{
      constructor(){
        super([[0,0,1],
               [1,1,1],
               [0,0,0]]) }
      lines(){
        return [0,1,2] }
    }
    // piece J
    class ElxModel extends BModel{
      constructor(){
        super([[0,0,0],
               [1,1,1],
               [0,0,1]]) }
      lines(){
        return [1,2,2] }
    }
    // piece I
    class LineModel extends BModel{
      constructor(){
        super([[0,0,0,0],
               [1,1,1,1],
               [0,0,0,0],
               [0,0,0,0]]) }
      lines(){
        return [1,1,1] }
    }
    // piece T
    class NubModel extends BModel{
      constructor(){
        super([[0,0,0],
               [0,1,0],
               [1,1,1]]) }
      lines(){
        return [1,2,2] }
    }
    // piece S
    class StModel extends BModel{
      constructor(){
        super([[0,1,1],
               [1,1,0],
               [0,0,0]]) }
      lines(){
        return [0,1,2] }
    }
    // piece Z
    class StxModel extends BModel{
      constructor(){
        super([[0,0,0],
               [1,1,0],
               [0,1,1]]) }
      lines(){
        return [1,2,2] }
    }

    //list of models
    _G.ModelList=[new BoxModel(), new ElModel(), new ElxModel(),
                  new LineModel(), new NubModel(), new StModel(), new StxModel()];


  };

})(this);


