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

  //let level, world, player, output, score;
  function scenes(Mojo){
    const Z=Mojo.Scenes,S=Mojo.Sprites,I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const G=Mojo.Game;
    const {ute:_,is,EventBus}=Mojo;
    G.score=0;
    G.level=_T.mockTiledWorld(32,32,16,16);
    G.level.tiled.tileset={
        //The source image
        source: "platforms.png",
        //The x/y coordinates for the sprites on the tileset
        player: [32, 32],
        treasure: [32, 0],
        cloud: [64, 0],
        sky: [64, 32],
        rock: [0, 32],
        grass: [0, 0]
    };
    function makeWorld(level){
      let world = S.container();
      world.tiled={
        player: null,
        map: [],
        platforms: [],
        treasures: [],
        itemLocations: []
      };
      makeMap();
      terraformMap();
      addItems();
      makeTileSprites();
      function makeMap(){
        let cellIsAlive = () => _.randInt2(0, 3) === 0;
        let numberOfCells = level.tiled.tilesInY * level.tiled.tilesInX;
        for(let x,y,cell,i=0; i<numberOfCells; ++i){
          x = i % level.tiled.tilesInX;
          y = Math.floor(i / level.tiled.tilesInX);
          cell = { x: x, y: y, item: "" };
          cell.terrain= cellIsAlive() ? "rock" : "sky";
          world.tiled.map.push(cell);
        }
      }
      function terraformMap() {
        //add border and grass.
        let _index = (x, y) => { return x + (y * level.tiled.tilesInX) };
        world.tiled.map.forEach((cell, index, map) => {
          let cellTotheLeft = map[_index(cell.x - 1, cell.y)],
              cellTotheRight = map[_index(cell.x + 1, cell.y)],
              cellBelow = map[_index(cell.x, cell.y + 1)],
              cellAbove = map[_index(cell.x, cell.y - 1)],
              cellTwoAbove = map[_index(cell.x, cell.y - 2)];
          if(cell.x === 0 || cell.y === 0 ||
            cell.x === level.tiled.tilesInX - 1 ||
            cell.y === level.tiled.tilesInY - 1){
            cell.terrain = "border";
          }else{
            if(cell.terrain == "rock")
              if(cellAbove && cellAbove.terrain == "sky"){
                cell.terrain = "grass";
                if(cellTwoAbove)
                  if(cellTwoAbove.terrain == "rock" ||
                    cellTwoAbove.terrain == "grass"){
                    cellTwoAbove.terrain = "sky";
                  }
              }
          }
        });
        world.tiled.map.forEach((cell, index, map) => {
          if(cell.terrain == "grass"){
            let cellAbove = map[_index(cell.x, cell.y - 1)];
            world.tiled.itemLocations.push(cellAbove);
          }
        });
      }
      function addItems(){
        let _findStartLocation = () => {
          let r = _.randInt2(0, world.tiled.itemLocations.length - 1);
          let location = world.tiled.itemLocations[r];
          _.disj(world.tiled.itemLocations,location);
          return location;
        };
        let cell = _findStartLocation();
        cell.item = "player";
        for(let i = 0; i < 3; ++i) {
          cell = _findStartLocation();
          cell.item = "treasure";
        }
      }
      function makeTileSprites(){
        world.tiled.map.forEach((cell, index, map) => {
          let sprite,
              frame,
              x = cell.x * level.tiled.tileW,
              y = cell.y * level.tiled.tileH,
              width = level.tiled.tileW,
              height = level.tiled.tileH;
          switch(cell.terrain){
          case "rock":
            sprite = S.frame(level.tiled.tileset.source,
                             width, height,
                             level.tiled.tileset.rock[0],
                             level.tiled.tileset.rock[1]);
            S.setXY(sprite, x, y);
            world.addChild(sprite);
            world.tiled.platforms.push(sprite);
          break;
          case "grass":
            sprite = S.frame(level.tiled.tileset.source,
                             width, height,
                             level.tiled.tileset.grass[0],
                             level.tiled.tileset.grass[1]);
            S.setXY(sprite,x, y);
            world.addChild(sprite);
            world.tiled.platforms.push(sprite);
          break;
          case "sky":
            //Add clouds every 6 cells and only on the top 80% of the level
            let sourceY=
                (index % 6 === 0 && index < map.length * 0.8)
                ? level.tiled.tileset.cloud[1] : level.tiled.tileset.sky[1];
            sprite = S.frame(level.tiled.tileset.source,
                             width, height,
                             level.tiled.tileset.sky[0], sourceY);
            S.setXY(sprite,x, y);
            world.addChild(sprite);
          break;
          case "border":
            sprite = S.rectangle(level.tiled.tileW, level.tiled.tileH,"black");
            //sprite.fillStyle = "black";
            sprite.x = cell.x * level.tiled.tileW;
            sprite.y = cell.y * level.tiled.tileH;
            //sprite.width = level.tiled.tilewidth;
            //sprite.height = level.tiled.tileheight;
            world.addChild(sprite);
            world.tiled.platforms.push(sprite);
          break;
          }
        });
        world.tiled.map.forEach(cell => {
          if(cell.item != ""){
            let sprite,
                frame,
                x = cell.x * level.tiled.tileW + level.tiled.tileW / 4,
                y = cell.y * level.tiled.tileH + level.tiled.tileW / 2,
                width = level.tiled.tileW / 2,
                height = level.tiled.tileH / 2;
            switch(cell.item){
            case "player":
              sprite = S.frame("platforms.png", 32, 32, 32, 32);
              sprite.width = width;
              sprite.height = height;
              S.setXY(sprite,x, y);
              sprite.m5.friction[0] =
              sprite.m5.friction[0] =1;
              sprite.m5.gravity[0] =
              sprite.m5.gravity[1] = 0.3;
              sprite.m5.jumpForce = [-6.8,-6.8];
              sprite.m5.isOnGround = true;
              world.tiled.player = sprite;
              world.addChild(sprite);
            break;
            case "treasure":
              sprite = S.frame("platforms.png", 32, 32, 32, 0);
              sprite.width = width;
              sprite.height = height;
              S.setXY(sprite,x, y);
              world.addChild(sprite);
              world.tiled.treasures.push(sprite);
            break;
            }
          }
        });
      }
      return world;
    }

    Z.defScene("hud", {
      setup() {
        this.output = S.text("score: ",
          {fontFamily: "puzzler", fontSize: 16, fill:"white"}, 32, 8);
        this.insert(this.output);
        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function() {
        this.output.text=`score: ${G.score}`;
      }
    });

    Z.defScene("level1", {
      setup(){
        let world = makeWorld(G.level);
        let player = world.tiled.player;
        this.world=world;
        this.insert(world);

        let leftArrow = I.keybd(I.keyLEFT, ()=>{
          if(rightArrow.isUp)
            player.m5.acc[0]= -0.2;
        }, ()=>{
          if(rightArrow.isUp)
            player.m5.acc[0] = 0;
        });

        let rightArrow = I.keybd(I.keyRIGHT, ()=>{
          if(leftArrow.isUp)
            player.m5.acc[0] = 0.2;
        }, ()=>{
          if(leftArrow.isUp)
            player.m5.acc[0] = 0;
        });

        let spaceBar = I.keybd(I.keySPACE, ()=>{
          if(player.m5.isOnGround){
            player.m5.vel[1] += player.m5.jumpForce[1];
            player.m5.isOnGround = false;
            player.m5.friction[0] = 1;
          }
        });

        EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(dt){
        let player=this.world.tiled.player;
        if(player.m5.isOnGround){
          player.m5.friction[0] = 0.92;
        } else {
          player.m5.friction[0] = 0.97;
        }
        player.m5.vel[0] += player.m5.acc[0];
        player.m5.vel[1] += player.m5.acc[1];
        player.m5.vel[0] *= player.m5.friction[0];
        player.m5.vel[1] += player.m5.gravity[1];
        S.move(player);
        function extra(col, platform){
          if(col){
            if(col.has(Mojo.BOTTOM) && player.m5.vel[1] >= 0){
              player.m5.isOnGround = true;
              player.m5.vel[1] = -player.m5.gravity[1];
            }
            else if(col.has(Mojo.TOP) && player.m5.vel[1] <= 0){
              player.m5.vel[1] = 0;
            }
            else if(col.has(Mojo.RIGHT) && player.m5.vel[0] >= 0){
              player.m5.vel[0] = 0;
            }
            else if(col.has(Mojo.LEFT) && player.m5.vel[0] <= 0){
              player.m5.vel[0] = 0;
            }
            if(!col.has(Mojo.BOTTOM) && player.m5.vel[1] > 0){
              player.m5.isOnGround = false;
            }
          }
        }
        _.rseq(this.world.tiled.platforms,p=> _2d.hitTest(player, p,true,extra));
        this.world.tiled.treasures = this.world.tiled.treasures.filter(function(star){
          if (_2d.hitTest(player, star)){
            G.score += 1;
            S.remove(star);
            return false;
          } else {
            return true;
          }
        });
      }
    });

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["platforms.png", "puzzler.otf" ],
      arena: { width: 512, height: 512 },
      scaleToWindow: true,
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
        Mojo.Scenes.runScene("hud");
      }
    })
  });

})(this);
