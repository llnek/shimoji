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

  window["io/czlab/reversi/Sprites"]= function(Mojo){

    const _N=window["io/czlab/mcfud/negamax"]();
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           v2:_V,
           ute:_,is} = Mojo;

    /** @ignore */
    _G.Backgd=()=>{
      let s= _S.sprite("bggreen.jpg");
      let w=s.width;
      let h=s.height;
      _S.centerAnchor(s);
      _S.scaleXY(s,Mojo.width/w,
                   Mojo.height/h);
      return _V.set(s,MFL(Mojo.width/2),MFL(Mojo.height/2)) };

    /** @ignore */
    _G.AI=function(scene,v){
      const o={
        pnum:v,
        board: _G.Reversi(_G.X, _G.O),
        aiMove(){
          _.delay(500,()=> o.makeMove()) },
        makeMove(){
          let pos,rc, {cells}= _G;
          this.board.syncState(cells, this.pnum);
          pos= _N.evalNegaMax(this.board);
          if(pos)
            rc= _G.checkState(pos);
          if(rc && rc.length>0){
            rc.forEach(c=>{
              _G.flipIcon(scene,c);
              cells[c[0]][c[1]]=v;
            });
            _G.flipIcon(scene,pos,v);
            cells[pos[0]][pos[1]]=v;
            //G.playSnd();
            //_E.pub(["ai.moved",this.scene],pos);
            //cells[pos[0]][pos[1]] = this.pnum;
            _G.switchPlayer();
          }else{
            //_G.state.set("lastWin", rc===1 ? _G.state.get("pcur") : 0);
            //_Z.runScene("EndGame",5);
            console.log("DONE!");
          }
        }
      };
      Mojo.on(["ai.move",o], "aiMove",o);
      return o;
    };

    /** @ignore */
    _G.flipIcon=function(s,pos,V){
      for(let v,p,c,i=0,z=s.children.length;i<z;++i){
        c=s.children[i];
        if(c && c.g.gpos){
          p=c.g.gpos;
          if(p[0]===pos[0] && p[1]===pos[1]){
            if(V===undefined){
              _.assert(c.m5.enabled===false);
              v= c.g.gval===_G.X?_G.O:_G.X;
            }else{
              _.assert(c.m5.enabled===true);
              v=V;
            }
            c.m5.showFrame(v);
            c.g.gval=v;
            c.m5.enabled=false;
            c.m5.marked=true;
            break;
          }
        }
      }
    };

    /** @ignore */
    _G.Tile=(id,x,y,tileX,tileY,props)=>{
      let s= _S.sprite(_S.frames("icons.png",tileX,tileY));
      _S.scaleXY(s,_G.iconScale[0],_G.iconScale[1]);
      _V.set(_S.uuid(s,id),x,y);
      _.inject(s.g,props);
      _I.makeButton(_S.centerAnchor(s));
      if(props.gval !== 0){
        s.m5.enabled=false
      }
      s.m5.showFrame(_G.getIcon(props.gval));
      s.g.aiMoved=function(){
        s.m5.enabled=false;
        s.m5.marked=true;
        //mo.showFrame(G.getIcon(G.state.get("pcur")));
      };
      s.m5.press=function(){
        const {pcur,ai,pnum,cells}=_G;
        if(_G.gameOver){return}
        //if AI is thinking, back off
        if(ai && pcur===ai.pnum){ return }
        //if cell already marked, go away
        if(s.m5.marked) {return}
        //_G.playSnd();
        if(cells[s.g.gpos[0]]
                [s.g.gpos[1]] !== 0)
          throw "Fatal: cell marked already!!!!";
        let rc= _G.checkState(s.g.gpos);
        if(rc.length>0){
          rc.forEach(c=>{
            _G.flipIcon(s.parent,c);
            cells[c[0]][c[1]]=pcur;
          });
          _G.flipIcon(s.parent,s.g.gpos,pcur);
          cells[s.g.gpos[0]][s.g.gpos[1]]= pcur;
          _G.switchPlayer();
        }else{
          //_G.state.set("lastWin", rc===1 ? _G.state.get("pcur") : 0);
          //_Z.runScene("EndGame",5);
        }
      }
      Mojo.on(["ai.moved",s],"aiMoved",s.g);
      return s;
    };
  }

})(this);

