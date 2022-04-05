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

  /**/
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           Game:_G,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //load in game modules
    window["io/czlab/reversi/Sprites"](Mojo);
    window["io/czlab/reversi/AI"](Mojo);
    window["io/czlab/reversi/Scenes"](Mojo);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //identify all relative cells to check
    const _Dirs= (function(out){
      [-1,0,1].forEach(r=>{
        [-1,0,1].forEach(c=>{
          if(r != 0 || c != 0) out.push([r,c]) }) });
      return out;
    })([]);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      scores: _.fill(3,UNDEF),
      points:[0,0,0],
      gridLineWidth:4,
      cells:UNDEF,
      aiTime:500,
      DIM:8,
      X:1,//black
      O:2,//white
      reset(){
        this.points=[0,0,0];
        this.cells=UNDEF;
      },
      playSnd(snd){
        let s;
        if(this.pcur==this.X) s="x.mp3";
        if(this.pcur==this.O) s="o.mp3";
        if(snd){s=snd}
        if(s) Mojo.sound(s).play()
      },
      search(cells, pos, cur, other){
        //search in all directions and count
        //how many of their pieces can flip
        //stop when the piece is yours
        let total=[], len=cells.length;
        for(let tmp,d,r,c,i=0;i<_Dirs.length;++i){
          d=_Dirs[i];
          tmp=[];
          r=pos[0]+d[0];
          c=pos[1]+d[1];
          while(r>=0 && r<len && c>=0 && c<len){
            if(cells[r][c] === other){
              //grab opponent piece
              tmp.push([r,c])
            }else{
              //ooops, better stop now
              if(cells[r][c] === cur)
                total=total.concat(tmp);
              break;
            }
            r+=d[0];
            c+=d[1];
          }
        }
        return total;
      },
      isGameOver(pv){
        const other= pv== this.X ? this.O : this.X;
        const pos=[0,0];
        let y=0;
        for(let t,r; y< this.cells.length; ++y){
          r=this.cells[y];
          for(let x=0;x<r.length;++x){
            if(r[x]==0){
              pos[0]=y;
              pos[1]=x;
              t=this.search(this.cells,pos,pv,other);
              if(t.length>0){
                y=911;
                break;
              }
            }
          }
        }
        return y<911;
      },
      getIcon(v){
        if(v==this.O || v=="O") return 2;//"o.png";
        if(v==this.X || v=="X") return 1;//"x.png";
        return 0;//"z.png";
      },
      switchPlayer(){
        const {cells,pcur,ai}= this;
        let msg, px=0,po=0;

        this.cells.forEach(r=> r.forEach(a=>{
          if(a== this.X) ++px;
          if(a== this.O) ++po;
        }));
        this.scores[this.X].text=_.prettyNumber(px,2);
        this.scores[this.O].text=_.prettyNumber(po,2);
        this.points[this.X]=px;
        this.points[this.O]=po;

        if(pcur==this.X) this.pcur= this.O;
        if(pcur==this.O) this.pcur= this.X;

        if(this.isGameOver(this.pcur)){
          msg="No Winner";
          if(_G.points[_G.X]>_G.points[_G.O]){
            msg= _G.mode==1 ? "You win !" : "Player 1 (Black) wins !";
          }
          if(_G.points[_G.X]<_G.points[_G.O]){
            msg= _G.mode==1 ? "You lose !" : "Player 2 (White) wins !";
          }
          this.gameOver=true;
          _.delay(343,()=> _Z.modal("EndGame",{

            fontSize:64*Mojo.getScaleFactor(),
            replay:{name:"MainMenu"},
            quit:{name:"Splash", cfg:_G.SplashCfg},
            msg,
            winner: msg.includes("win")

          }));
        }else if(ai && ai.pnum != pcur){
          Mojo.emit(["ai.move",ai]);
        }
      },
      checkState(gpos){
        //0=>ok,1=>win,-1=>draw
        return this.search(this.cells,
                            gpos,
                            this.pcur,
                            this.pcur== this.X? this.O: this.X)
      }
    });

    _Z.run("Splash", _G.SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles:["bggreen.jpg","icons.png",
                "x.mp3","o.mp3",
                "audioOn.png","audioOff.png",
                "click.mp3","game_over.mp3","game_win.mp3"],
    arena:{width:960, height:960},
    scaleToWindow:"max",
    scaleFit:"y",
    start(...args){ scenes(...args) }

  }));

})(this);





