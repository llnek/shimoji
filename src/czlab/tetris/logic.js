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

  window["io.czlab.tetris.logic"]=function(Mojo){

    const MFL=Math.floor;
    const {Sprites:_S,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    /** sprite position -> tile coordinate */
    _G.xrefTile=function(x, y){
      let tile = _G.tileW;
      let t2 = tile/2;
      let r=MFL(((y+t2) - _G.vbox.y1)/tile);
      let c=MFL(((x+t2) - _G.vbox.x1)/tile);
      r= _G.rows - 1- r;
      //is it valid?
      if(r >=0 && r < _G.rows) return [r,c] };

    /** check if the shape at this position is ok */
    function _testTiles(tiles,row,col){
      for(let px,py,r,y=0;y<tiles.length;++y){
        r=tiles[y];
        for(let x=0;x<r.length;++x){
          if(r[x]===1){
            py=row-y;
            px=col+x;
            if(py<0 || px<0 ||
               px>=_G.cols ||
               _G.grid[py][px]) return false } } }
      return true;
    }

    /** @ignore */
    _G.drawShape=function(scene,s){
      for(let k=0,r,y=0;y<s.tiles.length;++y){
        r=s.tiles[y];
        for(let x=0;x<r.length;++x){
          if(r[x]===1){
            _V.set(s.cells[k++],_G.vbox.x1+(s.col+x)*_G.tileW,
                                _G.vbox.y2-((s.row-y)+1)*_G.tileH) } } } };

    /** create the next shape */
    _G.reifyNextShape=function(scene){
      let s=_G.nextShape;
      _G.nextShape=null;
      if(_G.curShape=s){
        _G.previewNext(scene);
        s.row=_G.rows+s.lines[2];
        s.col=MFL(_G.cols/2);
        s.cells.forEach(c=>{
          c.visible=true;
        });
        _G.drawShape(scene,s);
      }
      return s;
    };

    /** show what the next shape looks like */
    _G.previewNext=function(scene){
      let ln= _G.ModelList.length;
      let n= _.randInt(ln);
      let m= _G.ModelList[n];
      let png= `${_.randInt(ln)}.png`;
      let s={tiles: m.clone(),
             lines: m.lines(),
             cells: [], row:0, col:0};
      _G.nextShape=s;
      for(let p,i=0;i<_G.CELLS;++i){
        p= _S.sprite(png);
        p.visible=false;
        scene.insert(p);
        s.cells.push(p);
        _S.sizeXY(p,_G.tileW,_G.tileH);
      }
      Mojo.emit(["preview.shape"],s);
    };

    /** @ignore */
    _G.shiftRight=function(scene,s){
      if(!_testTiles(s.tiles,s.row,s.col+1)){
        s=null;
      }else{
        ++s.col;
        _G.drawShape(scene,s);
      }
      return !!s;
    };

    /** @ignore */
    _G.shiftLeft=function(scene,s){
      if(!_testTiles(s.tiles,s.row,s.col-1)){
        s=null;
      }else{
        --s.col;
        _G.drawShape(scene,s);
      }
      return !!s;
    };

    /** @ignore */
    _G.lockShape=(s)=>{
      for(let rc,p,i=0;
          i<s.cells.length;++i){
        p=s.cells[i];
        rc=_G.xrefTile(p.x,p.y);
        if(!rc)
          return false;
        _G.grid[rc[0]][rc[1]]=p;
      }
      return (s.cells.length=0, true) };


    /** @ignore */
    _G.checkGrid=()=>{
      let cnt=0;
      while(_G.checkLines()){
        ++cnt;
      }
      if(cnt>4){
        _G.score += 800;
      }else{
        _G.score += cnt*100;
      }
    };

    /** @ignore */
    _G.checkLines=(out)=>{
      for(let r,y=0;y<_G.rows;++y){
        r=_G.grid[y];
        if(r.every(c => !!c)){
          _G.clearLine(y);
          _G.sink(y);
          return true;
        }
      }
      return false;
    };

    /** @ignore */
    _G.sink=function(line){
      for(let s,y=line+1;y<=_G.rows;++y){
        for(let x=0;x<_G.cols;++x){
          s=_G.grid[y][x];
          _G.grid[y-1][x]=s;
          if(s)
            s.y += _G.tileH;
        }
      }
    };

    /** get rid of a full line */
    _G.clearLine=function(line){
      let row=_G.grid[line];
      for(let i=0;i<row.length;++i){
        _.assert(row[i],"cell expected to be non-null");
        _S.remove(row[i]);
        row[i]=null;
      }
    };

    /** @ignore */
    _G.shiftDown=(scene,s)=>{
      if(!_G.gameOver){
        _G.slowDown(scene,s);
      }
    };

    /** @ignore */
    _G.moveDown=(scene,s)=>{
      if(!_testTiles(s.tiles,s.row-1,s.col)){
        if(!_G.lockShape(s)){
          _G.gameOver=true
        }else{
          _G.checkGrid();
          _G.slowDown(scene,_G.reifyNextShape(scene)) }
        return false;
      }
      --s.row;
      _G.drawShape(scene,s);
      return true
    };

    /** @ignore */
    _G.slowDown=function(scene,s){
      if(_G.timer !== undefined) clearTimeout(_G.timer);
      _G.timer=undefined;
      if(_G.moveDown(scene,s)){
        _G.timer= _.delay(80+700,()=>{ _G.slowDown(scene,s) });
      }
    };

    /** @ignore */
    _G.dropDown=function(scene,s){
      if(_G.timer !== undefined) clearTimeout(_G.timer);
      _G.timer=undefined;
      if(!_G.gameOver &&
         _G.moveDown(scene,s)){
        _G.timer= _.delay(30,()=>{ _G.dropDown(scene,s) });
      }
    };

    /** @ignore */
    _G.rotateCCW=function(scene,s){
      if(s.tiles.length>2){
        let ts=_G.transposeCCW(s.tiles);
        if(_testTiles(ts,s.row,s.col)){
          s.tiles=ts;
          _G.drawShape(scene,s);
        }
      }
    };

  };

})(this);


