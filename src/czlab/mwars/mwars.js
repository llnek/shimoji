;(function(window){
  "use strict";

  function scenes(Mojo){
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _=Mojo.u;

    _G.COST_MUNCH=50;
    _G.COST_ZAP=25;
    _G.COST_QUIRK=10;
    _G.RADAR_RANGE=200;

    /**
     * @private
     * @function
     */
    function _createMonster(p,what){
      let s;
      switch(what){
        case "quirk": s=_createQuirk(p); break;
        case "zap": s=_createZap(p); break;
        case "munch": s=_createMunch(p); break;
      }
      if(s){
        s.alive=true;
        s.mojoh5.step=function(dt){
          if(s.alive){
            _G.updateMelee(s,dt);
            _G.updateRanged(s,dt);
            _G.updateMove(s,dt);
          }
        }
      }
      return s;
    }
    /**
     * @private
     * @function
     */
    function _createZap(p){
      let s= _S.sprite(`zap${p.teamNumber}.png`);
      s.costValue=_G.COST_ZAP;
      s.owner=p;
      s.curHp = 10;
      s.maxHp = 10;
      s.maxVelocity = 50;
      s.maxAcceleration = 50;
      s.isRanged = true;
      s.rangedRange = 100;
      s.rangedDamageRate = 1.5;
      s.rangedDamage = 5;
      s.rangedSound = "pew.wav";
      return s;
    }
    function _createQuirk(p){
      let s= _S.sprite(`quirk${p.teamNumber}.png`);
      s.costValue=_G.COST_QUIRK;
      s.owner=p;
      s.curHp = 5;
      s.maxHp = 5;
      s.maxVelocity = 100;
      s.maxAcceleration = 100;
      s.isMelee = true;
      s.meleeDamage = 1.25;
      s.meleeDestroySelf = false;
      s.meleeDamageRate = 0.5;
      s.meleeAoe = false;
      s.meleeSound = "smallHit.wav";
      return s;
    }
    function _createMunch(p){
      let s= _S.sprite(`munch${p.teamNumber}.png`);
      s.costValue=_G.COST_MUNCH;
      s.owner=p;
      s.curHp = 50;
      s.maxHp = 50;
      s.maxVelocity = 25;
      s.maxAcceleration = 25;
      s.isMelee = true;
      s.meleeDamage = 10.0;
      s.meleeDestroySelf = false;
      s.meleeDamageRate = 2.0;
      s.meleeAoe = true;
      s.meleeSound = "bigHit.wav";
      return s;
    }

    _G.enemiesWithinRange=function(p,range){
      let es= _G.getOtherPlayer(p).army;
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
      return p.parent.getChildById(p.teamNumber===1?"player2":"player1")
    };

    _G.spawnLaser=function(p){
      let s=_S.sprite(`laser${p.teamNumber}.png`);
      p.parent.insert(s);
      s.owner = p;
      s.isMelee = true;
      s.meleeDamage = 5;
      s.meleeDestroySelf = true;
      s.meleeDamageRate = 1.0;
      s.meleeAoe = false;
      s.meleeSound = "smallHit.wav";
      return s;
    };

    _G.spawnQuirk=function(p){
      let i=Infinity;
      if(p.coins >= _G.COST_QUIRK){
        p.coins -= _G.COST_QUIRK;
        i=0;
        Mojo.sound("spawn.wav").play();
      }
      for(let m,dy; i<2; ++i){
        m= _createMonster(p,"quirk");
        dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.owner = p;
        p.army.push(m);
        p.parent.insert(m);
      }
    };

    _G.spawnZap=function(p){
      if(p.coins >= _G.COST_ZAP){
        p.coins -= _G.COST_ZAP;
        Mojo.sound("spawn.wav").play();
        let m= _createMonster(p,"zap");
        let dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.owner = p;
        p.army.push(m);
        p.parent.insert(m);
      }
    };

    _G.spawnMunch=function(p){
      if(p.coins >= _G.COST_MUNCH){
        p.coins -= _G.COST_MUNCH;
        Mojo.sound("spawn.wav").play();
        let m= _createMonster(p,"munch");
        let dy = _.randInt2(-Mojo.height/4, Mojo.height/4);
        m.x = p.x + p.width/2;
        m.y= p.y + dy;
        m.owner = p;
        p.army.push(m);
        p.parent.insert(m);
      }
    };

    _Z.defScene("Bg",{
      setup(){
        let s= _S.sprite("bg.png");
        let K= Mojo.scaleXY([s.width,s.height],[Mojo.width,Mojo.height]);
        s.anchor.set(0.5);
        s.x=Mojo.width/2;
        s.y=Mojo.height/2;
        s.scale.x=K[0];
        s.scale.y=K[1];
        this.insert(s);
      }
    });

    _Z.defScene("level1",{
      mkBtn(png){
        let b=_S.sprite("button.png");
        let s=_S.sprite(png);
        b.addChild(s);
        return _I.makeButton(b);
      },
      setup(){
        let h=this.human = _G.createHuman();
        this.insert(h);
        let e= this.enemy= _G.createAI();
        this.insert(e);
        let q=this.mkBtn("quirk1.png");
        let z=this.mkBtn("zap1.png");
        let m=this.mkBtn("munch1.png");
        let c=_Z.layoutX([q,z,m],{color:"transparent",padding: m.width/2});
        c.x=(Mojo.width-c.width)/2;
        c.y=Mojo.height-c.height-m.height/4;
        this.insert(c);
        this.quirkBtn=q;
        this.zapBtn=z;
        this.munchBtn=m;
        this.players=[null,h,e];
        m.mojoh5.press=()=>{
          _G.spawnMunch(h)
        };
        z.mojoh5.press=()=>{
          _G.spawnZap(h)
        };
        q.mojoh5.press=()=>{
          _G.spawnQuirk(h)
        };
        Mojo.EventBus.sub(["pre.update",this],"preUpdate");
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      preUpdate(){
        let now=_.now();
        this.players.forEach(p=>{
          if(p){
            if(now - p.lastCoinDrop > 1500){
              p.lastCoinDrop = now;
              p.coins += 5;
            }
            p.quirkCost=0;
            p.zapCost=0;
            p.munchCost=0;
            p.army.forEach(a=>{
              if(_G.COST_QUIRK===a.costValue) p.quirkCost+=a.costValue;
              if(_G.COST_ZAP===a.costValue) p.zapCost+=a.costValue;
              if(_G.COST_MUNCH===a.costValue) p.munchCost+=a.costValue;
            });
            p.totalCost=p.quirkCost+p.zapCost+p.munchCost;
          }
        });
      },
      postUpdate(){
      }
    });
  }

  function setup(Mojo){
    window["io.czlab.mwars.players"](Mojo);
    window["io.czlab.mwars.models"](Mojo);
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("level1");
  }

  window.addEventListener("load", ()=>{
    MojoH5({
      assetFiles:["bg.png","tiles.png","images/tiles.json",
        "attack.wav","bigHit.wav","boom.wav","defend.wav",
        "mass.wav","pew.wav","pew2.wav","smallHit.wav","spawn.wav"],
      arena: {width:640,height:360},
      scaleToWindow: "max",
      start:setup
    })
  });

})(this);


