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
    let _Z=Mojo.Scenes,
        _S=Mojo.Sprites,
      _T=Mojo.Tiles,
        _I=Mojo.Input,_2d=Mojo["2d"];
    let {ute:_,is,EventBus}=Mojo;
    let _tilePos = (col,row) => { return [col*32, row*32] };

    _S.defMixin("towerManControls", function(e){
      e.m5.direction=Mojo.UP;
      e.m5.speed=100;
      let self={
        step(dt){
          if(e.m5.vel[0] > 0){
            e.angle = 90
          }else if(e.m5.vel[0] < 0){
            e.angle = -90
          }else if(e.m5.vel[1] > 0){
            e.angle = 180
          }else if(e.m5.vel[1] < 0){
            e.angle = 0
          }
          // grab a direction from the input
          e.m5.direction = _I.keyDown(_I.keyLEFT)  ? Mojo.LEFT :
                           _I.keyDown(_I.keyRIGHT) ? Mojo.RIGHT :
                           _I.keyDown(_I.keyUP) ? Mojo.UP :
                           _I.keyDown(_I.keyDOWN) ? Mojo.DOWN : e.m5.direction;
          switch(e.m5.direction) {
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      return self;
    });

    _S.defMixin("enemyControls", function(e){
      e.m5.direction=Mojo.LEFT;
      e.m5.speed=100;
      e.m5.switchPercent=2;
      function tryDirection(){
        let from = e.m5.direction;
        if(e.m5.vel[1] !== 0 && e.m5.vel[0]=== 0){
          e.m5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
        }else if(e.m5.vel[0] !== 0 && e.m5.vel[1]=== 0){
          e.m5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
        }
      }
      function changeDirection(col){
        if(e.m5.vel[0]=== 0 && e.m5.vel[1]=== 0){
          let c=col.overlapN;
          if(c[1] !== 0){
            e.m5.direction = Math.random() < 0.5 ? Mojo.LEFT : Mojo.RIGHT;
          }else if(c[0] !== 0){
            e.m5.direction = Math.random() < 0.5 ? Mojo.UP : Mojo.DOWN;
          }
        }
      }
      let self={
        step(dt){
          if(Math.random() < e.m5.switchPercent/100){
            tryDirection()
          }
          switch(e.m5.direction){
            case Mojo.LEFT: e.m5.vel[0] = -e.m5.speed; break;
            case Mojo.RIGHT: e.m5.vel[0] = e.m5.speed; break;
            case Mojo.UP:   e.m5.vel[1] = -e.m5.speed; break;
            case Mojo.DOWN: e.m5.vel[1] = e.m5.speed; break;
          }
        }
      };
      EventBus.sub(["hit",e],changeDirection);
      return self;
    });

    function Tower(scene){
      let t=_S.frame("sprites.png",32,32,0,64);
      t.m5.sensor=true;
      t.m5.onSensor=()=>{
        _.disj(scene.world.tiles,t);
        _S.remove(t);
      };
      EventBus.sub(["2d.sensor",t],"onSensor",t.m5);
      return t;
    }

    function Dot(scene){
      let s= _S.frame("sprites.png",32,32,0,96);
      scene.dotCount += 1;
      s.m5.sensor=true;
      s.m5.onSensor=()=>{
        _.disj(scene.world.tiles,s);
        _S.remove(s);
        scene.dotCount -= 1;
        if(scene.dotCount===0){
        }
      };
      EventBus.sub(["2d.sensor",s],"onSensor",s.m5);
      return s;
    }

    function Player(scene,pos){
      let p= _S.frame("sprites.png",32,32,0,0);
      p.anchor.set(0.5);
      p.m5.uuid="player";
      p.m5.speed= 150;
      p.m5.vel[0]=150;
      p.m5.vel[1]=150;
      p.x=pos[0]+p.width/2;
      p.y=pos[1]+p.height/2;
      _S.addMixin(p,"2d","towerManControls");
      p.m5.collide=function(){
        for(let i=0;i<scene.world.wall.length;++i){
          _2d.hit(p, scene.world.wall[i])
        }
        for(let i=0;i<scene.world.tiles.length;++i){
          _2d.hit(p, scene.world.tiles[i])
        }
      };
      p.m5.step=function(dt){
        p["2d"].motion(dt);
        p["towerManControls"].step(dt);
      };
      return p;
    }

    function Enemy(scene,id,pos){
      let s= _S.frame("sprites.png",32,32,0,32);
      s.anchor.set(0.5);
      s.m5.speed= 150;
      s.m5.vel[0]=150;
      s.m5.vel[1]=150;
      s.m5.uuid=id;
      s.x=pos[0]+s.width/2;
      s.y=pos[1]+s.height/2;
      _S.addMixin(s,"2d","enemyControls");
      s.m5.boom=function(col){
        if(col.B.m5.uuid=="player"){
          Mojo.pause();
          //game over
        }
      };
      s.m5.collide=function(){
        for(let i=0;i<scene.world.wall.length;++i){
          _2d.hit(s, scene.world.wall[i])
        }
        _2d.hit(s,scene.player);
      };
      s.m5.step=function(dt){
        s["2d"].motion(dt);
        s["enemyControls"].step(dt);
      };
      EventBus.sub(["bump",s],"boom",s.m5);
      return s;
    }

    _Z.defScene("level1",{
      setup(){
        let level= Mojo.resource("tower_man.json").data;
        let world= this.world = _T.mockTiledWorld(32,32, level[0].length, level.length);
        let tiled= world.tiled;
        world.tiles=[];
        world.wall=[];
        this.insert(world);
        this.dotCount=0;
        let layers = tiled.layers = level;
        for(let layer,y=0;y<layers.length;++y){
          layer=layers[y];
          for(let s,px,py,x=0;x<layer.length;++x){
            px = x * tiled.tileW+16;
            py = y * tiled.tileH+16;
            switch(layer[x]){
              case 0:
                s=Dot(this);
                this.world.tiles.push(s);
              break;
              case 1:
                s=_S.frame("tiles.png",32,32,32,0);
                this.world.wall.push(s);
              break;
              case 2:
                s=Tower(this);
                this.world.tiles.push(s);
              break;
              default: s=null;
            }
            if(s)
              world.addChild(_S.centerAnchor(_S.setXY(s,px,py)))
          }
        }
        let player=this.player=Player(this,_tilePos(10,7));
        let e1=Enemy(this,"e1",_tilePos(10,4));
        let e2=Enemy(this,"e2",_tilePos(16,10));
        let e3=Enemy(this,"e3",_tilePos(5,10));
        world.addChild(player);
        world.addChild(e1);
        world.addChild(e2);
        world.addChild(e3);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "tower_man.json","tiles.png"],
      arena: {width:640,height:480},
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


