;(function(window){
  "use strict";

  window["io.czlab.mwars.ai"]=function(Mojo){
    const _F=window["io.czlab.mcfud.fsm"]();
    const _S=Mojo.Sprites;
    const _I=Mojo.Input;
    const _G=Mojo.Game;

    _G.closestEnemy=function(target){
      let closestDist= Infinity;
      let es= target.owner.getOtherPlayer().army;
      let d,dx,dy;
      let ret;
      es.forEach(e=>{
        dx=target.x-e.x;
        dy=target.y-e.y;
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
            let es=ai.enemiesWithinRange(_G.RADAR_RANGE);
            if(es.length > 0){
              while(ai.coins > _G.COST_QUIRK){
                if(ai.quirkCost < ai.zapCost && ai.coins > _G.COST_QUIRK){
                  _G.spawnQuirk(ai);
                }else if(ai.zapCost < ai.munchCost && ai.coins > _G.COST_ZAP){
                  _G.spawnZap(ai);
                }else if(ai.munchCost < ai.quirkCost && ai.coins > _G.COST_MUNCH){
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
          ingress(){ "defend.wav" },
          run(){
            let es = ai.enemiesWithinRange(_G.RADAR_RANGE);
            if(es.length === 0){
              ai.fsmObj.trigger("rush");
            }else{
              let other=ai.getOtherPlayer();
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
            let es= ai.enemiesWithinRange(_G.RADAR_RANGE);
            if(es.length > 0){
              ai.fsmObj.trigger("defend");
              return;
            }else if(ai.totalCost === 0){
              ai.fsmObj.trigger("mass");
              return;
            }else{
              ai.attacking=true;
              if(ai.totalCost >= ai.getOtherPlayer().totalCost){
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
          ingress(){"mass.wav"},
          run(){
            let es= ai.enemiesWithinRange(_G.RADAR_RANGE);
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
      s.team=team;
      s.army=[];
      s.curHp = 200;
      s.maxHp = 200;
      s.coins=0;
      s.lastCoinDrop=0;
      s.attacking = false;
      s.countArmy=function(){
        return this.army.length
      };
      s.getOtherTeam=function(){
        return team==="player1"?"player2":"player1"
      };
      s.getOtherPlayer=function(){
        return s.parent.getChildById(team==="player1"?"player2":"player1")
      };
      s.enemiesWithinRange=function(range){
        let es= this.getOtherPlayer().army;
        let range2=range*range;
        let out=[];
        let d;
        let dx;
        let dy;
        es.forEach(e=>{
          dx=s.x-e.x;
          dy=s.y-e.y;
          if((dx*dx+dy*dy) < range2){
            out.push(e);
          }
        });
        return out;
      };
      s.addToArmy=function(type){
        let a;
        if(type==="quirk"){
          a=_G.createQuirk(a);
          s.army.quirk.push(a);
        }
        else if(type==="zap"){
          a= _G.createZap(a);
          s.army.zap.push(a);
        }
        else if(type==="munch"){
          a=_G.createMunch(a);
          s.army.munch.push(a);
        }
        if(a){
          let x=s.x+s.width/2;
          let y=s.y;
          let vx=s.x <Mojo.width/2 ? 200: -200;
          let vy=s.x<Mojo.width/2?200:-200;
          a.anchor.set(0.5);
          a.x=x;
          a.y=y;
          a.mojoh5.step=function(dt){
            _S.move(a,dt);
          };
          a.mojoh5.vel[0]=vx;
          //a.mojoh5.vel[1]=vy;
          s.parent.insert(a);
        }
      };
      s.mojoh5.press=function(){
        s.attacking=!s.attacking;
        s.mojoh5.showFrame(s.attacking?1:0);
      };
      return s;
    }

    _G.createAI=function(){
      let e= _S.sprite(_S.frameImages("castle2_def.png","castle2_atk.png"));
      _I.makeButton(e);
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
      h.y=(Mojo.height-h.height)/2;
      h.x=h.width/4;
      _initCommon(h,"player1",1);
      h.mojoh5.step=function(){
      };
      return h;
    };

  };

})(this);


