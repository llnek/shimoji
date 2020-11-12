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
      return [r,c];
    };

    function _testTiles(tiles,row,col){
      let C=_G.grid[0].length;
      let R=_G.grid.length;
      for(let r,y=0;y<tiles.length;++y){
        r=tiles[y];
        for(let x=0;x<r.length;++x){
          if(r[x]===1){
            if(row+y>=R || col+x>=C ||
               row+y<0 || col+x<0 || _G.grid[row+y][col+x]) return false
          }
        }
      }
      return true;
    }

    _G.drawShape=function(scene,s){
      if(s.cells.length===0){
        for(let p,i=0;i<4;++i){
          p=_S.sprite(s.png);
          p.scale.x=_G.scaleX;
          p.scale.y=_G.scaleY;
          s.cells.push(p);
          scene.insert(p);
        }
      }
      let k=0;
      for(let r,y=0;y<s.tiles.length;++y){
        r=s.tiles[y];
        for(let p,x=0;x<r.length;++x){
          if(r[x]===1){
            s.cells[k].y=_G.vbox.y1+(s.row+y)*_G.tileH;
            s.cells[k].x=_G.vbox.x1+(s.col+x)*_G.tileW;
            ++k;
          }
        }
      }
    };

    _G.reifyNextShape=function(scene){
      let x= _G.vbox.x1 + 5 * _G.tileW;
      let y= _G.vbox.y1; //+ 5 * _G.tileH;
      let [row,col]= this.xrefTile(x,y);
      console.log("ROW="+row);
      let s=_G.nextShape;
      if(!_testTiles(s.tiles, row,col)){
        console.log("game over.  you lose.");
      }else{
        s.row=row;
        s.col=col;
        _G.drawShape(scene,s);
      }
      _G.nextShape=null;
      return (_G.curShape=s);
    };

    _G.previewNext=function(){
      let ln= _G.ModelList.length;
      let n= _.randInt(ln);
      let m= _G.ModelList[n];
      let s= {tiles: m.rand(),
              cells: [],
              row: 0, col: 0,
              png: `${_.randInt(ln)}.png`};
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

    _G.moveDown=function(scene,s){
      if(!_testTiles(s.tiles,s.row+1,s.col)){ return false; }
      ++s.row;
      _G.drawShape(scene,s);
      return true;
    };

    _G.dropDown=function(scene,s){
      if(true){
        if(_G.moveDown(scene,s)){
          _.delay(30,()=>{ _G.dropDown(scene,s) });
        }
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


