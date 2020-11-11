;(function(window){
  "use strict";
  window["io.czlab.tetris.logic"]=function(Mojo){
    let _S=Mojo.Sprites;
    let _G=Mojo.Game;
    let _=Mojo.u;

    function _xrefTile(x, y){
      let tile = _G.tileW;
      let t2 = tile/2;
      return [_.floor(((y+t2) - _G.vbox.y1)/tile),
              _.floor(((x+t2) - _G.vbox.x1)/tile)]
    }
    function _maybeCollide(tl_x, tl_y){
      let [row,col]= _xrefTile(tl_x , tl_y);
      return !(row >= 0 && row < _G.grid.length &&
               col >= 0 && col < _G.grid[0].length && !_G.grid[row][col])
    }
    function _findBBox(model, px, py, rID, skipCollide){
      let dim= model.dim();
      let tile = _G.tileW;
      let bs=[];
      for(let x,y,r=0; r<dim; ++r){
        y = py + r * tile;
        for(let c=0; c<dim; ++c){
          x = px + c * tile;
          if(model.test(rID,r,c)){
            if(!skipCollide && _maybeCollide(x, y)){
              return null;
            }
            bs.push([x,y]);
          }
        }
      }
      console.log(`Found valid bboxes = ${bs.length}`);
      return bs;
    };
    _G.reifyBricks=function(points,png,info){
      let s= _G.Shape(info);
      points.forEach(p=>{
        let b=_S.sprite(png);
        b.x=p[0];
        b.y=p[1];
        b.scale.x=_G.scaleX;
        b.scale.y=_G.scaleY;
        b.mojoh5.startPos=p;
        s.cells.push(b);
      });
      return s;
    };
    function _mkShape(info, x, y, bbox){
      let s;
      if(bbox && bbox.length>0){
        s= _G.reifyBricks(bbox, info.png, info);
      }
      return s;
    }

    _G.reifyNextShape=function(scene){
      let x= _G.vbox.x1 + 5 * _G.tileW;
      let y= _G.vbox.y1 + 5 * _G.tileH;
      let i=_G.nextShapeInfo;
      let s= _mkShape(i, x,y, _findBBox(i.model, x, y, i.rot));
      if(!s){
        console.log("game over.  you lose.");
      }else{
        s.cells.forEach(c => scene.insert(c));
      }
      return s;
    };

    _G.previewNext=function(){
      let info = _randNextInfo();
      _G.nextShapeInfo= info;
    };

    _G.shiftRight=function(shape){
      let new_x= shape->x + tile;
      auto y= shape->y;
      auto rc=false;
      auto bs= findBBox(grid,emap, shape->info.model, new_x, y, shape->info.rot);

      if (bs.size() > 0) {
        clearOldBricks(shape->bricks);
        shape->x= new_x;
        reifyBricks(bs, shape->info.png, shape->bricks);
        rc= true;
      }

      return rc;
    };

    function _previewShape(info, x, y){
      //return _mkShape(info, x, y, _findBBox(info.model, x, y, info.rot, true))
    }

    function _randNextInfo(){
      return _G.ShapeInfo(_G.ModelList[_.randInt(_G.ModelList.length)])
    }

  };

})(this);


