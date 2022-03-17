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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Arcade:_2d,
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_,is}=Mojo;
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const C_ORANGE=_S.color("#f4d52b"),
      C_TITLE=_S.color("#e4ea1c"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          W2=Mojo.width/2,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Zario",TITLE_FONT,120*K);
            _S.tint(s,C_TITLE);
            _V.set(s,W2,Mojo.height*0.3);
            return self.insert(_S.anchorXY(s,0.5));
          },
          doNext(s,t){
            s=_S.bmpText(Mojo.clickPlayMsg(),UI_FONT,64*K);
            t=_F.throb(s,0.747,0.747);
            function cb(){
              _I.off(["single.tap"],cb);
              _F.remove(t);
              _S.tint(s,C_ORANGE);
              playClick();
              _.delay(CLICK_DELAY,()=> _Z.runEx("PlayGame"));
            }
            _I.on(["single.tap"],cb);
            _V.set(s,W2,Mojo.height*0.7);
            return self.insert(_S.anchorXY(s,0.5));
          }
        });
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    let MysteryCount=0;
    const Mystery={
      s(){},
      c(scene,s,ts,ps,os){
        s.m5.uuid= `Box#${_.nextId()}`;
        s.m5.type=E_ITEM;
        s.g.score=0;
        s.m5.onSensor=(player)=>{
          let [tx,ty]= scene.getTile(s);
          Mojo.sound("coin.mp3").play();
          _S.remove(s);
          if(++MysteryCount==4){
            let p=scene.getNamedItem("red_key")[0];
            p=scene.getChildById(p.uuid);
            _S.show(p);
            scene.engrid(p);
          }
        };
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Heart={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= `Heart#${_.nextId()}`;
        s.m5.type=E_ITEM;
        s.m5.sensor=true;
        s.g.score=500;
        s.m5.onSensor=(col)=>{
          if(os.name=="red_heart" || os.name=="white_heart"){
            Mojo.sound("coin.mp3").play();
            _G.score += s.g.score;
            col.g[os.name]=true;
            _S.remove(s);
            Mojo.off(...sigs);
          }
          if(os.name=="white_heart" && col.g["red_heart"] && !_G.gameOver){
            _G.gameOver=true;
            _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{msg:"You Win!"}))
          }
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Key={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= `Key#${_.nextId()}`;
        s.m5.type=E_ITEM;
        s.g.score=250;
        s.m5.sensor=true;
        s.m5.onSensor=(col)=>{
          Mojo.sound("coin.mp3").play();
          _G.score += s.g.score;
          col.g[os.name]=true;
          _S.remove(s);
          Mojo.off(...sigs);
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Coin={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= `Coin#${_.nextId()}`;
        s.m5.type=E_ITEM;
        s.m5.sensor=true;
        s.g.score=10;
        s.m5.onSensor=(col)=>{
          Mojo.sound("coin.mp3").play();
          _G.score += s.g.score;
          _S.remove(s);
          Mojo.off(...sigs);
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Spike={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= `Spike#${_.nextId()}`;
        s.m5.type=E_SPIKE;
        s.m5.sensor=true;
        s.m5.onSensor=(col)=>{
          if(!s.m5.dead){
            s.m5.dead=true;
            //_S.remove(s);
            Mojo.off(...sigs);
            _G.gameOver=true;
            _.delay(CLICK_DELAY,()=> _Z.modal("EndGame"));
          }
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Door={
      s(){},
      c(scene,s,ts,ps,os){
        let sigs=[["2d.sensor",s],"onSensor",s.m5];
        s.m5.uuid= os.door;
        s.m5.type=E_DOOR;
        s.m5.sensor=true;
        s.y += scene.tiled.new_tileH;
        s.y -= s.height;
        s.m5.onSensor=(col)=>{
          if(col.g.hyper && _I.keyDown(_I.DOWN)){
            if((os.door.startsWith("red") && col.g["red_key"]) ||
               (os.door.startsWith("blue") && col.g["blue_key"])){
              col.g.hyper=false;
              let dx=scene.getChildById(os.linked);
              col.x=dx.x;
              col.y=dx.y;
            }
          }
        };
        Mojo.on(...sigs);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _objFactory={
      Mystery,Coin,Door,Key,Spike,Heart
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const PStates={ walk_right: [1,3], jump_right: 5, crouch: 4 };
    const E_PLAYER=1,
      E_ITEM=2,
      E_DOOR=4,
      E_SPIKE=8,
      E_FLY=16,
      E_SLIME=32,
      E_ENEMY=64;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Player(scene){
      let s=_S.sprite(_S.frames("pinkio.png", 64,78));
      let P=scene.getNamedItem("startpos")[0];
      let {tileW,tileH}=scene.tiled;
      let _mode=null;
      let _p=scene.getChildById(P.uuid);
      s.m5.cmask=E_ENEMY|E_ITEM|E_DOOR|E_SPIKE;
      s.m5.uuid="player";
      s.m5.type=E_PLAYER;
      s.g.hyper=true;
      _V.set(s, P.column*tileW+s.width/2,P.row*tileH+tileH-s.height/2);
      _V.set(s.m5.gravity,0,333);
      s.m5.strength= 100;
      s.m5.speed= 300;
      s.m5.score= 0;
      _S.anchorXY(s,0.5);
      Mojo.addMixin(s,"arcade",[_2d.Platformer]);
      s.m5.showFrame(0);
      s.m5.heading= Mojo.RIGHT;
      _S.remove(_p);
      //controls
      let leftArrow = _I.keybd(_I.LEFT, ()=>{
        if(s.scale.x>0) s.m5.flip="x";
        if(_mode===null)
          s.m5.playFrames(PStates.walk_right);
      }, ()=>{
          s.m5.showFrame(0);
          _mode=null;
      });
      let rightArrow = _I.keybd(_I.RIGHT, ()=>{
        if(s.scale.x<0) s.m5.flip="x";
        if(_mode===null)
          s.m5.playFrames(PStates.walk_right);
      }, ()=>{
          s.m5.showFrame(0);
          _mode=null;
      });
      let upArrow = _I.keybd(_I.UP, ()=>{
        s.m5.showFrame(PStates.jump_right);
        _mode=PStates.jump_right;
      }, ()=>{
          _mode=null;
      });
      let downArrow = _I.keybd(_I.DOWN, ()=>{
        s.m5.showFrame(PStates.crouch);
        _mode=PStates.crouch;
      }, ()=>{
        s.m5.showFrame(0);
        s.g.hyper=true;
        _mode=null;
      });

      let signals=[[["bump.top",s],"breakTile"],
                   //[["hit",s],"onHit"],
                   [["jump",s]],
                   [["jumped",s]],
                   [["down",Mojo.input],"checkDoor",s]];
      s.m5.getContactPoints=function(){
        return _mode==PStates.crouch ? [[32,39],[32,-28],[-32,-28],[-32,39]]
                                     : [[32,39],[32,-39],[-32,-39],[-32,39]]
      };
      s.jumped=function(col){ s.m5.playedJump = false; };
      s.checkDoor=function(){ s.m5.checkDoor = true; };
      s.resetLevel=function(){ };
      s.jump=function(col){
        if(!s.m5.playedJump){
          Mojo.sound("jump.mp3").play();
          s.m5.playedJump = true;
        }
      };
      s.breakTile=(col)=>{
        let t=8,gid=col.B.tiled.gid;
        if(gid==33){
          col.B.m5.onSensor(s);
        }
      };
      s.m5.tick=function(dt){
        s.arcade.onTick(dt);
        if(s.m5.vel[0]==0 && s.m5.vel[1]==0){
          if(!_I.keyDown(_I.DOWN)) s.m5.showFrame(1);
        }
      };

      signals.forEach(s=>Mojo.on(...s));
      return _G.player=s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function Enemy(scene,s){
      let signals=[[["bump.top",s],"onKill",s.m5],
                   [["hit",s],"onHit",s.m5]];
      Mojo.addMixin(s,"arcade",[_2d.Patrol,true,false]);
      _S.anchorXY(s,0.5);

      s.m5.heading=Mojo.LEFT;
      s.m5.type=E_ENEMY;
      s.m5.speed= 150;
      s.m5.vel[0]= -150;
      s.g.score=50;
      s.m5.deadTimer=0;

      s.m5.onKill=(col)=>{
        if(col.B.m5.uuid=="player"){
          Mojo.sound("coin.mp3").play();
          _G.score += s.g.score;
          _V.set(s.m5.vel,0,0);
          s.m5.dead=true;
          col.B.m5.vel[1] = -300;
          s.m5.deadTimer = 0;
        }
      };

      s.m5.onHit=function(col){
        if(!s.m5.dead && col.B.m5.uuid=="player"){
          Mojo.sound("hit.mp3").play();
          _G.gameOver=true;
          _.delay(CLICK_DELAY,()=>_Z.modal("EndGame"));
        }
      };

      s.m5.tick=(dt)=>{
        s.arcade && s.arcade.onTick(dt);
        if(s.m5.dead){
          s.arcade && s.arcade.Patrol.dispose();
          s.arcade=UNDEF;
          if(++s.m5.deadTimer > 25){ _S.remove(s) }
        }
      };
      signals.forEach(s=>Mojo.on(...s));
      s.m5.playFrames([0,1]);
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function makeEnemies(scene){
      let x,y,s,
          {tileW,tileH}=scene.tiled;
      scene.getNamedItem("enemy").forEach((e,i)=>{
        s= _S.spriteFrom(`${e.kind}0.png`,`${e.kind}1.png`);
        x=e.column*tileW+tileW/2;
        y=e.row*tileH+tileH-s.height/2;
        _S.remove(scene.getChildById(e.uuid));
        scene.insert(Enemy(scene,_V.set(s,x,y)),true);
      });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let os={fontName:UI_FONT,
                fontSize: 72*Mojo.getScaleFactor()},
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(options.msg||"You Lose!", os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=> _Z.runEx("PlayGame");
        s6.m5.press=()=> _Z.runEx("Splash");
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let K=Mojo.getScaleFactor();
        this.insert(_S.fillMax(_S.sprite("bg.jpg")))
        _Z.run("PlayGame2");
        _Z.run("HUD");
        _Z.run("AudioIcon",{
          xScale:1.2*K, yScale:1.2*K,
          xOffset: -10*K, yOffset:0
        });
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let K= Mojo.getScaleFactor(),
          s=_S.bmpText("0",UI_FONT, 64*K);
        s.tint=_S.SomeColors.white;
        this.g.scoreText= this.insert(s);
      },
      postUpdate(dt){
        this.g.scoreText.text= `${_G.score}`;
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame2",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        _G.score=0;
        _G.gameOver=false;
        this.insert(Player(this),true);
        makeEnemies(this);
        Mojo.addMixin(this,"camera2d",this.tiled.tiledWidth,this.tiled.tiledHeight,Mojo.canvas);
      },
      postUpdate(dt){
        if(_G.gameOver){
          this.m5.dead=true;
        }else{
          this["camera2d"].follow(_G.player);
        }
      }
    },{sgridX:128,sgridY:128,centerStage:true,
      tiled:{name: "map.json",factory:_objFactory}
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["map.json","hit.mp3","click.mp3","coin.mp3","jump.mp3","bounce.mp3",
                 "pinkio.png","platformPack_tilesheet.png", "bg.jpg",
                 "audioOn.png","audioOff.png",
                 "bee0.png","bee1.png","worm0.png","worm1.png","snail0.png","snail1.png"],
    arena: {width:1860, height:1050,scale:1},
    scaleToWindow:"max",
    scaleFit:"x",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }
  }));

})(this);



