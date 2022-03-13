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
  window["io/czlab/tictactoe/Sprites"]= function(Mojo){
    const int=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function triple(grid,v3,other){
      let cnt=0,empty=null;
      v3.forEach(i=>{
        if(grid[i]==other){
          ++cnt
        }else if(grid[i]==0){
          empty=i
        }
      });
      if(cnt==2 && empty !== null){
        //need to block
        return [empty]
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function aiEasy(grid,ai,other){
      let pos,tmp=[];
      grid.forEach((v,i)=>{
        if(v==0) tmp.push(i)
      });
      return tmp.length>0? _.randItem(tmp) : -1;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function aiNormal(grid,ai,other){
      let pos=-1, cs=_.shuffle([0,2,4,6,8]);
      for(let i=0;i<cs.length;++i){
        if(grid[cs[i]]==0){
          pos=cs[i];
          break;
        }
      }
      return pos<0 ? aiEasy(grid,ai,other) : pos;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function bruteAI(level,grid,ai,other){
      let win= triple(grid,[0,1,2],ai) ||
               triple(grid,[3,4,5],ai) ||
               triple(grid,[6,7,8],ai) ||
               triple(grid,[0,3,6],ai) ||
               triple(grid,[1,4,7],ai) ||
               triple(grid,[2,5,8],ai) ||
               triple(grid,[0,4,8],ai) || triple(grid,[2,4,6],ai);
      if(win)
        return win[0];

      let blocked= triple(grid,[0,1,2],other) ||
                   triple(grid,[3,4,5],other) ||
                   triple(grid,[6,7,8],other) ||
                   triple(grid,[0,3,6],other) ||
                   triple(grid,[1,4,7],other) ||
                   triple(grid,[2,5,8],other) ||
                   triple(grid,[0,4,8],other) || triple(grid,[2,4,6],other);
      if(blocked)
        return blocked[0];

      return level=="#easy" ? aiEasy(grid,ai,other) : aiNormal(grid,ai,other);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.AI=function(v){
      const o={ pnum:v, board: _G.TTToe(_G.X, _G.O) };
      const signal=[["ai.move",o], "aiMove",o];
      o.dispose=()=> Mojo.off(...signal);
      o.aiMove=()=> _.delay(500,()=> o.makeMove());
      o.makeMove=function(){
        //Mojo.CON.log("level===="+_G.level);
        let {cells,level}=_G,
          rc, pos= level == "#hard"?this.board.run(cells, this.pnum)
                                   :bruteAI(level, cells,this.pnum, _G.getOtherIcon(this.pnum));
        if(pos<0)
          throw Error("Bad grid index < 0");
        cells[pos] = this.pnum;
        Mojo.emit(["ai.moved",this.scene],pos);
        _G.playSnd();
        rc= _G.checkState();
        if(rc==0){
          _G.switchPlayer()
        }else{
          _G.lastWin= rc==1 ? _G.pcur : 0;
          _G.endOfGame();
        }
      };
      Mojo.on(...signal);
      return o;
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _G.Tile=function(x,y,tileX,tileY,props){
      let s= _S.sprite(_S.frames("icons.png",tileX,tileY));
      const signal= [["ai.moved",s],"aiMoved",s.m5];
      _S.scaleXY(s,props.scale[0], props.scale[1]);
      _V.set(_S.anchorXY(s,0.5),x,y);
      _.inject(_I.mkBtn(s).m5,props);
      s.m5.showFrame(1);
      s.m5.aiMoved=()=>{
        s.m5.enabled=false;
        s.m5.marked=true;
        s.m5.showFrame(_G.getIcon(_G.pcur))
      };
      s.m5.press=()=>{
        let v=_G.pcur, ai=_G.ai, p1= _G.pnum, cells= _G.cells;
        //if AI is thinking, back off
        //if cell already marked, go away
        if((ai && v==ai.pnum)|| s.m5.marked){return}
        s.m5.enabled=false;
        s.m5.marked=true;
        _G.playSnd();
        if(cells[s.m5.gpos] != 0)
          throw "Fatal: cell marked already!!!!";
        s.m5.showFrame(_G.getIcon(v));
        cells[s.m5.gpos]= v;
        let rc= _G.checkState();
        if(rc==0){
          _G.switchPlayer()
        }else{
          _G.lastWin= rc==1 ? _G.pcur : 0;
          _G.endOfGame();
        }
      };
      Mojo.on(...signal);
      return s;
    };
  }

})(this);


