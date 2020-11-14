;(function(window){
  "use strict";
  window["io.czlab.tetris.logic"]=function(Mojo){
    let _S=Mojo.Sprites;
    let _G=Mojo.Game;
    let _=Mojo.u;

    _G.xrefTile=function(x, y){
      let tile = _G.tileW;
      let t2 = tile/2;
      let r=_.floor(((y+t2) - _G.vbox.y1)/tile);
      let c=_.floor(((x+t2) - _G.vbox.x1)/tile);
      r= _G.rows - 1- r;
      _.assert(r >=0 && r < _G.rows);
      return [r,c];
    };

    function _testTiles(tiles,row,col){
      for(let px,py,r,y=0;y<tiles.length;++y){
        r=tiles[y];
        for(let x=0;x<r.length;++x){
          if(r[x]===1){
            py=row-y;
            px=col+x;
            if(py<0 || px<0 || _G.grid[py][px]){
              return false;
            }
            if(py<0 || px>=_G.cols || px<0) return false;
          }
        }
      }
      return true;
    }

    _G.drawShape=function(scene,s){
      for(let k=0,r,y=0;y<s.tiles.length;++y){
        r=s.tiles[y];
        for(let p,x=0;x<r.length;++x){
          if(r[x]===1){
            s.cells[k].y=_G.vbox.y2-((s.row-y)+1)*_G.tileH;
            s.cells[k].x=_G.vbox.x1+(s.col+x)*_G.tileW;
            ++k;
          }
        }
      }
    };

    _G.reifyNextShape=function(scene){
      let s=_G.nextShape;
      _G.nextShape=null;
      _G.curShape=s;
      if(s){
        _G.previewNext(scene);
        s.row=_G.rows+s.tiles.length-1;
        s.col=_G.cols/2;
        s.cells.forEach(c=>c.visible=true);
        _G.drawShape(scene,s);
      }
      return s;
    };

    _G.previewNext=function(scene){
      //console.log("previewNext called");
      let ln= _G.ModelList.length;
      let n= _.randInt(ln);
      let m= _G.ModelList[n];
      let png= `${_.randInt(ln)}.png`;
      let s= {tiles: m.rand(),
              cells: [],
              row: 0, col: 0};
      for(let p,i=0;i<4;++i){
        p= _S.sprite(png);
        p.scale.x=_G.scaleX;
        p.scale.y=_G.scaleY;
        p.visible=false;
        scene.insert(p);
        s.cells.push(p);
      }
      return (_G.nextShape=s);
    };

    _G.shiftRight=function(scene,s){
      if(!_testTiles(s.tiles,s.row,s.col+1)){ return false; }
      ++s.col;
      _G.drawShape(scene,s);
      return true;
    };

    _G.shiftLeft=function(scene,s){
      if(!_testTiles(s.tiles,s.row,s.col-1)){ return false; }
      --s.col;
      _G.drawShape(scene,s);
      return true;
    };

    _G.lockShape=function(scene,s){
      s.cells.forEach(p=>{
        let [r,c]=_G.xrefTile(p.x,p.y);
        _G.grid[r][c]=p;
      });
      s.cells.length=0;
    };

    _G.checkLines=function(scene){
      for(let r,y=_G.rows-1;y>=0;--y){
        r=_G.grid[y];
        if(r.every(c => !!c)){
          for(let x=0;x<r.length;++x){
            _S.remove(r[x]);
            r[x]=null;
          }
        }
      }
    };

    _G.sinkLine=function(line){
    }

    _G.moveDown=function(scene,s){
      if(!_testTiles(s.tiles,s.row-1,s.col)){
        _G.lockShape(scene,s);
        _G.checkLines(scene);
        _G.slowDown(scene,_G.reifyNextShape(scene));
        return false;
      }
      --s.row;
      _G.drawShape(scene,s);
      return true;
    };

    _G.slowDown=function(scene,s){
      if(_G.moveDown(scene,s)){
        _G.timer= _.delay(80+700/1,()=>{ _G.slowDown(scene,s) });
      }
    };

    _G.dropDown=function(scene,s){
      if(_G.timer !== undefined) clearTimeout(_G.timer);
      _G.timer=undefined;
      if(_G.moveDown(scene,s)){
        _G.timer= _.delay(30,()=>{ _G.dropDown(scene,s) });
      }
    };

    _G.rotateCCW=function(scene,s){
      if(s.tiles.length>2){
        let ts=_G.transposeCCW(s.tiles);
        if(!_testTiles(ts,s.row,s.col)){ return; }
        s.tiles=ts;
        _G.drawShape(scene,s);
      }
    };


  };

})(this);


