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

  /**/
  window["io.czlab.tetris.logic"]=function(Mojo){

    const int=Math.floor;
    const {Sprites:_S,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    const D_GREEN= "#1B8463";
    const L_GREEN= "#26AE88";
    const D_RED= "#B02722";
    const L_RED="#DC352E";
    const D_YELLOW= "#C1971F";
    const L_YELLOW= "#EBBA16";
    const D_PURPLE= "#75348B";
    const L_PURPLE= "#7F4491";
    const D_BLUE= "#1F436D";
    const L_BLUE= "#366BB3";
    const D_ORANGE= "#D8681C";
    const L_ORANGE= "#EC8918";

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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** check if the shape at this position is ok */
    function _test(tiles,row,col){
      let y=0;
      for(let px,py,r;y<tiles.length;++y){
        r=tiles[y];
        py=row-y;
        for(let x=0;x<r.length;++x){
          //check non-empty cells only
          if(r[x]){
            px=col+x;
            if(py<0 || px<0 ||
              px>=_G.cols || _G.grid[py][px]){
              y=911;
              break;
            }
          }
        }
      }
      return y < 911
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _draw(){
      let k=0;
      _G.cur.tiles.forEach((r,y)=> r.forEach((c,x)=>{
        if(c)
          _V.set(_G.cur.cells[k++],_G.vbox.x1+(_G.cur.col+x)*_G.tileW,
                                   _G.vbox.y2-((_G.cur.row-y)+1)*_G.tileH)
      }));
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _lockShape(){
      //sprite position -> tile coordinate
      //since logically row0 is at the bottom
      //but the actual array has row0 at top
      //we need to flip the row value
      function _xref(x,y){
        let r=int(((y+ _G.tileH/2) - _G.vbox.y1)/_G.tileH),
            c=int(((x+ _G.tileW/2) - _G.vbox.x1)/_G.tileW);
        r= _G.rows - 1 - r;//doing the flip here
        if(r >=0 && r < _G.rows) return [r,c]
      }
      let i=0;
      for(let rc,p; i< _G.cur.cells.length; ++i){
        p=_G.cur.cells[i];
        rc=_xref(p.x,p.y);
        if(!rc){
          i=911;
        }else{
          _G.grid[rc[0]][rc[1]]=p;
        }
      }
      return i<911 ? (_G.cur.cells.length=0, true) : false
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _checkGrid(){
      function _clear(row){
        for(let i=0;i<row.length;++i) row[i]=_S.remove(row[i]) }
      function _sink(line){
        for(let s,y=line+1;y<=_G.rows;++y)
        for(let x=0;x<_G.cols;++x){
          s=_G.grid[y][x];
          _G.grid[y-1][x]=s;
          if(s) s.y += _G.tileH;
        }
      }
      function _check(){
        for(let r,y=0;y<_G.rows;++y){
          r=_G.grid[y];
          if(r.every(c => !!c)){
            _clear(r); _sink(y); return true; } } }
      let cnt=0;
      while(_check()){ ++cnt }
      if(cnt>4){
        _G.score += 800;
      }else if (cnt>0) {
        _G.score += cnt*100;
      }
      if(cnt>0)
        Mojo.sound("line.mp3").play();
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _moveDown(){
      let rc;
      if(rc=_test(_G.cur.tiles,_G.cur.row-1,_G.cur.col)){
        _G.cur.row -= 1;
        _draw();
      }else{
        if(!_lockShape()){
          _G.gameOver=true
        }else{
          _checkGrid();
          _G.reifyNext();
          _G.slowDown();
        }
      }
      return rc;
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      /** create the next piece */
      reifyNext(){
        this.cur=this.next;
        this.previewNext();
        //we hide the new piece above the top row
        //add the thickness of the piece
        this.cur.cells.forEach(c=> c.visible=true);
        this.cur.row= this.rows + this.cur.lines[2];
        this.cur.col= int(this.cols/2);
        _draw();
        return this.cur;
      },
      /** show what the next piece looks like */
      previewNext(){
        let ln= this.ModelList.length,
            n= _.randInt(ln),
            m= this.ModelList[n],
            png= _.randItem(COLORS);
        let s= this.next = {tiles: m.clone(),
                            lines: m.lines(), cells: [], row:0, col:0};
        for(let p,i=0;i< this.CELLS;++i){
          s.cells.push(p= _S.sprite("tile.png"));
          _S.tint(p,png[i%2]);
          p.visible=false;
          this.gameScene.insert(_S.sizeXY(p,_G.tileW,_G.tileH));
        }
        Mojo.emit(["preview.shape"], s);
        return s;
      },
      /**Lateral movements */
      shiftHZ(dx){
        if(_test(this.cur.tiles,this.cur.row, this.cur.col+dx)){
          this.cur.col += dx;
          _draw();
        }
      },
      clrTO(){
        if(this.timer !== undefined) clearTimeout(this.timer);
        this.timer=undefined;
      },
      slowDown(){
        this.clrTO();
        if(!this.gameOver && _moveDown())
          this.timer= _.delay(80+700,()=> this.slowDown());
      },
      dropDown(){
        this.clrTO();
        if(!this.gameOver && _moveDown())
          this.timer= _.delay(30,()=> this.dropDown());
      },
      shiftDown(){
        if(!this.gameOver) this.slowDown() },
      rotateCCW(){
        //no need to rotate a square
        if(this.cur.tiles.length>2){
          let ts=this.transposeCCW(this.cur.tiles);
          if(_test(ts,this.cur.row,this.cur.col)){
            this.cur.tiles=ts;
            _draw();
          }
        }
        //if we pick a cell as rotation pivot, then we can
        //simply do this for rotation
        /*
        let p=cells[1];
        for(let x,y,i=0;i<4;++i){
          x = cells[i].y-p.y;
          y = cells[i].x-p.x;
          cells[i].x = p.x - x;
          cells[i].y = p.y + y;
        }
        */
      },
      //rotate the model counterclockwise,
      //like flipping a matrix
      transposeCCW(block){
        let out=[];
        for(let i=0;i<block.length;++i)
          out.push([]);
        for(let row,i=0;i<block.length;++i){
          row=block[i];
          for(let j=0;j<row.length;++j){
            out[j][i]= row[row.length-1-j]
          }
        }
        return out;
      }

    });

  };

})(this);


