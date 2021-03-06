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

  function setup(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Game:_G,
           ute:_,is}=Mojo;

    //load in game modules
    window["io/czlab/reversi/Sprites"](Mojo);
    window["io/czlab/reversi/AI"](Mojo);
    window["io/czlab/reversi/Scenes"](Mojo);

    //identify all relative cells to check
    const _Dirs=
    (function(out){
      [-1,0,1].forEach(r=>{
        [-1,0,1].forEach(c=>{
          if(r !== 0 || c !==0) out.push([r,c]) }) });
      return out;
    })([]);

    _.inject(_G,{
      scores:[null,null,null],
      gridLineWidth:4,
      DIM:8,
      X:1,//black
      O:2,//white
      piecesFlipped(cells, pos, cur, other){
        //search in all directions and count
        //how many of their pieces can flip
        //stop when the piece is yours
        let total=[],
            len=cells.length;
        for(let added,d,r,c,i=0;i<_Dirs.length;++i){
          d=_Dirs[i];
          added=[];
          r=pos[0]+d[0];
          c=pos[1]+d[1];
          while(0<=r && r<len && 0<=c && c<len){
            if(cells[r][c] === other){
              //grab their piece
              added.push([r,c])
            }else{
              //ooops, better stop now
              if(cells[r][c] === cur)
                total=total.concat(added);
              break;
            }
            r+=d[0];
            c+=d[1];
          }
        }
        return total;
      },
      isGameOver(pv){
        const {cells}=_G;
        const pos=[0,0];
        const other= pv===_G.X?_G.O:_G.X;
        for(let t,r,y=0;y<cells.length;++y){
          r=cells[y];
          for(let x=0;x<r.length;++x){
            if(r[x]===0){
              pos[0]=y;
              pos[1]=x;
              t=this.piecesFlipped(cells,pos,pv,other);
              if(t.length>0)
                return false;
            }
          }
        }
        return true;
      },
      getIcon(v){
        if(v===_G.O || v==="O") return 2;//"o.png";
        if(v===_G.X || v==="X") return 1;//"x.png";
        return 0;//"z.png";
      },
      getIconValue(v){
        if(v===_G.O) return _G.O;
        if(v===_G.X) return _G.X;
      },
      getIconImage(v){
        if(v===_G.O) return "O";
        if(v===_G.X) return "X";
      },
      switchPlayer(){
        const {cells,pcur,ai}=_G;
        let px=0,po=0;
        for(let a,r=0;r<cells.length;++r){
          a=cells[r];
          for(let c=0;c<a.length;++c){
            if(a[c]===_G.X)++px;
            else if(a[c]===_G.O)++po;
          }
        }
        _G.scores[_G.X].text=`${px}`;
        _G.scores[_G.O].text=`${po}`;

        if(pcur===_G.X) _G.pcur= _G.O;
        if(pcur===_G.O) _G.pcur=_G.X;

        if(this.isGameOver(_G.pcur)){
          _G.gameOver=true;
          alert("poo");
          Mojo.pause();
        }else{
          if(ai && ai.pnum !== pcur)
            Mojo.emit(["ai.move",ai]);
        }
      },
      checkTie(){
      },
      checkState(gpos){
        //0=>ok,1=>win,-1=>draw
        const {cells,pcur}=_G;
        return _G.piecesFlipped(cells,gpos,pcur,pcur===_G.X?_G.O:_G.X) }
    });

    _Z.runScene("level1");
  }

  const _$={
    assetFiles:["bggreen.jpg","icons.png"],
    arena:{width:960, height:960},
    scaleToWindow:"max",
    start(Mojo){ setup(Mojo) }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





