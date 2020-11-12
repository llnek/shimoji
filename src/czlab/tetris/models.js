;(function(window){
  "use strict";
  window["io.czlab.tetris.models"]=function(Mojo){
    let _G=Mojo.Game;
    let _=Mojo.u;

    class BModel{
      constructor(m){ this.model=m; }
      dim(){return this.model.length }
      clone(){
        let out=[];
        for(let i=0;i<this.model.length;++i){
          out.push(this.model[i].slice())
        }
        return out;
      }
      rand(){
        let n=_.randInt(4);
        let b=this.model;
        if(n===0){
          b=this.clone(b);
        }else{
          for(let i=0;i<n;++i)
          b=_G.transposeCCW(b)
        }
        return b
      }
    }
    // piece = []
    class BoxModel extends BModel{
      constructor(){
        super([[1,1],
               [1,1]]);
      }
    }
    // piece = L
    class ElModel extends BModel{
      constructor(){
        super([[0,1,0],
               [0,1,0],
               [0,1,1]]);
      }
    }
    // piece J
    class ElxModel extends BModel{
      constructor(){
        super([[0,1,0],
               [0,1,0],
               [1,1,0]]);
      }
    }
    // piece I
    class LineModel extends BModel{
      constructor(){
        super([[0,0,0,0],
               [1,1,1,1],
               [0,0,0,0],
               [0,0,0,0]]);
      }
    }
    // piece T
    class NubModel extends BModel{
      constructor(){
        super([[0,0,0],
               [0,1,0],
               [1,1,1]]);
      }
    }
    // piece S
    class StModel extends BModel{
      constructor(){
        super([[0,1,0],
               [0,1,1],
               [0,0,1]]);
      }
    }
    // piece Z
    class StxModel extends BModel{
      constructor(){
        super([[0,1,0],
               [1,1,0],
               [1,0,0]]);
      }
    }

    _G.ModelList=[new BoxModel(), new ElModel(), new ElxModel(),
                  new LineModel(), new NubModel(), new StModel(), new StxModel()];

    _G.transposeCCW=function(block){
      let out=[];
      for(let i=0;i<block.length;++i) out.push([]);
      for(let row,i=0;i<block.length;++i){
        row=block[i];
        for(let j=0;j<row.length;++j){
          out[j][i]= row[row.length-1-j]
        }
      }
      return out;
    }

  };

})(this);


