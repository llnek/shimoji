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
    // size of tile (wall height)
    const TILE_SIZE = 64;
    const WALL_HEIGHT = 64;
    const MAPWIDTH=20;//12;
    const MAPDEPTH=20;//12;
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
    const map4= "####################"+
                "#..................#"+
                "#..#.#.#...#..##.#.#"+
                "#.......#..#....##.#"+
                "#..#.#..#..#..####.#"+
                "#..#.##.#..#..#..#.#"+
                "#..#..#.#..#..#..#.#"+
                "#...#.#.#..#.....#.#"+
                "#...#.#.#..#..#..#.#"+
                "#...###.#..#..####.#"+
                "#..................#"+
                "#..#.#.#...#..##.#.#"+
                "#.......#..#.....#.#"+
                "#..#.#.#...#..##.#.#"+
                "#.......#..#.....#.#"+
                "#..#.#.#...#..##.#.#"+
                "#.......#........#.#"+
                "#..#.#.#...#..##.#.#"+
                "#..........#.......#"+
                "####################".replace(/\s+/g, "");
    const map5="####################"+
               "#..............##..#"+
               "#....#..........####"+
               "#..##.....#.#..#...#"+
               "##.#..#.#.......#..#"+
               "#....#..#..........#"+
               "#.....#..###.#..##.#"+
               "#...#..........#.#.#"+
               "####.#..........##.#"+
               "#...#..#...##......#"+
               "#..#......#...#....#"+
               "#.#.##.#..#.#.##.#.#"+
               "###..##.#..###...#.#"+
               "##.#..##.#...#...###"+
               "#..##.##...#.......#"+
               "#..##....#.#...###.#"+
               "#.............#.#.##"+
               "#.....#.......#....#"+
               "##.#..#............#"+
               "####################";

    const map6="####################"+
               "#..................#"+
               "#.......###........#"+
               "#.......###........#"+
               "#..................#"+
               "#.......###........#"+
               "#.......###........#"+
               "#.......###........#"+
               "#.....########.....#"+
               "#.....#......#.....#"+
               "#.....#......#.....#"+
               "#..................#"+
               "#.....#......#.....#"+
               "#.....###.####.....#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#..................#"+
               "####################";

    const map9=randGenMapStr();
    function randGenMapStr(){
      let lastY=MAPDEPTH-1;
      let lastX=MAPWIDTH-1;
      let s="";
      for(let y=0;y<MAPDEPTH;++y)
      for(let x=0;x<MAPWIDTH;++x){
        if(y===0||y===lastY){
          s +="#"
        }else{
          if(x===0||x===lastX){
            s += "#";
          }else{
            s += _.rand()<0.2?"#":".";
          }
        }
      }
      return s;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const FMAP=map6;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const BASEW=320;
    const BASEH=200;
    const BASED=276;
    const [PROJRATIO, PROJECTIONWIDTH, PROJECTIONHEIGHT] = (function(r){
      if(Mojo.width > 1400){
        r= 4
      }else if(Mojo.width > 1040){
        r= 3
      }else if(Mojo.width > 800){
        r= 2
      }else{
        r= 1
      }
      return [r,BASEW*r,BASEH*r]
    })();

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // FOV = 60
    const ANGLE60 = BASEW;//PROJECTIONWIDTH;
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
          this.fProjPlaneYCenter = BASEH/2;//PROJECTIONHEIGHT/2;
          this.fPlayerDistToTheProjPlane = BASED;
          this.fPlayerHeight = WALL_HEIGHT/2;
          this.fPlayerSpeed = 16;
          _G.fPlayerArc = ANGLE60;//5+ANGLE5;
          _G.fPlayerX = 100;
          _G.fPlayerY = 160;
          _G.fBgImageArc=0;
          _G.textureUsed=true;
          _G.skyUsed=true;
          //center the scene!!!!!
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
        this.g.wrapArena=()=>{
          let a=_G.arena;
          this.g.gfx.beginFill(_S.color("black"));
          this.g.gfx.drawRect(-a.x1,-a.y1,Mojo.width,a.y1);
          this.g.gfx.drawRect(-a.x1,a.y2-a.y1,Mojo.width,Mojo.height-a.y2);
          this.g.gfx.drawRect(-a.x1,-a.y1,a.x1,Mojo.height);
          this.g.gfx.drawRect(a.x2-a.x1,-a.y1,Mojo.width-a.x2,Mojo.height);
          this.g.gfx.endFill();
        };
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.drawBg=()=>{
          let sx,sy;
          let r,step=1,c=255;
          let width=PROJRATIO*BASEW;
          let height=PROJRATIO*step;
          //scene is already centered, so start point = 0,0
          sx=0;
          sy=0;
          for(r=0; r<BASEH/2; r+=step){//sky
            if(!_G.skyUsed){
              this.g.gfx.beginFill(_S.color3(c, 125, 225));
              this.g.gfx.drawRect(sx,sy+(r*height),width,height);
              this.g.gfx.endFill();
            }
            --c;
          }
          for(c=0, r=BASEH/2; r<BASEH; r+=step){//floor
            this.g.gfx.beginFill(_S.color3(20, c, 20));
            this.g.gfx.drawRect(sx,sy+(r*height),width, height);
            this.g.gfx.endFill();
            ++c;
          }
        };
        this.g.drawSky=()=>{
          let sky= _S.sprite("deathvalley.jpg");
          let width = sky.width * (BASEH  / sky.height) * 2;
          let left = (_G.fPlayerArc / ANGLE360) * -width;
          sky.x=left*PROJRATIO;
          sky.y=0;
          sky.width=width*PROJRATIO;
          sky.height=BASEH*PROJRATIO;
          this.insert(_S.extend(sky));
          if(left < width - BASEW){
            sky= _S.sprite("deathvalley.jpg");
            sky.x= PROJRATIO*(left+width);
            sky.y=0;
            sky.width=PROJRATIO*width;
            sky.height=BASEH*PROJRATIO;
            this.insert(_S.extend(sky));
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
        // trace the rays from the left,change if FOV changes!
        castArc-= ANGLE30;
        if(castArc < 0) castArc += ANGLE360;
        //the big loop
        for(let tmpX,tmpY,castCol=0; castCol<BASEW; ++castCol){
          //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
          //DEAL WITH HORZ LINES
          if(castArc > ANGLE0 && castArc < ANGLE180){//ray facing down
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE  + TILE_SIZE;
            hzGridGap = TILE_SIZE;
            tmpX = TABLES[iTAN][castArc]*(hzGrid-_G.fPlayerY);
          }else{//ray is facing up
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE;
            hzGridGap = -TILE_SIZE;
            tmpX = TABLES[iTAN][castArc]*(hzGrid - _G.fPlayerY);
            hzGrid -= 1;
          }
          //first intersect
          i_x = tmpX + _G.fPlayerX;
          if(castArc==ANGLE0 || castArc==ANGLE180){
            distToHzGridBeingHit=Number.MAX_VALUE;
          }else{
            let idx, gx,gy, dx = TABLES[xSTEP][castArc];
            while(true){
              gy = int(hzGrid/TILE_SIZE);
              gx = int(i_x/TILE_SIZE);
              idx= int(gy*MAPWIDTH+gx);
              if((gx>=MAPWIDTH) || (gy>=MAPDEPTH) || gx<0 || gy<0){
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
            tmpY = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
          }else{ // RAY FACING LEFT
            vtGrid = int(_G.fPlayerX/TILE_SIZE)*TILE_SIZE;
            vtGridGap = -TILE_SIZE;
            tmpY = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
            vtGrid -=1;
          }
          //first intersect
          i_y = tmpY + _G.fPlayerY;
          if(castArc==ANGLE90||castArc==ANGLE270){
            distToVtGridBeingHit = Number.MAX_VALUE;
          }else{
            let idx, gx,gy,dy = TABLES[ySTEP][castArc];
            while(true){
              gx = int(vtGrid/TILE_SIZE);
              gy = int(i_y/TILE_SIZE);
              idx=int(gy*MAPWIDTH+gx);
              if((gx>=MAPWIDTH) || (gy>=MAPDEPTH) || gx<0 || gy<0){
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
          let xOffset;
          let dist;
          let topOfWall;
          let bottomOfWall;
          if(distToHzGridBeingHit < distToVtGridBeingHit){
            this.g.hud.drawRayOnOverheadMap(i_x, hzGrid);
            dist=distToHzGridBeingHit;
            xOffset=i_x%TILE_SIZE;
          }else{
            //the vertical wall is closer than the horizontal wall
            this.g.hud.drawRayOnOverheadMap(vtGrid, i_y);
            dist=distToVtGridBeingHit;
            xOffset=i_y%TILE_SIZE;
          }
          // correct distance (compensate for the fishbown effect)
          dist /= TABLES[tFISH][castCol];
          //projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
          let projWallHeight=(WALL_HEIGHT*this.fPlayerDistToTheProjPlane/dist);
          bottomOfWall = this.fProjPlaneYCenter+(projWallHeight*0.5);
          topOfWall = this.fProjPlaneYCenter-(projWallHeight*0.5);
          if(topOfWall<0) topOfWall=0;
          if(bottomOfWall>=BASEH){//PROJECTIONHEIGHT){
            bottomOfWall=BASEH-1;//PROJECTIONHEIGHT-1;
          }
          // Add simple shading so that farther wall slices appear darker.
          // 750 is arbitrary value of the farthest distance.
          dist=int(dist);
          let color=255-(dist/750.0)*255.0;
          // don't allow it to be too dark
          if(color<20) color=20;
          if(color>255) color=255;
          color=int(color);
          color=_S.color3(color,color,color);
          if(_G.textureUsed){
            drawWallSlice(this, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, color, xOffset);
            //drawFloor(this,castArc, castCol,bottomOfWall,1,color);
            //drawCeiling(this,castArc, castCol,topOfWall,1,color);
          }else{
            paintRect(this.g.gfx, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, color);
          }
          castArc+=1;
          if(castArc>=ANGLE360) castArc-=ANGLE360;
        }
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
          if((FMAP.charAt((playerYCell*MAPWIDTH)+playerXCell+1)!=".")&&
             (playerXCellOffset > (TILE_SIZE-minDistanceToWall))){
            // back player up
            _G.fPlayerX -= (playerXCellOffset-(TILE_SIZE-minDistanceToWall));
          }
        }else{ // moving left
          if((FMAP.charAt((playerYCell*MAPWIDTH)+playerXCell-1)!=".")&&
             (playerXCellOffset < (minDistanceToWall))){
            // back player up
            _G.fPlayerX += (minDistanceToWall-playerXCellOffset);
          }
        }
        if(dy<0){ // moving up
          if((FMAP.charAt(((playerYCell-1)*MAPWIDTH)+playerXCell)!=".")&&
             (playerYCellOffset < (minDistanceToWall))){
            _G.fPlayerY += (minDistanceToWall-playerYCellOffset);
          }
        }else{ // moving down
          if((FMAP.charAt(((playerYCell+1)*MAPWIDTH)+playerXCell)!=".")&&
             (playerYCellOffset > (TILE_SIZE-minDistanceToWall))){
            _G.fPlayerY -= (playerYCellOffset-(TILE_SIZE-minDistanceToWall ));
          }
        }
      },
      preUpdate(dt){
        this.g.hud.gfx.clear();
        this.g.gfx.clear();
        this.removeChildren();
        if(_G.skyUsed)
          this.g.drawSky();
        this.insert(this.g.gfx);
        this.insert(this.g.hud.gfx);
      },
      postUpdate(dt){
        this.g.wrapArena();
        this.g.drawBg();
        this.g.hud.drawMap();
        this.raycast();
        this.doMotion();
      }

    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawCeiling(scene, castArc, castCol, topOfWall, width, tint){
      let B=Mojo.tcached("tile41.png");
      for(let row=int(topOfWall); row >=0; --row){
        let ratio=(WALL_HEIGHT-scene.fPlayerHeight)/(scene.fProjPlaneYCenter-row);
        let diagDist= int(scene.fPlayerDistToTheProjPlane*ratio*TABLES[tFISH][castCol]);
        let yEnd = int(diagDist* TABLES[tSIN][castArc]);
        let xEnd = int(diagDist* TABLES[tCOS][castArc]);
        // Translate relative to viewer coordinates:
        xEnd+=_G.fPlayerX;
        yEnd+=_G.fPlayerY;
        // Get the tile intersected by ray:
        let cellX = int(xEnd / TILE_SIZE);
        let cellY = int(yEnd / TILE_SIZE);
        if((cellX<MAPWIDTH) && (cellY<MAPDEPTH) && cellX>=0 && cellY>=0){
          // Find offset of tile and column in texture
          let ty = int(yEnd % TILE_SIZE);
          let tx = int(xEnd % TILE_SIZE);
          let s= _S.sprite(new PIXI.Texture(B,new PIXI.Rectangle(tx,ty,1,1)));
          s.width = width*PROJRATIO;
          s.height= PROJRATIO;
          s.x=castCol*PROJRATIO;
          s.y=row*PROJRATIO;
          scene.insert(s);
        }
      }
    }
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawFloor(scene, castArc, castCol, bottomOfWall, width, tint){
      let B=Mojo.tcached("floortile.png");
      for(let row=int(bottomOfWall); row<BASEH; ++row){
        let ratio=scene.fPlayerHeight/(row-scene.fProjPlaneYCenter);
        let diagDist= int(scene.fPlayerDistToTheProjPlane*ratio*TABLES[tFISH][castCol]);
        let yEnd = int(diagDist * TABLES[tSIN][castArc]);
        let xEnd = int(diagDist * TABLES[tCOS][castArc]);
        // Translate relative to viewer coordinates:
        xEnd += _G.fPlayerX;
        yEnd += _G.fPlayerY;
        // Get the tile intersected by ray:
        let cellX = int(xEnd / TILE_SIZE);
        let cellY = int(yEnd / TILE_SIZE);
        if((cellX<MAPWIDTH) && (cellY<MAPDEPTH) && cellX>=0 && cellY>=0){
            // Find offset of tile and column in texture
          let tx = int(xEnd % TILE_SIZE);
          let ty = int(yEnd % TILE_SIZE);
          let s= _S.sprite(new PIXI.Texture(B,new PIXI.Rectangle(tx,ty,1,1)));
          s.width = width*PROJRATIO;
          s.height= PROJRATIO;
          s.x=castCol*PROJRATIO;
          s.y=row*PROJRATIO;
          scene.insert(s);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawWallSlice(scene, x, y, width, height, tint, xOffset){
      let b= Mojo.tcached("wall64.png");
      let t= new PIXI.Texture(b,new PIXI.Rectangle(int(xOffset),0,width,b.height));
      let s= _S.sprite(t);
      s.height= height*PROJRATIO;
      s.width = width*PROJRATIO;
      s.x=x*PROJRATIO;
      s.y=y*PROJRATIO;
      scene.insert(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function HUD(scene){
      scene.insert(this.gfx=_S.graphics());
      this.fMinimapWidth=6;
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
        for(let css,r=0; r<MAPDEPTH; ++r){
          for(let c=0; c<MAPWIDTH;++c){
            css="black";
            if(FMAP.charAt(r*MAPWIDTH+c)=="#"){
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
    assetFiles: ["tile2.png","brick2.png","tile43.png",
                 "tile42.png","tile41.png",
                 "wall64.png","floortile.png","deathvalley.jpg"],
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


