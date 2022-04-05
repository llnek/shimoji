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
           Ute2D:_U,
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
    const SplashCfg= {
      title:"Chomp!",
      clickSnd:"click.mp3",
      action: {name:"PlayGame"}
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax( _S.rect(Mojo.width,Mojo.height,_S.color("#2cc46c"))));
    const DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function enemyAI(e){
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
      function cleanup(){
        Mojo.off(["hit",e],changeDir)
      }

      Mojo.on(["hit",e],changeDir);
      Mojo.on(["post.remove",e],cleanup);

      return function(dt){
        (_.rand() < e.m5.switchPercent/100) && tryDir();
        switch(e.m5.heading){
          case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
          case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
          case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
          case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
        }
      }
    }

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
        Mojo.on(["bump.sensor",t],"onSensor",t.m5);
        return t;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CoinLayer(scene,tl){
      function cfgCoin(s){
        scene.g.dotCount = _.nor(scene.g.dotCount,0);
        scene.g.dotCount += 1;
        s.m5.uuid=`coin#${scene.g.dotCount}`;
        s.m5.type=E_COIN;
        s.m5.sensor=true;
        s.m5.onSensor=(colObj)=>{
          scene.g.dotCount -= 1;
          _S.remove(s);
          if(scene.g.dotCount==0){
            _S.die(scene);
            _.delay(CLICK_DELAY,()=> _Z.modal("EndGame",{
              fontSize:64*Mojo.getScaleFactor(),
              replay:{name:"PlayGame"},
              quit:{name:"Splash", cfg:SplashCfg},
              msg:"You Win!",
              winner:1
            }));
          }
        };
        s.m5.dispose=()=> Mojo.off(s.m5);
        Mojo.on(["bump.sensor",s],"onSensor",s.m5);
        return s;
      }
      ////
      let
        c= tl.data,
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
          scene.insert(cfgCoin(s),true);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const Player={
      s(scene){
        return _S.animation("pac.png",64,64)
      },
      c(scene,s,ts,ps,os){
        let frames={}
        frames[Mojo.RIGHT]=0;
        frames[Mojo.UP]=1;
        frames[Mojo.LEFT]=2;
        frames[Mojo.DOWN]=3;
        _S.anchorXY(s,0.5);
        s.m5.type=E_PLAYER;
        s.m5.cmask=E_KEY | E_COIN;
        s.x += _M.ndiv(s.width,2);
        s.y += _M.ndiv(s.height,2);
        s.m5.uuid="player";
        s.m5.speed= 200 * scene.getScaleFactor();
        _V.set(s.m5.vel,s.m5.speed, 0);
        s.g.meander=_U.Meander(s);
        s.g.maze=_U.MazeRunner(s,frames);
        s.m5.tick=(dt)=>{
          s.g.maze(dt,s.g.meander(dt))
        }
        s.m5.heading=Mojo.RIGHT;
        _G.player=s;
        return s;
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
        s.g.meander=_U.Meander(s);
        s.g.ai=enemyAI(s);
        s.m5.boom=function(col){
          if(col.B.m5.uuid=="player"){
            _S.die(scene);
            _.delay(DELAY,()=> _Z.modal("EndGame",{

              fontSize:64*Mojo.getScaleFactor(),
              replay:{name:"PlayGame"},
              quit:{name:"Splash", cfg:SplashCfg},
              msg:"You Lose!",
              winner:0

            }));
          }
        };
        s.m5.dispose=()=> Mojo.off(["bump.*",s],"boom",s.m5);
        s.m5.tick=function(dt){
          s.g.ai(dt,s.g.meander(dt));
        };
        Mojo.on(["bump.*",s],"boom",s.m5);
        return s;
      }
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _objFactory={
      Player, Ghost, CoinLayer, Power
    };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        let
          W=Mojo.width,
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
    _Z.scene("XXXHUD",{
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

    _Z.run("Splash",SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["ghosts.png", "chomp.json","pac.png", "click.mp3","coins.png",
                 "game_win.mp3","game_over.mp3",
                 "platformPack_tilesheet.png","towerDefense_tilesheet.png","RPGpack_sheet.png"],
    arena: {width:1344,height:840},
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);


