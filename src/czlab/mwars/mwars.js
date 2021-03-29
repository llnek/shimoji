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
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           ute:_, is, EventBus}= Mojo;

    window["io/czlab/mwars/players"](Mojo);
    window["io/czlab/mwars/models"](Mojo);

    _G.RADAR_RANGE=200;
    _G.COST_MUNCH=50;
    _G.COST_ZAP=25;
    _G.COST_QUIRK=10;

    /**
     * @private
     * @function
     */
    function _createMonster(p,what){
      let K=Mojo.getScaleFactor();
      let s;
      switch(what){
        case "quirk": s=_createQuirk(p); break;
        case "zap": s=_createZap(p); break;
        case "munch": s=_createMunch(p); break;
      }
      if(s){
        _S.scaleXY(s,K,K);
        s.m5.tick=function(dt){
          !s.m5.dead &&
            _G.updateMelee(s,dt);
          !s.m5.dead &&
            _G.updateRanged(s,dt);
          !s.m5.dead &&
            _G.updateMove(s,dt);
        }
      }
      return s;
    }

    /**
     * @private
     * @function
     */
    function _createZap(p){
      let s= _S.sprite(`zap${p.g.teamNumber}.png`);
      s.g.costValue=_G.COST_ZAP;
      s.g.owner=p;
      s.g.curHp = 10;
      s.g.maxHp = 10;
      s.g.maxVelocity = 50;
      s.g.maxAcceleration = 50;
      s.g.isRanged = true;
      s.g.rangedRange = 100;
      s.g.rangedDamageRate = 1.5;
      s.g.rangedDamage = 5;
      s.g.rangedSound = "pew.wav";
      return s;
    }

    function _createQuirk(p){
      let s= _S.sprite(`quirk${p.g.teamNumber}.png`);
      s.g.costValue=_G.COST_QUIRK;
      s.g.owner=p;
      s.g.curHp = 5;
      s.g.maxHp = 5;
      s.g.maxVelocity = 100;
      s.g.maxAcceleration = 100;
      s.g.isMelee = true;
      s.g.meleeDamage = 1.25;
      s.g.meleeDestroySelf = false;
      s.g.meleeDamageRate = 0.5;
      s.g.meleeAoe = false;
      s.g.meleeSound = "smallHit.wav";
      return s;
    }

    function _createMunch(p){
      let s= _S.sprite(`munch${p.g.teamNumber}.png`);
      s.g.costValue=_G.COST_MUNCH;
      s.g.owner=p;
      s.g.curHp = 50;
      s.g.maxHp = 50;
      s.g.maxVelocity = 25;
      s.g.maxAcceleration = 25;
      s.g.isMelee = true;
      s.g.meleeDamage = 10.0;
      s.g.meleeDestroySelf = false;
      s.g.meleeDamageRate = 2.0;
      s.g.meleeAoe = true;
      s.g.meleeSound = "bigHit.wav";
      return s;
    }

    _G.enemiesWithinRange=function(p,range){
      let es= _G.getOtherPlayer(p).g.army;
      let range2=range*range;
      let out=[];
      let d;
      let dx;
      let dy;
      es.forEach(e=>{
        dx=p.x-e.x;
        dy=p.y-e.y;
        if((dx*dx+dy*dy) < range2){
          out.push(e);
        }
      });
      return out;
    };

    _G.getOtherPlayer=function(p){
      return p.parent.getChildById(p.g.teamNumber===1?"player2":"player1")
    };

    _G.spawnLaser=function(p){
      let s=_S.sprite(`laser${p.g.teamNumber}.png`);
      p.parent.insert(s);
      s.g.owner = p;
      s.g.isMelee = true;
      s.g.meleeDamage = 5;
      s.g.meleeDestroySelf = true;
      s.g.meleeDamageRate = 1.0;
      s.g.meleeAoe = false;
      s.g.meleeSound = "smallHit.wav";
      s.m5.tick=function(dt){
        _S.move(dt);
      }
      return s;
    };

    _G.spawnQuirk=function(p){
      let i=Infinity;
      if(p.g.coins >= _G.COST_QUIRK){
        Mojo.sound("spawn.wav").play();
        p.g.coins -= _G.COST_QUIRK;
        i=0;
      }
      for(let m,dy; i<2; ++i){
        m= _createMonster(p,"quirk");
        dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.g.owner = p;
        p.g.army.push(m);
        p.parent.insert(m);
      }
    };

    _G.spawnZap=function(p){
      if(p.g.coins >= _G.COST_ZAP){
        p.g.coins -= _G.COST_ZAP;
        Mojo.sound("spawn.wav").play();
        let m= _createMonster(p,"zap");
        let dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.g.owner = p;
        p.g.army.push(m);
        p.parent.insert(m);
      }
    };

    _G.spawnMunch=function(p){
      if(p.g.coins >= _G.COST_MUNCH){
        p.g.coins -= _G.COST_MUNCH;
        Mojo.sound("spawn.wav").play();
        let m= _createMonster(p,"munch");
        let dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.g.owner = p;
        p.g.army.push(m);
        p.parent.insert(m);
      }
    };

    _Z.defScene("bg",{
      setup(){
        this.insert(_S.sizeXY(_S.sprite("bg.png"),Mojo.width,Mojo.height))
      }
    });

    _Z.defScene("level1",{
      _mkBtn(png,opcode){
        let b=_S.sprite("button.png");
        let K=Mojo.getScaleFactor();
        let s=_S.sprite(png);
        b.addChild(s);
        b.m5.press=()=>{
          _G[opcode](_G.player)
        };
        return _S.scaleXY(_I.makeButton(b),K,K);
      },
      _ctrlBtns(){
        if(!this.quirkBtn)
          this.quirkBtn=this._mkBtn("quirk1.png","spawnQuirk");
        if(!this.zapBtn)
          this.zapBtn=this._mkBtn("zap1.png","spawnZap");
        if(!this.munchBtn)
          this.munchBtn=this._mkBtn("munch1.png","spawnMunch");
      },
      _ctrlPanel(){
        this._ctrlBtns();
        let g=this.ctrlPanel;
        let options={group:g,
                     x:0,y:0,
                     color:"transparent",
                     padding: this.munchBtn.width/2};
        let btns=[this.quirkBtn,this.zapBtn,this.munchBtn];
        if(g){
          g.removeChildren();
          g.x=g.y=0;
        }
        g= this.ctrlPanel=_Z.layoutX(btns, options);
        g.x=MFL((Mojo.width-g.width)/2);
        g.y=MFL(Mojo.height-g.height-this.munchBtn.height/4);
        return g;
      },
      setup(){
        let h=_G.player = _G.createPlayer();
        let e= _G.enemy= _G.createAI();
        _G.players=[null,h,e];
        this.insert(h);
        this.insert(e);
        this.insert(this._ctrlPanel());
      },
      preUpdate(dt){
        let now=_.now();
        _G.players.forEach(p=>{
          if(p){
            if(now - p.g.lastCoinDrop > 1500){
              p.g.lastCoinDrop = now;
              p.g.coins += 5;
            }
            p.g.quirkCost=0;
            p.g.zapCost=0;
            p.g.munchCost=0;
            p.g.army.forEach(a=>{
              if(_G.COST_QUIRK===a.g.costValue) p.g.quirkCost+=a.g.costValue;
              if(_G.COST_ZAP===a.g.costValue) p.g.zapCost+=a.g.costValue;
              if(_G.COST_MUNCH===a.g.costValue) p.g.munchCost+=a.g.costValue;
            });
            p.g.totalCost=p.g.quirkCost+p.g.zapCost+p.g.munchCost;
          }
        });
      },
      postUpdate(dt){
        if(_G.players[1].g.curHp <=0){
          console.log("You Lost!")
        }
        if(_G.players[2].g.curHp<=0){
          console.log("You Won!")
        }
      }
    });
  }

  const _$={
    assetFiles:["bg.png","tiles.png","images/tiles.json",
      "attack.wav","bigHit.wav","boom.wav","defend.wav",
      "mass.wav","pew.wav","pew2.wav","smallHit.wav","spawn.wav"],
    arena: {width:1136,height:640},
    scaleToWindow: "max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("bg");
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load", ()=>MojoH5(_$));

})(this);


