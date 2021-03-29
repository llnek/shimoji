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

  window["io/czlab/mwars/players"]=function(Mojo){
    const {Sprites:_S,Input:_I,Game:_G,ute:_,is,EventBus}=Mojo;
    const _F=window["io/czlab/mcfud/fsm"]();
    const MFL=Math.floor;

    _G.closestEnemy=function(monster){
      let es= _G.getOtherPlayer(monster.g.owner).g.army;
      let closestDist= Infinity;
      let d,dx,dy;
      let ret;
      es.forEach(e=>{
        dx=monster.x-e.x;
        dy=monster.y-e.y;
        d= dx*dx+dy*dy;
        if(d<closestDist){
          ret=e;
          closestDist=d;
        }
      });
      return ret;
    };

    function _initAI(ai){
      const aiFSM={
        initState(){ return "mass" },
        "counter":{
          transitions:{ "defend": {target:"defend"} },
          run(){
            let es=_G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            let other=_G.getOtherPlayer(ai);
            if(es.length>0){
              //build up army
              while(ai.g.coins > _G.COST_QUIRK){
                if(ai.g.munchCost < other.g.quirkCost && ai.g.coins > _G.COST_MUNCH){
                  _G.spawnMunch(ai);
                }else if(ai.g.zapCost < other.g.munchCost && ai.g.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else{
                  _G.spawnQuirk(ai);
                }
              }
              ai.g.fsmObj.trigger("defend");
            }
          }
        },
        "defend":{
          enter(){ Mojo.sound("defend.wav").play() },
          transitions:{ "rush":{ target:"rush"} },
          run(){
            let es = _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            let other=_G.getOtherPlayer(ai);
            if(es.length>0){
              ai.g.attacking=false;
              if(ai.g.totalCost === 0 || other.g.totalCost > ai.g.totalCost*2){
                if(ai.g.quirkCost < other.g.zapCost && ai.g.coins > _G.COST_QUIRK){
                  _G.spawnQuirk(ai);
                }else if(ai.g.zapCost < other.g.munchCost && ai.g.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else if(ai.g.munchCost < other.g.quirkCost && ai.g.coins > _G.COST_MUNCH){
                  _G.spawnMunch(ai);
                }else if(other.g.totalCost === 0){
                  while(ai.g.coins > _G.COST_ZAP + _G.COST_QUIRK){
                    _G.spawnQuirk(ai);
                    _G.spawnZap(ai);
                  }
                }
              }
            }else{
              ai.g.fsmObj.trigger("rush");
            }
          }
        },
        "rush":{
          enter(){ Mojo.sound("attack.wav").play() },
          transitions:{
            "defend":{ target:"defend" },
            "mass":{ target:"mass" }
          },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length>0){
              ai.g.fsmObj.trigger("defend");
            }else if(ai.g.totalCost === 0){
              ai.g.fsmObj.trigger("mass");
            }else{
              ai.g.attacking=true;
              if(ai.g.totalCost >= _G.getOtherPlayer(ai).g.totalCost){
                _G.spawnQuirk(ai);
              }
            }
          }
        },
        "mass":{
          enter(){ Mojo.sound("mass.wav").play() },
          transitions:{
            "counter":{ target:"counter" },
            "defend":{ target:"defend"}
          },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length>0){
              ai.g.fsmObj.trigger("defend");
            } else if(ai.g.totalCost+ai.g.coins >= _G.COST_MUNCH + _G.COST_ZAP*2){
              ai.g.fsmObj.trigger("counter");
            } else{
              ai.g.attacking=false;
            }
          }
        }
      };
      return _F.fsm(aiFSM);
    }

    function _initCommon(s,gid,posfunc){
      let K=Mojo.getScaleFactor();
      s.m5.uuid=`player${gid}`;
      s.g.teamNumber=gid;
      s.g.army=[];
      s.g.curHp = 200;
      s.g.maxHp = 200;
      s.g.coins=0;
      s.g.lastCoinDrop=0;
      s.g.attacking = false;
      _S.scaleXY(s,K,K);
      posfunc(s);
      s.children.forEach(c=> posfunc(c));
      return s;
    }

    _G.createAI=function(){
      let e= _S.sprite(_S.frameImages("castle2_def.png","castle2_atk.png"));
      _initCommon(e,2,(s)=>{
        s.y=MFL((Mojo.height-s.height)/2);
        s.x=MFL(Mojo.width-s.width-s.width/4);
      });
      e.g.fsmObj= _initAI(e);
      e.m5.tick=function(){
        e.g.fsmObj.process();
        e.m5.showFrame(e.g.attacking?1:0);
      };
      return e;
    };

    _G.createPlayer=function(){
      let h= _S.spriteFrom("castle1_def.png","castle1_atk.png");
      h.m5.press=function(){
        h.g.attacking=!h.g.attacking;
        h.m5.showFrame(h.g.attacking?1:0);
      };
      _initCommon(h,1,(s)=>{
        s.y=MFL((Mojo.height-s.height)/2);
        s.x=MFL(s.width/4);
      });
      return _I.makeButton(h);
    };

  };

})(this);


