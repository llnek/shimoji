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
           Tiles:_T,
           FX:_F,
           Input:_I,
           Arcade:_2d,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const E_PLAYER=1,
      E_ENEMY=2,
      E_COIN=4,
      E_KEY=8;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#e4ea1c"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax( _S.rect(Mojo.width,Mojo.height,_S.color("#2cc46c"))));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    Mojo.mixin("enemyAI", function(e){
      e.m5.heading=Mojo.LEFT;
      e.m5.switchPercent=2;
      function tryDir(){
        if(e.m5.vel[1] != 0 && e.m5.vel[0]== 0){
          e.m5.heading = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }else if(e.m5.vel[0] != 0 && e.m5.vel[1]== 0){
          e.m5.heading = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDir(col){
        if(e.m5.vel[0]== 0 && e.m5.vel[1]== 0){
          let c=col.overlapN;
          if(c[1] != 0){
            e.m5.heading = _.rand() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(c[0] != 0){
            e.m5.heading = _.rand() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      let self={
        dispose(){
          Mojo.off(["hit",e],changeDir)
        },
        onTick(dt){
          (_.rand() < e.m5.switchPercent/100) && tryDir();
          switch(e.m5.heading){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      Mojo.on(["hit",e],changeDir);
      return self;
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Power={
      s(){},
      c(scene,t,ts,ps){
        t.m5.type=E_KEY;
        t.m5.sensor=true;
        t.m5.onSensor=(colObj)=>{
          scene.remove(t);
        };
        t.m5.dispose=()=>{
          Mojo.off(t.m5)
        };
        Mojo.on(["2d.sensor",t],"onSensor",t.m5);
        return t;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CoinLayer(scene,tl){
      let c= tl.data,
        h=_S.sprite("coins.png").height,
        t=_S.frames("coins.png",h,h)[1],
        {new_tileW,new_tileH,tilesInX,tilesInY}=scene.tiled;
      for(let y=0;y<tilesInY;++y)
      for(let s,x=0;x<tilesInX;++x){
        if(634==c[y*tilesInX+x]){
          s=_S.sprite(t);
          _S.anchorXY(_S.scaleBy(s,0.5,0.5),0.5);
          s.y=new_tileH*y+new_tileH/2;
          s.x=new_tileW*x+new_tileW/2;
          scene.insert(cfgCoin(scene,s),true);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function cfgCoin(scene,s){
      scene.g.dotCount = _.nor(scene.g.dotCount,0);
      scene.g.dotCount += 1;
      s.m5.uuid=`coin#${scene.g.dotCount}`;
      s.m5.type=E_COIN;
      s.m5.sensor=true;
      s.m5.onSensor=(colObj)=>{
        scene.g.dotCount -= 1;
        _S.remove(s);
        if(scene.g.dotCount==0){
          scene.m5.dead=true;
          _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{msg:"You Win!"}));
        }
      };
      s.m5.dispose=()=> Mojo.off(s.m5);
      Mojo.on(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Player={
      s(scene){
        return _S.animation("pac.png",64,64)
      },
      c(scene,s,ts,ps,os){
        _S.anchorXY(s,0.5);
        s.m5.type=E_PLAYER;
        s.m5.cmask=E_KEY | E_COIN;
        s.x += _M.ndiv(s.width,2);
        s.y += _M.ndiv(s.height,2);
        s.m5.uuid="player";
        s.m5.speed= 200 * scene.getScaleFactor();
        _V.set(s.m5.vel,s.m5.speed, 0);
        s.m5.tick=(dt)=> s["arcade"].onTick(dt);
        s.m5.heading=Mojo.RIGHT;
        _G.player=s;
        let frames={}
        frames[Mojo.RIGHT]=0;
        frames[Mojo.UP]=1;
        frames[Mojo.LEFT]=2;
        frames[Mojo.DOWN]=3;
        return Mojo.addMixin(s,"arcade",[_2d.MazeRunner,frames]);
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Ghost={
      s(){},
      c(scene,s,ts,ps,os){
        s.m5.uuid=`e#${_.nextId()}`;
        s.m5.type=E_ENEMY;
        s.m5.cmask=E_PLAYER;
        s.x = os.column * s.width+ _M.ndiv(s.width,2);
        s.y = os.row * s.height+ _M.ndiv(s.height,2);
        _S.anchorXY(s,0.5);
        s.m5.speed= 200 * scene.getScaleFactor();
        _V.set(s.m5.vel,s.m5.speed, s.m5.speed);
        Mojo.addMixin(s,"arcade");
        Mojo.addMixin(s,"enemyAI");
        s.m5.boom=function(col){
          if(col.B.m5.uuid=="player"){
            scene.m5.dead=true;
            _.delay(CLICK_DELAY,()=> _Z.modal("EndGame"));
          }
        };
        s.m5.dispose=()=> Mojo.off(["bump",s],"boom",s.m5);
        s.m5.tick=function(dt){
          s["arcade"].onTick(dt);
          s["enemyAI"].onTick(dt);
        };
        Mojo.on(["bump",s],"boom",s.m5);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Splash",{
      setup(){
        let self=this,
          W2=Mojo.width/2,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          doTitle(s){
            s=_S.bmpText("Chomp",TITLE_FONT,120*K);
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
    const _objFactory={
      Player, Ghost, CoinLayer, Power
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("EndGame",{
      setup(options){
        let os={fontName:UI_FONT,
                fontSize: 72*Mojo.getScaleFactor()},
          snd="game_over.mp3",
          space=()=> _S.opacity(_S.bmpText("I",os),0),
          s1=_S.bmpText("Game Over", os),
          s2=_S.bmpText(options.msg||"You Lose!", os),
          s4=_I.mkBtn(_S.bmpText("Play Again?",os)),
          s5=_S.bmpText(" or ",os),
          s6=_I.mkBtn(_S.bmpText("Quit",os));
        s4.m5.press=()=>_Z.runEx("PlayGame");
        s6.m5.press=()=>_Z.runEx("Splash");
        if(options.msg) snd="game_win.mp3";
        Mojo.sound(snd).play();
        options.bg="#999999";
        this.insert(_Z.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let W=Mojo.width,
          H=Mojo.height,
          K=Mojo.getScaleFactor();
        doBackDrop(this)
        _Z.run("PlayGame2");
        _Z.run("HotKeys",{
          fontSize: 48*K,
          radius: 42*K,
          alpha:0.5,
          cb(obj){
            _V.set(obj.right,W-obj.right.width,H-obj.right.height);
            _S.pinLeft(obj.right,obj.left,obj.right.width/4);
            _V.set(obj.up,obj.up.width,H-obj.up.height);
            _S.pinRight(obj.up,obj.down,obj.up.width/4);
            return obj;
          }
        });
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame2",{
      setup(options){
      }
    },{sgridX:128,sgridY:128,centerStage:true,
       tiled:{name: "chomp.json",factory:_objFactory}});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("Ctrl",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initHotspots(){
            let cfg={fontName:UI_FONT,fontSize:48*K},
              alpha=0.2,grey=_S.SomeColors.grey,
              L,U,R,D,offX, offY, fw=132*K,fh=42*K,lw=4*K;
            //////
            D= _S.circle(fh,grey,grey,lw);
            D.addChild(_S.anchorXY(_S.bmpText("-",cfg),0.5));
            _V.set(D, _G.arena.x1-D.width, _G.arena.y2-D.height/2);
            self.insert(_S.opacity(_I.makeHotspot(D),alpha));
            //////
            U= _S.circle(fh,grey,grey,lw);
            U.addChild(_S.anchorXY(_S.bmpText("+",cfg),0.5));
            _S.pinAbove(D,U,D.height/4);
            self.insert(_S.opacity(_I.makeHotspot(U),alpha));
            //////lateral movements
            R= _S.circle(fh,grey,grey,lw);
            R.addChild(_S.anchorXY(_S.bmpText(">",cfg),0.5));
            _V.set(R, _G.arena.x2+R.width, _G.arena.y2 - R.height/2);
            self.insert(_S.opacity(_I.makeHotspot(R),alpha));
            /////
            L= _S.circle(fh,grey,grey,lw);
            L.addChild(_S.anchorXY(_S.bmpText("<",cfg),0.5));
            _S.pinAbove(R,L,R.height/4);
            self.insert(_S.opacity(_I.makeHotspot(L),alpha));
            //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
            R.m5.touch=(o,t)=> t?_I.setKeyOn(_I.RIGHT):_I.setKeyOff(_I.RIGHT);
            L.m5.touch=(o,t)=> t?_I.setKeyOn(_I.LEFT):_I.setKeyOff(_I.LEFT);
            U.m5.touch=(o,t)=> t?_I.setKeyOn(_I.UP):_I.setKeyOff(_I.UP);
            D.m5.touch=(o,t)=> t?_I.setKeyOn(_I.DOWN):_I.setKeyOff(_I.DOWN);
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initHotspots();
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("HUD",{
      setup(){
        let s= Mojo.Touch.joystick({
          onChange(dir){
            if(Mojo.sideRight(dir)){
              _G.player.m5.heading=Mojo.RIGHT;
              //console.log(`dir===right`);
            }
            if(Mojo.sideLeft(dir)){
              _G.player.m5.heading=Mojo.LEFT;
              //console.log(`dir===left`);
            }
            if(Mojo.sideTop(dir)){
              _G.player.m5.heading=Mojo.UP;
              //console.log(`dir===up`);
            }
            if(Mojo.sideBottom(dir)){
              _G.player.m5.heading=Mojo.DOWN;
              //console.log(`dir===down`);
            }
          }
        });
        this.insert(s);
      }
    });
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["ghosts.png", "chomp.json","pac.png", "click.mp3","coins.png",
                 "game_win.mp3","game_over.mp3",
                 "platformPack_tilesheet.png","towerDefense_tilesheet.png","RPGpack_sheet.png"],
    arena: {width:1280,height:1092},
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }

  }));

})(this);


