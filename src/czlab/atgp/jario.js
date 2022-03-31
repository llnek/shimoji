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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const _M=window["io/czlab/mcfud/math"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            _G.player=_S.rect(4,4);
            _G.player.visible=false;
            _G.player.x=1;
            _G.player.y=1;
            _G.bPlayerOnGround = false;
            _G.fCameraPosX = 0;
            _G.fCameraPosY = 0;
            // Sprite selection flags
            _G.nDirModX = 0;
            _G.nDirModY = 0;
            _G.nLevelWidth = 64;
            _G.nLevelHeight = 32;//16;
            let sLevel= "................................................................";
              sLevel += "................................................................";
              sLevel += ".......ooooo....................................................";
              sLevel += "........ooo.....................................................";
              sLevel += ".......................########.................................";
              sLevel += ".....BB?BBBB?BB.......###..............#.#......................";
              sLevel += "....................###................#.#......................";
              sLevel += "...................####.........................................";
              sLevel += "GGGGG..GGGGGGGGGGGGGGGGGGGGGGGGGGGGG.##############.....########";
              sLevel += "...................................#.#...............###........";
              sLevel += "........................############.#............###...........";
              sLevel += "........................#............#.........###..............";
              sLevel += "........................#.############......###.................";
              sLevel += "........................#................###....................";
              sLevel += "........................#################.......................";
              sLevel += "................................................................";
            _G.sLevel=sLevel.split("");
            this.gfx=self.insert(_S.graphics());
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      getTile(x, y){
        x=int(x);
        y=int(y);
        if(x >= 0 && x < _G.nLevelWidth &&
           y >= 0 && y < _G.nLevelHeight)
          return _G.sLevel[y * _G.nLevelWidth + x];
        else
          return " ";
      },
      setTile(x, y, c){
        x=int(x);
        y=int(y);
        if(x >= 0 && x < _G.nLevelWidth &&
           y >= 0 && y < _G.nLevelHeight) _G.sLevel[y*_G.nLevelWidth + x] = c;
      },
      postUpdate(dt){
        this.g.gfx.clear();
        //if(_I.keyDown(_I.UP)){ _G.player.m5.vel[1]= -6 }
        //if(_I.keyDown(_I.DOWN)) { _G.player.m5.vel[1]= 6 }
        if(_I.keyDown(_I.LEFT)){
          _G.player.m5.vel[0] += (_G.bPlayerOnGround ? -25 : -15) * dt;
          _G.nDirModY = 1;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.player.m5.vel[0] += (_G.bPlayerOnGround ? 25 : 15) * dt;
          _G.nDirModY = 0;
        }
        if(_I.keyDown(_I.SPACE)){
          if(_G.player.m5.vel[1]== 0){
            _G.player.m5.vel[1]= -12;
            _G.nDirModX = 1;
          }
        }
        // Gravity
        _G.player.m5.vel[1]+= 20 * dt;
        // Drag
        if(_G.bPlayerOnGround){
          _G.player.m5.vel[0] += -3 * _G.player.m5.vel[0] * dt;
          if(Math.abs(_G.player.m5.vel[0]) < 0.01) _G.player.m5.vel[0] = 0;
        }

        // Clamp velocities
        if(_G.player.m5.vel[0]> 10) _G.player.m5.vel[0]= 10;
        if(_G.player.m5.vel[0] < -10) _G.player.m5.vel[0]= -10;
        if(_G.player.m5.vel[1]> 100) _G.player.m5.vel[1]= 100;
        if(_G.player.m5.vel[1]< -100) _G.player.m5.vel[1]= -100;

        // Calculate potential new position
        let newPosX = _G.player.x + _G.player.m5.vel[0] * dt;
        let newPosY = _G.player.y+ _G.player.m5.vel[1]* dt;

        // Check for pickups!
        if(this.getTile(newPosX, newPosY) == "o") this.setTile(newPosX, newPosY, ".");
        if(this.getTile(newPosX , newPosY + 1) == "o") this.setTile(newPosX , newPosY + 1, ".");
        if(this.getTile(newPosX + 1, newPosY ) == "o") this.setTile(newPosX + 1, newPosY , ".");
        if(this.getTile(newPosX + 1, newPosY + 1) == "o") this.setTile(newPosX + 1, newPosY + 1, ".");

        // Check for Collision
        if(_G.player.m5.vel[0]<= 0){// Moving Left
          if(this.getTile(newPosX, _G.player.y) != "." ||
             this.getTile(newPosX, _G.player.y+ 0.9) != "."){
            newPosX = int(newPosX) + 1;
            _G.player.m5.vel[0]= 0;
          }
        }else{// Moving Right
          if(this.getTile(newPosX + 1, _G.player.y) != "." ||
             this.getTile(newPosX + 1, _G.player.y+ 0.9) != "."){
            newPosX = int(newPosX);
            _G.player.m5.vel[0]= 0;
          }
        }

        _G.bPlayerOnGround = false;
        if(_G.player.m5.vel[1]<= 0){// Moving Up
          if(this.getTile(newPosX , newPosY) != "." ||
             this.getTile(newPosX + 0.9, newPosY) != "."){
            newPosY = int(newPosY) + 1;
            _G.player.m5.vel[1]= 0;
          }
        }else{// Moving Down
          if(this.getTile(newPosX , newPosY + 1) != "." ||
             this.getTile(newPosX + 0.9, newPosY + 1) != "."){
            newPosY = int(newPosY);
            _G.player.m5.vel[1]= 0;
            _G.bPlayerOnGround = true; // Player has a solid surface underfoot
            _G.nDirModX = 0;
          }
        }

        // Apply new position
        _G.player.x= newPosX;
        _G.player.y= newPosY;

        // Link camera to player position
        _G.fCameraPosX = _G.player.x;
        _G.fCameraPosY = _G.player.y;

        // Draw Level
        let nTileWidth = 32;//16;
        let nTileHeight = 32;//16;
        let nVisibleTilesX = Mojo.width / nTileWidth;
        let nVisibleTilesY = Mojo.height / nTileHeight;

        // Calculate Top-Leftmost visible tile
        let fOffsetX = _G.fCameraPosX - nVisibleTilesX / 2;
        let fOffsetY = _G.fCameraPosY - nVisibleTilesY / 2;

        // Clamp camera to game boundaries
        if(fOffsetX < 0) fOffsetX = 0;
        if(fOffsetY < 0) fOffsetY = 0;
        if(fOffsetX > _G.nLevelWidth - nVisibleTilesX) fOffsetX = _G.nLevelWidth - nVisibleTilesX;
        if(fOffsetY > _G.nLevelHeight - nVisibleTilesY) fOffsetY = _G.nLevelHeight - nVisibleTilesY;

        // Get offsets for smooth movement
        let fTileOffsetX = (fOffsetX - int(fOffsetX)) * nTileWidth;
        let fTileOffsetY = (fOffsetY - int(fOffsetY)) * nTileHeight;
        let x,y;

        // Draw visible tile map
        for(x = -1; x < nVisibleTilesX + 1; ++x){
          for(y = -1; y < nVisibleTilesY + 1; ++y){
            let sTileID = this.getTile(x + fOffsetX, y + fOffsetY);
            switch(sTileID){
            case ".": // Sky
              this.doFill(x*nTileWidth - fTileOffsetX,
                   y * nTileHeight - fTileOffsetY,
                   (x+1) * nTileWidth - fTileOffsetX,
                   (y+1) * nTileHeight - fTileOffsetY, "cyan");
              break;
            case "#": // Solid Block
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1)*nTileWidth - fTileOffsetX,
                          (y+1)*nTileHeight - fTileOffsetY, "#9AA297");
              break;
            case "G": // Ground Block
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1)*nTileWidth - fTileOffsetX,
                          (y+1)*nTileHeight - fTileOffsetY, "#D1CBC1");
              break;
            case "B": // Brick Block
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1)*nTileWidth - fTileOffsetX,
                          (y+1)*nTileHeight - fTileOffsetY, "#63666A");
              break;
            case "?": // Question Block
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1)*nTileWidth - fTileOffsetX,
                          (y+1)*nTileHeight - fTileOffsetY, "magenta");
              break;
            case "o": // Coin
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1)*nTileWidth - fTileOffsetX,
                          (y+1)*nTileHeight - fTileOffsetY, "yellow");
              break;
            default:
              this.doFill(x*nTileWidth - fTileOffsetX,
                          y*nTileHeight - fTileOffsetY,
                          (x+1) * nTileWidth - fTileOffsetX,
                          (y+1) * nTileHeight - fTileOffsetY, "#778840");
              break;
            }
          }
        }

        x=_G.player.x-fOffsetX;
        y=_G.player.y-fOffsetY;
        this.doFill(x * nTileWidth,
                    y * nTileHeight,
                    (x+1) * nTileWidth,
                    (y+1) * nTileHeight, "blue");

      },
      doClip(x, y){
        if(x < 0) x = 0;
        if(x >= Mojo.width) x = Mojo.width;
        if(y < 0) y = 0;
        if(y >= Mojo.height) y = Mojo.height;
        return [int(x),int(y)];
      },
      doFill(x1, y1, x2, y2, color){
        let p1=this.doClip(x1, y1),
            p2=this.doClip(x2, y2);
        [x1,y1]=p1;
        [x2,y2]=p2;
        this.g.gfx.beginFill(_S.color(color));
        this.g.gfx.drawRect(x1,y1,x2-x1,y2-y1);
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roomba.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


function postUpdate(e,dt){

  if(_I.keyDown(_I.LEFT)){
    e.m5.vel[0] += (bPlayerOnGround ? -25 : -15) * dt;
    heading=Mojo.LEFT;
  }
  else if(_I.keyDown(_I.RIGHT)){
    e.m5.vel[0] += (bPlayerOnGround ? 25 : 15) * dt;
    heading=Mojo.RIGHT;
  }

  if(_I.keyDown(_I.SPACE)){
    if(_.feq0(e.m5.vel[1])){
      e.m5.vel[1]= -12; //JUMP SPEED
      heading=Mojo.UP;
    }
  }

  // Gravity
  e.m5.vel[1]+= e.m5.gravity[1] * dt;

  // Drag
  if(bPlayerOnGround){
    e.m5.vel[0] += e.m4.friction[0] * _e.m5.vel[0] * dt;
    if(Math.abs(e.m5.vel[0]) < 0.01) e.m5.vel[0] = 0;
  }

  // Clamp velocities
  if(e.m5.maxSpeed !== undefined){
    //if(_G.player.m5.vel[0]> 10) _G.player.m5.vel[0]= 10;
    //if(_G.player.m5.vel[0] < -10) _G.player.m5.vel[0]= -10;
    //if(_G.player.m5.vel[1]> 100) _G.player.m5.vel[1]= 100;
    //if(_G.player.m5.vel[1]< -100) _G.player.m5.vel[1]= -100;
  }

  // Calculate potential new position
  let newPosX = e.x + e.m5.vel[0] * dt;
  let newPosY = e.y+ e.m5.vel[1]* dt;

  // Check for Collision
  if(e.m5.vel[0]< 0){// Moving Left
    if(this.getTile(newPosX, _G.player.y) != "." ||
       this.getTile(newPosX, _G.player.y+ 0.9) != "."){
      newPosX = int(newPosX) + 1;
      _G.player.m5.vel[0]= 0;
    }
  }else{// Moving Right
    if(this.getTile(newPosX + 1, _G.player.y) != "." ||
       this.getTile(newPosX + 1, _G.player.y+ 0.9) != "."){
      newPosX = int(newPosX);
      _G.player.m5.vel[0]= 0;
    }
  }

  bPlayerOnGround = false;
  if(e.m5.vel[1]<= 0){// Moving Up
    if(this.getTile(newPosX , newPosY) != "." ||
       this.getTile(newPosX + 0.9, newPosY) != "."){
      newPosY = int(newPosY) + 1;
      _G.player.m5.vel[1]= 0;
    }
  }else{// Moving Down
    if(this.getTile(newPosX , newPosY + 1) != "." ||
       this.getTile(newPosX + 0.9, newPosY + 1) != "."){
      newPosY = int(newPosY);
      _G.player.m5.vel[1]= 0;
      _G.bPlayerOnGround = true; // Player has a solid surface underfoot
      _G.nDirModX = 0;
    }
  }


}


