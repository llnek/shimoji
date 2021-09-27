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

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int = Math.floor;
    const cos= Math.cos;
    const sin=Math.sin;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Map
    const map1= "############"+
                "#..........#"+
                "#.....#.#..#"+
                "#..#..#.#..#"+
                "#..#..#.#..#"+
                "#..#..#.#..#"+
                "#..#..#.#..#"+
                "#..#..#.#..#"+
                "#..#..#.#..#"+
                "#..####.#..#"+
                "#..........#"+
                "############".replace(/\s+/g, "");
    const map2= "############"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "#..........#"+
                "############".replace(/\s+/g, "");
    const map3= "############"+
                "#..........#"+
                "#..........#"+
                "#.......#..#"+
                "#..#.#..#..#"+
                "#..#.##.#..#"+
                "#..#..#.#..#"+
                "#...#.#.#..#"+
                "#...#.#.#..#"+
                "#...###.#..#"+
                "#..........#"+
                "############".replace(/\s+/g, "");
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const FMAP=map3;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const [PROJECTIONWIDTH, PROJECTIONHEIGHT,PROJDIST] = (function(){
      if(Mojo.width > 1400){
        return [1280, 800, 1108]
      }else if(Mojo.width > 1040){
        return [960, 600, 830]
      }else if(Mojo.width > 800){
        return [640, 400, 554]
      }else{
        return [320, 200, 276]
      }
    })();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // FOV = 60
    const ANGLE60 = PROJECTIONWIDTH;
    const ANGLE30 = int(ANGLE60/2);
    const ANGLE15 = int(ANGLE30/2);
    const ANGLE90 = int(ANGLE30*3);
    const ANGLE180 = int(ANGLE90*2);
    const ANGLE270 = int(ANGLE90*3);
    const ANGLE360 = int(ANGLE60*6);
    const ANGLE0 = 0;
    const ANGLE5 = int(ANGLE30/6);
    const ANGLE10 = int(ANGLE5*2);
    const ANGLE45 = int(ANGLE15*3);

    // size of tile (wall height)
    const TILE_SIZE = 64;
    const WALL_HEIGHT = 64;
    const MAP_WIDTH=12;
    const MAP_HEIGHT=12;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // trigonometric tables (the ones with "I" such as ISiTable are "Inverse" table)
    const tSIN=0;
    const iSIN=1;
    const tCOS=2;
    const iCOS=3;
    const tTAN=4;
    const iTAN=5;
    const tFISH=6;
    const xSTEP=7;
    const ySTEP=8;
    const TABLES= (function(a){
      for(let i=0;i<a.length;++i)
        a[i]= new Array(ANGLE360+1)
      return a;
    })(_.fill(9));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function paintRect(g,x, y, w, h, c){
      g.beginFill(_S.color(c));
      g.drawRect(x, y, w, h);
      g.endFill();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("PlayGame",{
      setup(){
        _G.gameScene=this;
        function arcToRad(a){ return a*Math.PI/ANGLE180 }
        this.g.initTables=()=>{
          for(let v,r,i=0; i<=ANGLE360; ++i){
            r= arcToRad(i) + 0.0001;// add tiny amount to avoid 0 (div by 0)
            v=TABLES[tSIN][i]=sin(r);
            TABLES[iSIN][i]=1.0/v;
            v=TABLES[tCOS][i]=cos(r);
            TABLES[iCOS][i]=1.0/v;
            v=TABLES[tTAN][i]=Math.tan(r);
            TABLES[iTAN][i]=1.0/v;
            // Next we create a table to speed up wall lookups.
            //You can see that the distance between walls are the same
            //if we know the angle
            //  _____|_/next xi______________
            //       |
            //  ____/|next xi_________   slope = tan = height / dist between xi's
            //     / |
            //  __/__|_________  dist between xi = height/tan where height=tile size
            // old xi|
            // distance between xi = x_step[view_angle];
            if(i>=ANGLE90 && i<ANGLE270){//facing LEFT
              v= TABLES[xSTEP][i] = TILE_SIZE / TABLES[tTAN][i];
              if(v>0) TABLES[xSTEP][i]=-v;
            }else{ // facing RIGHT
              v= TABLES[xSTEP][i] = TILE_SIZE / TABLES[tTAN][i];
              if(v<0) TABLES[xSTEP][i]=-v;
            }
            if(i>=ANGLE0 && i<ANGLE180){//facing DOWN
              v= TABLES[ySTEP][i] = TILE_SIZE* TABLES[tTAN][i];
              if(v<0) TABLES[ySTEP][i]=-v;
            }else{ // FACING UP
              v= TABLES[ySTEP][i] = TILE_SIZE* TABLES[tTAN][i];
              if(v>0) TABLES[ySTEP][i]=-v;
            }
          }
          // Create table for fixing FISHBOWL distortion
          for(let i=-ANGLE30; i<=ANGLE30; ++i){
            // we don't have negative angle, so make it start at 0
            // this will give range from column 0 to (PROJECTONPLANEWIDTH) since we only will need to use those range
            TABLES[tFISH][i+ANGLE30] = 1.0/cos(arcToRad(i))
          }

          return this;
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel=()=>{
          this.fProjPlaneYCenter = PROJECTIONHEIGHT/2;
          this.fPlayerDistToTheProjPlane = PROJDIST;
          this.fPlayerHeight = WALL_HEIGHT/2;
          this.fPlayerSpeed = 16;
          _G.fPlayerArc = ANGLE5+ANGLE5;
          _G.fPlayerX = 100;
          _G.fPlayerY = 160;
          //2 dimensional map
          let sy= int((Mojo.height-PROJECTIONHEIGHT)/2);
          let sx= int((Mojo.width-PROJECTIONWIDTH)/2);
          _V.set(this,sx,sy);
          _G.arena= {x1:sx, y1:sy, x2: sx+PROJECTIONWIDTH, y2: sy+PROJECTIONHEIGHT};
          let pbox={x1:0,y1:0,
                    x2:_G.arena.width,
                    y2:_G.arena.height};
          this.insert(_S.drawGridBox(pbox));
          return this.insert( this.g.gfx=_S.graphics());
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.drawBackgd=()=>{
          let r,step=2,c=255;
          for(r=0; r<PROJECTIONHEIGHT/2; r+=step){//sky
            this.g.gfx.beginFill(_S.color3(c, 125, 225));
            this.g.gfx.drawRect(0,r,PROJECTIONWIDTH,step);
            this.g.gfx.endFill();
            --c;
          }
          for(c=22, r=PROJECTIONHEIGHT/2; r<PROJECTIONHEIGHT; r+=step){//floor
            this.g.gfx.beginFill(_S.color3(c, 20, 20));
            this.g.gfx.drawRect(0,r,PROJECTIONWIDTH,step);
            this.g.gfx.endFill();
            ++c;
          }
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initTables() && this.g.initLevel();
        this.g.hud=new HUD(this);
      },
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //check algo from permadi...
      //https://permadi.com/1996/05/ray-casting-tutorial-7/
      //https://permadi.com/1996/05/ray-casting-tutorial-8/
      raycast(){
        let vtGridGap, hzGridGap;
        let vtGrid, hzGrid;
        let i_x, i_y;
        let distToVtGridBeingHit;
        let distToHzGridBeingHit;
        let castArc = _G.fPlayerArc;
        castArc-= ANGLE30; // trace the rays from the left
        if(castArc < 0) castArc += ANGLE360;
        //the big loop
        for(let xtemp,ytemp,castCol=0; castCol<PROJECTIONWIDTH; ++castCol){
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //DEAL WITH HORZ LINES
          if(castArc > ANGLE0 && castArc < ANGLE180){//ray facing down
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE  + TILE_SIZE;
            hzGridGap = TILE_SIZE;
            xtemp = TABLES[iTAN][castArc]*(hzGrid-_G.fPlayerY);
          }else{//ray is facing up
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE;
            hzGridGap = -TILE_SIZE;
            xtemp = TABLES[iTAN][castArc]*(hzGrid - _G.fPlayerY);
            hzGrid -= 1;
          }
          //first intersect
          i_x = xtemp + _G.fPlayerX;
          if(castArc==ANGLE0 || castArc==ANGLE180){
            distToHzGridBeingHit=Number.MAX_VALUE;
          }else{
            let idx, gx,gy, dx = TABLES[xSTEP][castArc];
            while(true){
              gy = int(hzGrid/TILE_SIZE);
              gx = int(i_x/TILE_SIZE);
              idx= int(gy*MAP_WIDTH+gx);
              if((gx>=MAP_WIDTH) || (gy>=MAP_HEIGHT) || gx<0 || gy<0){
                distToHzGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(FMAP.charAt(idx)!="."){
                distToHzGridBeingHit  = (i_x-_G.fPlayerX)* TABLES[iCOS][castArc];
                break;
              }else{
                i_x += dx;
                hzGrid += hzGridGap;
              }
            }
          }
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //DEAL WITH VERT LINES
          if(castArc < ANGLE90 || castArc > ANGLE270){
            vtGrid = TILE_SIZE + int(_G.fPlayerX/TILE_SIZE)*TILE_SIZE;
            vtGridGap = TILE_SIZE;
            ytemp = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
          }else{ // RAY FACING LEFT
            vtGrid = int(_G.fPlayerX/TILE_SIZE)*TILE_SIZE;
            vtGridGap = -TILE_SIZE;
            ytemp = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
            vtGrid -=1;
          }
          //first intersect
          i_y = ytemp + _G.fPlayerY;
          if(castArc==ANGLE90||castArc==ANGLE270){
            distToVtGridBeingHit = Number.MAX_VALUE;
          }else{
            let idx, gx,gy,dy = TABLES[ySTEP][castArc];
            while(true){
              gx = int(vtGrid/TILE_SIZE);
              gy = int(i_y/TILE_SIZE);
              idx=int(gy*MAP_WIDTH+gx);
              if((gx>=MAP_WIDTH) || (gy>=MAP_HEIGHT) || gx<0 || gy<0){
                distToVtGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(FMAP.charAt(idx)!="."){
                distToVtGridBeingHit =(i_y-_G.fPlayerY)* TABLES[iSIN][castArc];
                break;
              }else{
                i_y += dy;
                vtGrid += vtGridGap;
              }
            }
          }
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          // DRAW THE WALL SLICE
          let scaleFactor;
          let dist;
          let topOfWall;
          let bottomOfWall;
          if(distToHzGridBeingHit < distToVtGridBeingHit){
            this.g.hud.drawRayOnOverheadMap(i_x, hzGrid);
            dist=distToHzGridBeingHit;
          }else{
            //the vertical wall is closer than the horizontal wall
            this.g.hud.drawRayOnOverheadMap(vtGrid, i_y);
            dist=distToVtGridBeingHit;
          }
          // correct distance (compensate for the fishbown effect)
          dist /= TABLES[tFISH][castCol];
          //projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
          let projWallHeight=(WALL_HEIGHT*this.fPlayerDistToTheProjPlane/dist);
          bottomOfWall = this.fProjPlaneYCenter+(projWallHeight*0.5);
          topOfWall = this.fProjPlaneYCenter-(projWallHeight*0.5);
          if(topOfWall<0) topOfWall=0;
          if(bottomOfWall>=PROJECTIONHEIGHT){
            bottomOfWall=PROJECTIONHEIGHT-1;
          }
          // Add simple shading so that farther wall slices appear darker.
          // 750 is arbitrary value of the farthest distance.
          dist=int(dist);
          let color=255-(dist/750.0)*255.0;
          // don't allow it to be too dark
          if(color<20) color=20;
          if(color>255) color=255;
          color=int(color);
          paintRect(this.g.gfx, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, _S.color3(color,color,color));
          castArc+=1;
          if(castArc>=ANGLE360) castArc-=ANGLE360;
        }
      },
      preUpdate(dt){
        this.g.hud.gfx.clear();
        this.g.gfx.clear();
      },
      doMotion(){
        if(_I.keyDown(_I.LEFT)){
          _G.fPlayerArc-=ANGLE10;
          if(_G.fPlayerArc<ANGLE0) _G.fPlayerArc+=ANGLE360;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.fPlayerArc+=ANGLE10;
          if(_G.fPlayerArc>=ANGLE360) _G.fPlayerArc-=ANGLE360;
        }
        let playerXDir= TABLES[tCOS][_G.fPlayerArc];
        let playerYDir= TABLES[tSIN][_G.fPlayerArc];
        let dx=0,dy=0;
        //move forward
        if(_I.keyDown(_I.UP)){
          dx=Math.round(playerXDir*this.fPlayerSpeed);
          dy=Math.round(playerYDir*this.fPlayerSpeed);
        }
        if(_I.keyDown(_I.DOWN)){
          dx=-Math.round(playerXDir*this.fPlayerSpeed);
          dy=-Math.round(playerYDir*this.fPlayerSpeed);
        }
        _G.fPlayerX+=dx;
        _G.fPlayerY+=dy;
        // CHECK COLLISION AGAINST WALLS
        // compute cell position
        let playerXCell = int(_G.fPlayerX/TILE_SIZE);
        let playerYCell = int(_G.fPlayerY/TILE_SIZE);
        // compute position relative to cell (ie: how many pixel from edge of cell)
        let playerXCellOffset = _G.fPlayerX % TILE_SIZE;
        let playerYCellOffset = _G.fPlayerY % TILE_SIZE;
        let minDistanceToWall=30;
        // make sure the player don't bump into walls
        if(dx>0){ // moving right
          if((FMAP.charAt((playerYCell*MAP_WIDTH)+playerXCell+1)!=".")&&
             (playerXCellOffset > (TILE_SIZE-minDistanceToWall))){
            // back player up
            _G.fPlayerX -= (playerXCellOffset-(TILE_SIZE-minDistanceToWall));
          }
        }else{ // moving left
          if((FMAP.charAt((playerYCell*MAP_WIDTH)+playerXCell-1)!=".")&&
             (playerXCellOffset < (minDistanceToWall))){
            // back player up
            _G.fPlayerX += (minDistanceToWall-playerXCellOffset);
          }
        }
        if(dy<0){ // moving up
          if((FMAP.charAt(((playerYCell-1)*MAP_WIDTH)+playerXCell)!=".")&&
             (playerYCellOffset < (minDistanceToWall))){
            _G.fPlayerY += (minDistanceToWall-playerYCellOffset);
          }
        }else{ // moving down
          if((FMAP.charAt(((playerYCell+1)*MAP_WIDTH)+playerXCell)!=".")&&
             (playerYCellOffset > (TILE_SIZE-minDistanceToWall))){
            _G.fPlayerY -= (playerYCellOffset-(TILE_SIZE-minDistanceToWall ));
          }
        }
      },
      postUpdate(dt){
        this.g.drawBackgd();
        this.g.hud.drawMap();
        this.raycast();
        this.doMotion();
      }

    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function HUD(scene){
      scene.insert(this.gfx=_S.graphics());
      this.fMinimapWidth=10;
      this.fPlayerMapX=0;
      this.fPlayerMapY=0;
      // draw line from the player position to the position where the ray intersect with wall
      this.drawRayOnOverheadMap=(x,y)=>{
        this.gfx.lineStyle(2,_S.color("#f6e73b"));
        this.gfx.moveTo(this.fPlayerMapX, this.fPlayerMapY);
        this.gfx.lineTo(PROJECTIONWIDTH+(x*this.fMinimapWidth/TILE_SIZE), y*this.fMinimapWidth/TILE_SIZE);
      };
      // draw a red line indication the player's direction
      this.drawPlayerPOV=()=>{
        this.gfx.lineStyle(2,_S.color("#ff0000"));
        this.gfx.moveTo( this.fPlayerMapX, this.fPlayerMapY);
        this.gfx.lineTo(this.fPlayerMapX+ TABLES[tCOS][_G.fPlayerArc]*10,
                          this.fPlayerMapY+ TABLES[tSIN][_G.fPlayerArc]*10);
      };
      this.drawMap=(dt)=>{
        for(let css,r=0; r<MAP_HEIGHT; ++r){
          for(let c=0; c<MAP_WIDTH;++c){
            css="black";
            if(FMAP.charAt(r*MAP_WIDTH+c)=="#"){
              css="white";
            }
            paintRect(this.gfx, PROJECTIONWIDTH+(c*this.fMinimapWidth),
                      (r*this.fMinimapWidth), this.fMinimapWidth, this.fMinimapWidth, css);
          }
        }
        this.fPlayerMapX=PROJECTIONWIDTH+((_G.fPlayerX/TILE_SIZE) * this.fMinimapWidth);
        this.fPlayerMapY=((_G.fPlayerY/TILE_SIZE) * this.fMinimapWidth);
        this.drawPlayerPOV();
      };
    }

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("PlayGame");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


