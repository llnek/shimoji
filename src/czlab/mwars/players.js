;(function(window){
  "use strict";

  window["io.czlab.mwars.players"]=function(Mojo){
    const _F=window["io.czlab.mcfud.fsm"]();
    const _S=Mojo.Sprites;
    const _I=Mojo.Input;
    const _G=Mojo.Game;

    _G.closestEnemy=function(monster){
      let es= _G.getOtherPlayer(monster.owner).army;
      let closestDist= Infinity;
      let d,dx,dy;
      let ret;
      es.forEach(e=>{
        dx=monster.x-e.x;
        dy=monster.y-e.y;
        d= dx*dx+dy*dy;
        if(d < closestDist){
          ret = e;
          closestDist= d;
        }
      });
      return ret;
    };

    function _initAI(ai){
      const aiFSM={
        initState(){ return "mass" },
        "counter":{
          run(){
            let es=_G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            let other=_G.getOtherPlayer(ai);
            if(es.length > 0){
              while(ai.coins > _G.COST_QUIRK){
                if(ai.quirkCost < other.zapCost && ai.coins > _G.COST_QUIRK){
                  _G.spawnQuirk(ai);
                }else if(ai.zapCost < other.munchCost && ai.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else if(ai.munchCost < other.quirkCost && ai.coins > _G.COST_MUNCH){
                  _G.spawnMunch(ai);
                }else{
                  _G.spawnQuirk(ai);
                }
              }
              ai.fsmObj.trigger("defend");
            }
          },
          transitions:{
            "defend":{ target:"defend", action(){ } }
          }
        },
        "defend":{
          ingress(){ Mojo.sound("defend.wav").play() },
          run(){
            let es = _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length === 0){
              ai.fsmObj.trigger("rush");
            }else{
              let other=_G.getOtherPlayer(ai);
              ai.attacking=false;
              if(ai.totalCost === 0 || other.totalCost > ai.totalCost*2){
                if(ai.quirkCost < other.zapCost && ai.coins > _G.COST_QUIRK){
                  _G.spawnQuirk(ai);
                }else if(ai.zapCost < other.munchCost && ai.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else if(ai.munchCost < other.quirkCost && ai.coins > _G.COST_MUNCH){
                  _G.spawnMunch(ai);
                }else if(other.totalCost === 0){
                  while(ai.coins > _G.COST_ZAP + _G.COST_QUIRK){
                    _G.spawnQuirk(ai);
                    _G.spawnZap(ai);
                  }
                }
              }
            }
          },
          transitions:{
            "rush":{ target:"rush", action(){ } }
          }
        },
        "rush":{
          ingress(){ "attack.wav" },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length > 0){
              ai.fsmObj.trigger("defend");
            }else if(ai.totalCost === 0){
              ai.fsmObj.trigger("mass");
            }else{
              ai.attacking=true;
              if(ai.totalCost >= _G.getOtherPlayer(ai).totalCost){
                _G.spawnQuirk(ai);
              }
            }
          },
          transitions:{
            "defend":{ target:"defend", action(){ } },
            "mass":{ target:"mass", action(){ } }
          }
        },
        "mass":{
          ingress(){ Mojo.sound("mass.wav").play() },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length > 0){
              ai.fsmObj.trigger("defend");
            } else if(ai.totalCost+ai.coins >= _G.COST_MUNCH + _G.COST_ZAP*2){
              ai.fsmObj.trigger("counter");
            } else{
              ai.attacking=false;
            }
          },
          transitions:{
            "counter":{ target:"counter", action(){ } },
            "defend":{ target:"defend", action(){ } }
          }
        }
      };
      return _F.fsm(aiFSM);
    }

    function _initCommon(s,team,gid){
      s.mojoh5.uuid=team;
      s.teamNumber=gid;
      s.army=[];
      s.curHp = 200;
      s.maxHp = 200;
      s.coins=0;
      s.lastCoinDrop=0;
      s.attacking = false;
      return s;
    }

    _G.createAI=function(){
      let e= _S.sprite(_S.frameImages("castle2_def.png","castle2_atk.png"));
      e.y=(Mojo.height-e.height)/2;
      e.x=Mojo.width-e.width-e.width/4;
      _initCommon(e,"player2",2);
      e.fsmObj= _initAI(e);
      e.mojoh5.step=function(){
        e.fsmObj.process();
      };
      return e;
    };

    _G.createHuman=function(){
      let h= _S.sprite(_S.frameImages("castle1_def.png","castle1_atk.png"));
      _I.makeButton(h);
      h.mojoh5.press=function(){
        h.attacking=!h.attacking;
        h.mojoh5.showFrame(h.attacking?1:0);
      };
      h.y=(Mojo.height-h.height)/2;
      h.x=h.width/4;
      _initCommon(h,"player1",1);
      h.mojoh5.step=function(){
      };
      return h;
    };

  };

})(this);


