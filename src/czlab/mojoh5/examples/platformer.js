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
    let _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input, _2d=Mojo["2d"],_T=Mojo.Tiles;
    let {ute:_,is,EventBus}=Mojo;

    function Player(scene){
      let p= _S.frame("sprites.png",30,30,0,0);
      p.m5.uuid="player";
      p.m5.speed=200;
      p.m5.gravity[1]=200;
      p.x=410;
      p.y=90;
      _S.addMixin(p,"2d","platformer");
      p.m5.step=function(dt){
        p["2d"].motion(dt);
        p["platformer"].motion(dt);
      };
      let tiles=scene.world.tiles;
      p.m5.collide=function(){
        for(let i=0;i<tiles.length;++i){
          Mojo["2d"].hit(p,tiles[i]);
        }
      }
      return scene.world.addChild(p);
    }
    function Tower(){
      let t= _S.frame("sprites.png",32,32,0,64);
      t.m5.uuid="tower";
      return t;
    }
    function Enemy(scene,id,x,y){
      let e= _S.frame("sprites.png",30,24,0,34);
      e.m5.uuid=id;
      e.m5.gravity[1]=60;
      scene.world.badies.push(e);
      let tiles=scene.world.tiles;
      e.m5.collide=function(){
        for(let i=0;i<tiles.length;++i){
          let m=_2d.hit(e,tiles[i]);
          if(m) {
            break;
          }
        }
        for(let b,i=0;i<scene.world.badies.length;++i){
          b=scene.world.badies[i];
          if(b===e)continue;
          _2d.collide(e,b);
        }
        _2d.hit(e,scene.player);
      };
      e.m5.speed=80;
      e.m5.vel[0]=80;
      e.x=x;
      e.y=y;
      e.m5.step=function(dt){
        e["2d"].motion(dt);
      };
      scene.world.addChild(e);
      _S.addMixin(e,"2d", "aiBounce");
      e.m5.onbump=function(col){
        if(col.B.m5.uuid=="player"){
          _S.remove(col.B);
          console.log("die!!!");
          //_Z.runScene("endGame",{msg: "You Died"});
        }
      };
      e.m5.onbtop=function(col){
        if(col.B.m5.uuid=="player"){
          _S.remove(e);
          _.disj(scene.world.badies,e);
          col.B.m5.vel[1] = -300;
        }
      };
      EventBus.sub(["bump.top",e],e.m5.onbtop);
      EventBus.sub(["bump.left,bump.right,bump.bottom",e], e.m5.onbump);
    }

    _Z.defScene("bg",{
      setup(){
        let w= this.wall=_S.tilingSprite("background-wall.png");
        _S.setSize(w,Mojo.width,Mojo.height);
        this.insert(w);
      }
    });

    _Z.defScene("level1",{
      setup(){
        let level= Mojo.resource("platformer.json").data;
        let world= this.world=_T.mockTiledWorld(32,32, level[0].length, level.length);
        let layers = world.tiled.layers = level;
        this.world.tiles=[];
        this.world.badies=[];
        this.insert(world);
        for(let layer,y=0;y<layers.length;++y){
          layer=layers[y];
          for(let gid,x=0;x<layer.length;++x){
            gid=layer[x];
            if(gid !== 0){
              let sprite;
              let px = x * world.tiled.tileW;
              let py = y * world.tiled.tileH;
              switch(gid){
              case 1:
                sprite = _S.frame("tiles.png",32,32,32,0);
              break;
              case 2:
                sprite = _S.frame("tiles.png", 32,32,64,0);
              break;
              case 3:
                sprite= Tower();
              break;
              }
              if(sprite){
                sprite.x = px;
                sprite.y = py;
                this.world.tiles.push(sprite);
                world.addChild(sprite);
              }
            }
          }
        }
        this.camera=_2d.worldCamera(this.world,this.world.tiled.tiledWidth,this.world.tiled.tiledHeight);
        let player = this.player= Player(this);

        Enemy(this,"e1",26*32,100);
        Enemy(this,"e2", 28*32,100);

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        this.camera.follow(this.player);
      }
    });

    _Z.defScene("endGame",()=>{
    });

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["sprites.png", "platformer.json", "tiles.png", "background-wall.png"],
      arena: {},
      scaleToWindow: "max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("bg");
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


