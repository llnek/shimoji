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
          transitions:{ "defend":{target:"defend"} },
          run(){
            let es=_G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            let other=_G.getOtherPlayer(ai);
            if(es.length>0){
              //build up army
              while(ai.coins > _G.COST_QUIRK){
                if(ai.munchCost < other.quirkCost && ai.coins > _G.COST_MUNCH){
                  _G.spawnMunch(ai);
                }else if(ai.zapCost < other.munchCost && ai.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else{
                  _G.spawnQuirk(ai);
                }
              }
              ai.fsmObj.trigger("defend");
            }
          }
        },
        "defend":{
          ingress(){ Mojo.sound("defend.wav").play() },
          transitions:{ "rush":{ target:"rush"} },
          run(){
            let es = _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            let other=_G.getOtherPlayer(ai);
            if(es.length>0){
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
            }else{
              ai.fsmObj.trigger("rush");
            }
          }
        },
        "rush":{
          ingress(){ Mojo.sound("attack.wav").play() },
          transitions:{
            "defend":{ target:"defend" },
            "mass":{ target:"mass" }
          },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length>0){
              ai.fsmObj.trigger("defend");
            }else if(ai.totalCost === 0){
              ai.fsmObj.trigger("mass");
            }else{
              ai.attacking=true;
              if(ai.totalCost >= _G.getOtherPlayer(ai).totalCost){
                _G.spawnQuirk(ai);
              }
            }
          }
        },
        "mass":{
          ingress(){ Mojo.sound("mass.wav").play() },
          transitions:{
            "counter":{ target:"counter" },
            "defend":{ target:"defend"}
          },
          run(){
            let es= _G.enemiesWithinRange(ai,_G.RADAR_RANGE);
            if(es.length>0){
              ai.fsmObj.trigger("defend");
            } else if(ai.totalCost+ai.coins >= _G.COST_MUNCH + _G.COST_ZAP*2){
              ai.fsmObj.trigger("counter");
            } else{
              ai.attacking=false;
            }
          }
        }
      };
      return _F.fsm(aiFSM);
    }

    function _initCommon(s,gid,posfunc){
      s.mojoh5.uuid=`player${gid}`;
      s.mojoh5.resize=function(){
        _S.scaleContent(s);
        posfunc(s);
      };
      s.teamNumber=gid;
      s.army=[];
      s.curHp = 200;
      s.maxHp = 200;
      s.coins=0;
      s.lastCoinDrop=0;
      s.alive=true;
      s.attacking = false;
      s.mojoh5.resize();
      return s;
    }

    _G.createAI=function(){
      let e= _S.sprite(_S.frameImages("castle2_def.png","castle2_atk.png"));
      _initCommon(e,2,(s)=>{
        s.y=(Mojo.height-s.height)/2;
        s.x=Mojo.width-s.width-s.width/4;
      });
      e.fsmObj= _initAI(e);
      e.mojoh5.step=function(){
        e.fsmObj.process();
        e.mojoh5.showFrame(e.attacking?1:0);
      };
      return e;
    };

    _G.createHuman=function(){
      let h= _S.spriteFrom("castle1_def.png","castle1_atk.png");
      h.mojoh5.press=function(){
        h.attacking=!h.attacking;
        h.mojoh5.showFrame(h.attacking?1:0);
      };
      _initCommon(h,1,(s)=>{
        s.y=(Mojo.height-s.height)/2;
        s.x=s.width/4;
      });
      return _I.makeButton(h);
    };

  };

})(this);


