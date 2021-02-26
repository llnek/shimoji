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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const {ute:_, is, EventBus}=Mojo;

    //`isAtIntersection` returns true or false depending on whether a
    //sprite is exactly aligned to anintersection in the maze corridors
    function isCenteredOverCell(sprite,world){
      return Math.floor(sprite.x) % world.tiled.tileW === 0 &&
             Math.floor(sprite.y) % world.tiled.tileH === 0;
    }
    function directionToVelocity(dir,speed){
      let r=[0,0];
      switch(dir){
        case Mojo.UP: r[1]= -speed; break;
        case Mojo.DOWN: r[1]= speed; break;
        case Mojo.LEFT: r[0]= -speed; break;
        case Mojo.RIGHT: r[0]= speed; break;
      }
      return r;
    }
    function _validDirections(sprite, tiles, validGid, world){
      let index = _T.getTileIndex(sprite.x,sprite.y, world);
      let crossGids = _T.getCrossTiles(index, tiles, world);
      let vdirs = [Mojo.UP,Mojo.LEFT,Mojo.RIGHT,Mojo.DOWN];
      return crossGids.map((gid, i) => {
        return gid === validGid ? vdirs[i] : Mojo.NONE;
      }).filter(d=> d !== Mojo.NONE);
    }
    function canChangeDirection(dirs){
      //let stuck = dirs.length === 1;
      //let trapped = dirs.length === 0;
      let up = _.has(dirs, Mojo.UP),
        down = _.has(dirs, Mojo.DOWN),
        left = _.has(dirs, Mojo.LEFT),
        right = _.has(dirs, Mojo.RIGHT),
        atIntersection = (up || down) && (left || right);
      return atIntersection || dirs.length < 2;
    }
    function randomDirection(s, dirs){
      return dirs.length===0 ? Mojo.NONE : dirs[_.randInt2(0, dirs.length-1)];
    }

    _Z.defScene("level1",{
      setup(){
        let w = this.world= _T.tiledWorld("monsterMaze.json");
        this.insert(w);
        let alien= this.alien= _T.getNamedItem(_T.getTileLayer(w,"playerLayer"),"alien")[0];
        alien.m5.speed = 4;
        let monsters = _T.getTileLayer(w,"monsterLayer");
        let wall= _T.getTileLayer(w,"wallLayer");
        let mons= _T.getNamedItem(monsters,"monster");
        let monsterFrames = _S.frameSelect( "monsterMaze.png", 64,64, [ [128, 0], [128, 64] ]);
        this.monsters= mons.map(m=>{
          let monster = _S.sprite(monsterFrames);
          monster.x = m.x;
          monster.y = m.y;
          monster.m5.direction = Mojo.NONE;
          monster.m5.speed = 4;
          monsters.addChild(monster);
          _S.remove(m);//m.visible = false;
          return monster;
        });
        alien.m5.direction = Mojo.NONE;

        let leftArrow = _I.keybd(_I.keyLEFT, ()=> alien.m5.direction = Mojo.LEFT);
        let upArrow = _I.keybd(_I.keyUP, ()=> alien.m5.direction = Mojo.UP);
        let rightArrow = _I.keybd(_I.keyRIGHT, ()=> alien.m5.direction = Mojo.RIGHT);
        let downArrow = _I.keybd(_I.keyDOWN, ()=> alien.m5.direction = Mojo.DOWN);
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
        let self=this;
        if(isCenteredOverCell(this.alien,this.world)){
          let [vx,vy] = directionToVelocity(this.alien.m5.direction, this.alien.m5.speed);
          this.alien.m5.vel[0] = vx;
          this.alien.m5.vel[1] = vy;
        }
        _S.move(this.alien);
        let wall=_T.getTileLayer(this.world,"wallLayer");
        let alienVsFloor = _T.hitTestTile(this.alien, wall.tiled.data, 0, this.world, Mojo.EVERY);
        if(!alienVsFloor.hit){
          this.alien.x -= this.alien.m5.vel[0];
          this.alien.y -= this.alien.m5.vel[1];
          this.alien.m5.vel[0] = 0;
          this.alien.m5.vel[1] = 0;
        }
        this.monsters.forEach(m=> {
          if(isCenteredOverCell(m, this.world)){
            let dirs = _validDirections(m, wall.tiled.data, 0, self.world);
            if(canChangeDirection(dirs)){
              m.m5.direction = randomDirection(m, dirs);
            }
            let [vx,vy]= directionToVelocity(m.m5.direction, m.m5.speed);
            m.m5.vel[0] = vx;
            m.m5.vel[1] = vy;
          }
          m.x += m.m5.vel[0];
          m.y += m.m5.vel[1];
          let ca= _S.centerXY(this.alien);
          let cm= _S.centerXY(m);
          let v= {x:ca.x-cm.x,y:ca.y-cm.y};
          let dist = Math.sqrt(v.x * v.x + v.y * v.y);
          //3. If the monster is less than 192 pixels away from the alien,
          //change the monster's state to `scared`. Otherwise, set its
          //state to `normal`
          if(dist < 192){
            m.m5.showFrame(1);
          } else {
            m.m5.showFrame(0);
          }
        });
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [ "monsterMaze.png", "monsterMaze.json" ],
      arena: {width:704, height:512},
      scaleToWindow:true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


