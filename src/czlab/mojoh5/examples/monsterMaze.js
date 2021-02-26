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
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,G=Mojo.Game,T=Mojo.Tiles,_2d=Mojo["2d"];
    const {ute:_,is,EventBus}=Mojo;

    Z.defScene("level1", {
      setup(){
        let world= this.world = T.tiledWorld("monsterMaze.json");
        let wt=world.tiled;
        this.insert(world);

        let alien= this.alien=T.getNamedItem(T.getTileLayer(world,"playerLayer"),"alien")[0];
        alien.m5.direction = Infinity;

        this.leftArrow = I.keybd(I.keyLEFT, ()=>alien.m5.direction =Mojo.LEFT);
        this.upArrow = I.keybd(I.keyUP, ()=>alien.m5.direction = Mojo.UP);
        this.rightArrow = I.keybd(I.keyRIGHT, ()=>alien.m5.direction = Mojo.RIGHT);
        this.downArrow = I.keybd(I.keyDOWN, ()=>alien.m5.direction = Mojo.DOWN);

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let _isAtIntersection=s=>{
          return Math.floor(s.x) % this.world.tiled.tileW === 0 &&
                 Math.floor(s.y) % this.world.tiled.tileH === 0;
        }
        if(_isAtIntersection(this.alien)){
          switch(this.alien.m5.direction){
          case Mojo.UP:
            this.alien.m5.vel[1] = -4;
            this.alien.m5.vel[0] = 0;
          break;
          case Mojo.DOWN:
            this.alien.m5.vel[1] = 4;
            this.alien.m5.vel[0] = 0;
          break;
          case Mojo.LEFT:
            this.alien.m5.vel[0] = -4;
            this.alien.m5.vel[1] = 0;
          break;
          case Mojo.RIGHT:
            this.alien.m5.vel[0] = 4;
            this.alien.m5.vel[1] = 0;
          break;
          case Mojo.NONE:
            this.alien.m5.vel[0] = 0;
            this.alien.m5.vel[1] = 0;
          break;
          }
        }
        S.move(this.alien);
        let walls= T.getTileLayer(this.world,"wallLayer");
        let alienVsFloor = T.hitTestTile(this.alien, walls.tiled.data, 0, this.world, Mojo.EVERY);

        if(!alienVsFloor.hit){
          //To prevent the alien from moving, subtract its velocity from its position
          this.alien.x -= this.alien.m5.vel[0];
          this.alien.y -= this.alien.m5.vel[1];
          this.alien.m5.vel[0] = 0;
          this.alien.m5.vel[1] = 0;
        }

        let monsters=T.getTileLayer(this.world,"monsterLayer");
        let alienVsBomb = T.hitTestTile(this.alien, monsters.tiled.data, 3, this.world, Mojo.EVERY);
        if (alienVsBomb.hit) {
          let ms= T.getNamedItem(monsters,"monster");
          for(let pos,m,i=0;i<ms.length;++i){
            m=ms[i];
            pos=m.tiled.____index;
            if(pos===alienVsBomb.index){
              monsters.tiled.data[pos]=0;
              S.remove(m);
            }
          }
        }
      }
    });

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
      arena: { width: 704, height: 512 },
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


