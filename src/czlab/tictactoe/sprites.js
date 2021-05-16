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

  window["io/czlab/tictactoe/Sprites"]= function(Mojo){
    const _N=window["io/czlab/mcfud/negamax"]();
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is}=Mojo;

    _G.Backgd=function(){
      let s= _S.sprite("bgblack.jpg");
      let w=s.width;
      let h=s.height;
      s.scale.x=Mojo.width/w;
      s.scale.y=Mojo.height/h;
      _S.centerAnchor(s);
      return _V.set(s,MFL(Mojo.width/2),
                      MFL(Mojo.height/2)) };

    _G.AI=function(v){
      const o={
        pnum:v,
        board: _G.TTToe(_G.X, _G.O) };
      const signal=[["ai.move",o], "aiMove",o];
      o.dispose=()=>{
        Mojo.off(...signal)
      };
      o.aiMove=()=>{
        _.delay(500,()=> o.makeMove())
      };
      o.makeMove=function(){
        let cells= _G.cells;
        let pos,rc;
        pos= this.board.run(cells, this.pnum);
        cells[pos] = this.pnum;
        Mojo.emit(["ai.moved",this.scene],pos);
        _G.playSnd();
        rc= _G.checkState();
        if(rc===0)
          _G.switchPlayer();
        else{
          _G.lastWin= rc===1 ? _G.pcur : 0;
          _Z.runScene("EndGame",5);
        }
      };
      Mojo.on(...signal);
      return o;
    };

    _G.Tile=function(x,y,tileX,tileY,props){
      let s= _S.sprite(_S.frames("icons.png",tileX,tileY));
      const signal= [["ai.moved",s],"aiMoved",s.m5];
      s.scale.x=props.scale[0];
      s.scale.y=props.scale[1];
      _S.centerAnchor(s);
      _V.set(s,x,y);
      _.inject(s.m5,props);
      s=_I.makeButton(s);
      s.m5.showFrame(1);
      s.m5.aiMoved=()=>{
        s.m5.enabled=false;
        s.m5.marked=true;
        s.m5.showFrame(_G.getIcon(_G.pcur)) };
      s.m5.press=function(){
        let v=_G.pcur;
        let ai=_G.ai;
        let p1= _G.pnum;
        let cells= _G.cells;
        //if AI is thinking, back off
        if(ai && v===ai.pnum){return}
        //if cell already marked, go away
        if(s.m5.marked){return}
        s.m5.enabled=false;
        s.m5.marked=true;
        _G.playSnd();
        if(cells[s.m5.gpos] !== 0)
          throw "Fatal: cell marked already!!!!";
        s.m5.showFrame(_G.getIcon(v));
        cells[s.m5.gpos]= v;
        let rc= _G.checkState();
        if(rc===0)
          _G.switchPlayer();
        else{
          _G.lastWin= rc===1 ? _G.pcur : 0;
          _Z.runScene("EndGame",5);
        }
      }
      Mojo.on(...signal);
      return s;
    };
  }

})(this);

