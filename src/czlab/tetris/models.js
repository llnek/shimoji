;(function(window){
  "use strict";
  window["io.czlab.tetris.models"]=function(Mojo){
    let _G=Mojo.Game;
    let _=Mojo.u;

    class BModel{
      constructor(a,d){
        this._dim=d;
        this._layout=a;
        this._size=a.length/(d*d);
      }
      dim(){return this._dim }
      size(){ return this._size }
      sq(){ return this._dim*this._dim }
      test(rID, row, col){
        return this._layout[rID * this.sq() + row * this._dim + col] === 1
      }
    }
    class BoxModel extends BModel{
      constructor(){
        super([1,1,
               1,1,

               1,1,
               1,1,

               1,1,
               1,1,

               1,1,
               1,1],2);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece = L
    class ElModel extends BModel{
      constructor(){
        super([0,1,0,
               0,1,0,
               0,1,1,

               0,0,1,
               1,1,1,
               0,0,0,

               1,1,0,
               0,1,0,
               0,1,0,

               0,0,0,
               1,1,1,
               1,0,0],3);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece J
    class ElxModel extends BModel{
      constructor(){
        super([0,1,0,
               0,1,0,
               1,1,0,

               0,0,0,
               1,1,1,
               0,0,1,

               0,1,1,
               0,1,0,
               0,1,0,

               1,0,0,
               1,1,1,
               0,0,0],3);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece I
    class LineModel extends BModel{
      constructor(){
        super([0,0,0,0,
               1,1,1,1,
               0,0,0,0,
               0,0,0,0,

               0,1,0,0,
               0,1,0,0,
               0,1,0,0,
               0,1,0,0,

               0,0,0,0,
               0,0,0,0,
               1,1,1,1,
               0,0,0,0,

               0,0,1,0,
               0,0,1,0,
               0,0,1,0,
               0,0,1,0],4);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece T
    class NubModel extends BModel{
      constructor(){
        super([0,0,0,
               0,1,0,
               1,1,1,

               0,0,1,
               0,1,1,
               0,0,1,

               1,1,1,
               0,1,0,
               0,0,0,

               1,0,0,
               1,1,0,
               1,0,0],3);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece S
    class StModel extends BModel{
      constructor(){
        super([0,1,0,
               0,1,1,
               0,0,1,

               0,1,1,
               1,1,0,
               0,0,0,

               1,0,0,
               1,1,0,
               0,1,0,

               0,0,0,
               0,1,1,
               1,1,0],3);
      }
    }
    //////////////////////////////////////////////////////////////////////////
    // piece Z
    class StxModel extends BModel{
      constructor(){
        super([0,1,0,
               1,1,0,
               1,0,0,

               0,0,0,
               1,1,0,
               0,1,1,

               0,0,1,
               0,1,1,
               0,1,0,

               1,1,0,
               0,1,1,
               0,0,0],3);
      }
    }

    _G.Shape=function(info){
      return {info: info, cells: []}
    };

    _G.ModelList=[new BoxModel(), new ElModel(), new ElxModel(),
                  new LineModel(), new NubModel(), new StModel(), new StxModel()];

    _G.ShapeInfo=function(m){
      return {model:m,
              rot: _.randInt(m.size()),
              png: `${_.randInt(7)}.png`}
    };


  };

})(this);


