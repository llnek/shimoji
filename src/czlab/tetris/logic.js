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
  window["io.czlab.tetris.logic"]=function(Mojo){

    const int=Math.floor;
    const {Sprites:_S,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /** check if the piece at this position is ok */
    function _test(cells,row,col){
      let y=0;
      for(let px,py,r;y<cells.length;++y){
        r=cells[y];
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
      _G.cur.cells.forEach((r,y)=> r.forEach((c,x)=>{
        if(c)
          _V.set(c,_G.vbox.x1+(_G.cur.col+x)*_G.tileW,
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
        let r=_M.ndiv((y+ _G.tileH/2) - _G.vbox.y1,_G.tileH),
            c=_M.ndiv((x+ _G.tileW/2) - _G.vbox.x1,_G.tileW);
        r= _G.rows - 1 - r;//doing the flip here
        if(r >=0 && r < _G.rows) return [r,c]
      }
      let r,rc,p,y=0;
      for(; y< _G.cur.cells.length; ++y){
        r=_G.cur.cells[y];
        for(let x=0;x<r.length;++x){
          if(p=r[x]){
            rc=_xref(p.x,p.y);
            if(rc){
              _G.grid[rc[0]][rc[1]]=p;
            }else{
              y=911;
              break;
            }
          }
        }
      }
      return y<911 ? (_G.cur.cells.length=0, true) : false
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _checkGrid(){
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
            r.forEach(o=>_S.remove(o));
            _sink(y);
            return true;
          }
        }
      }
      let cnt=0;
      while(_check()){ ++cnt }
      if(cnt>4){
        _G.score += 800;
      }else if(cnt>0){
        _G.score += cnt*100;
      }
      if(cnt>0)
        Mojo.sound("line.mp3").play();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _moveDown(){
      let rc=_test(_G.cur.cells,_G.cur.row-1,_G.cur.col);
      if(rc){
        _G.cur.row -= 1;
        _draw();
      }else if(!_lockShape()){
        _G.gameOver=true
      }else{
        _checkGrid();
        _G.reifyNext();
        _G.slowDown();
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
        this.cur.cells.forEach(r=> r.forEach(c=> { if(c) c.visible=true }));
        this.cur.row= this.rows + this.cur.lines[2];
        this.cur.col= _M.ndiv(this.cols,2);
        _draw();
        return this.cur;
      },
      /** show what the next piece looks like */
      previewNext(){
        let m= _.randItem(this.ModelList),
            s= this.next = {lines: m.lines(), cells: m.clone(), row:0, col:0};
        s.cells.forEach(r=> r.forEach(c=>{
          if(c){
            _S.hide(c);
            this.gameScene.insert(_S.sizeXY(c,_G.tileW,_G.tileH)) }
        }));
        return (Mojo.emit(["preview.shape"], s), s)
      },
      /**Lateral movements */
      shiftHZ(dx){
        if(_test(this.cur.cells,this.cur.row, this.cur.col+dx)){
          this.cur.col += dx;
          _draw();
        }
      },
      clrTO(){
        if(this.timer !== UNDEF) clearTimeout(this.timer);
        this.timer=UNDEF;
      },
      slowDown(){
        this.clrTO();
        if(!this.gameOver && _moveDown())
          this.timer= _.delay(800,()=> this.slowDown());
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
        let ts=this.xposeCCW(this.cur.cells);
        if(_test(ts,this.cur.row,this.cur.col)){
          this.cur.cells=ts;
          _draw();
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
      //rotate the model counterclockwise, like flipping a matrix
      xposeCCW(block){
        let out= _.fill(block.length, ()=> []);
        for(let i=0;i<block.length;++i)
        for(let row=block[i],
                j=0; j<row.length; ++j){
          out[j][i]= row[row.length-1-j]
        }
        return out;
      }

    });

  };

})(this);


