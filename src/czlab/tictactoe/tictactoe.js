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

  function scenes(Mojo){

    const {Scenes:_Z,
           Sprites:_S,
           Game:_G,
           ute:_, is, EventBus}=Mojo;

    window["io/czlab/tictactoe/Sprites"](Mojo);
    window["io/czlab/tictactoe/AI"](Mojo);
    window["io/czlab/tictactoe/Scenes"](Mojo);

    _.inject(_G,{
      playSnd(snd){
        let s,c= this.pcur;
        if(c===this.X) s="x.mp3";
        else if(c===this.O) s="o.mp3";
        if(snd){s=snd}
        if(s) Mojo.sound(s).play();
      },
      getIcon(v){
        if(v===this.O || v=="O") return 0;//"o.png";
        if(v===this.X || v=="X") return 2;//"x.png";
        return 1;//"z.png";
      },
      getIconValue(v){
        if(v===this.O) return this.O;
        if(v===this.X) return this.X;
      },
      getIconImage(v){
        if(v===this.O) return "O";
        if(v===this.X) return "X";
      },
      switchPlayer(){
        let c=this.pcur;
        let ai= this.ai;
        if(c===this.X)
          this.pcur=this.O;
        if(c===this.O)
          this.pcur=this.X;
        if(ai && ai.pnum !== c)
          EventBus.pub(["ai.move",ai]);
      },
      checkTie(){
        for(let i=0;i<this.cells.length;++i)
          if(this.cells[i]===0) return false;
        return true;
      },
      checkState(){
        if(this.checkTie()){
          return -1
        }else{
          for(let ok, arr,g=0; g < this.goals.length; ++g){
            arr=this.goals[g];
            ok=0;
            for(let i=0; i<arr.length; ++i){
              if(this.cells[arr[i]]===this.pcur) ++ok;
            }
            if(ok===arr.length) return 1;
          }
          return 0;
        }
      },
      mapGoalSpace(){
        let dx=[];
        let dy= [];
        let dim=this.DIM;
        let goals= _.jsVec();
        for(let r=0; r<dim; ++r){
          let h=[], v=[];
          for(let c=0; c<dim; ++c){
            h[c] = r * dim + c;
            v[c] = c * dim + r;
          }
          goals.push(h,v);
          dx[r] = r * dim + r;
          dy[r] = (dim - r - 1) * dim + r;
        }
        goals.push(dx,dy);
        return goals;
      },
      DIM:3,
      X:88,
      O:79
    });
  }

  const _$={
    assetFiles:["bgblack.jpg","icons.png","x.mp3","o.mp3","end.mp3"],
    arena:{width:1200, height:1200},
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);





