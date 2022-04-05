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

  /**Checkout the excellent articles and code from
   * https://permadi.com/1996/05/ray-casting-tutorial-table-of-contents/
   */
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           FX: _F,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Wolf3D",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;
    const FPSSUM= 24/60;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int = Math.floor;
    const cos= Math.cos;
    const sin=Math.sin;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // size of tile (wall height)
    const TILESZ = 64,
      WALL_HEIGHT = 64,
      MAPWIDTH=20,
      MAPDEPTH=20;

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
               "#..##..........##..#"+
               "#..##..........##..#"+
               "#..................#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#.....###.####.....#"+
               "#............#.....#"+
               "#.....#......#.....#"+
               "#.....#...X..#.....#"+
               "#.....#............#"+
               "#.....###.####.....#"+
               "#.......#.#........#"+
               "#.......#.#........#"+
               "#..##...#.#....##..#"+
               "#..##...#.#....##..#"+
               "#..................#"+
               "####################";

    const map9=(function randGenMapStr(s){
      let lastY=MAPDEPTH-1,
          x,y, lastX=MAPWIDTH-1;
      for(y=0;y<MAPDEPTH;++y)
      for(x=0;x<MAPWIDTH;++x){
        if(y==0||y==lastY){
          s +="#"
        }else{
          if(x==0||x==lastX){
            s += "#";
          }else{
            s += _.rand()<0.2?"#":".";
          }
        }
      }
      return s;
    })("");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const vspace=(c)=> FMAP.charAt(c) == "." || FMAP.charAt(c) == "X";

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //you can tweak this by pointing to a different map
    const FMAP=map6;
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const BASEW=320,
      BASEH=200,
      BASED=276,
      PROJPLANE_MIDY = BASEH/2,
      PLAYERDIST_PROJPLANE = BASED,
      [PROJRATIO, PROJECTIONWIDTH, PROJECTIONHEIGHT] = (function(r){
        if(Mojo.width > 1680){
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
    Mojo.CON.log(`viewport width=${PROJECTIONWIDTH}, height=${PROJECTIONHEIGHT}`);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    // FOV = 60
    const ANGLE60 = BASEW,//PROJECTIONWIDTH;
      ANGLE30 = _M.ndiv(ANGLE60,2),
      ANGLE15 = _M.ndiv(ANGLE30,2),
      ANGLE90 = int(ANGLE30*3),
      ANGLE180 = int(ANGLE90*2),
      ANGLE270 = int(ANGLE90*3),
      ANGLE360 = int(ANGLE60*6),
      ANGLE0 = 0,
      ANGLE5 = _M.ndiv(ANGLE30,6),
      ANGLE10 = int(ANGLE5*2),
      ANGLE45 = int(ANGLE15*3);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //trigonometric tables (the ones with "I" such as ISiTable are "Inverse" table)
    //static table to speed things up
    const tSIN=0,
      iSIN=1,
      tCOS=2,
      iCOS=3,
      tTAN=4,
      iTAN=5,
      tFISH=6,
      xSTEP=7,
      ySTEP=8,
      TABLES=_.fill(9,i=> new Array(ANGLE360+1));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    (function(R){
      for(let v,r,i=0; i<=ANGLE360; ++i){
        r= i*R + 0.00001;// add tiny amount to avoid 0 (div by 0)
        v=TABLES[tSIN][i]=sin(r);
        TABLES[iSIN][i]=1.0/v;
        v=TABLES[tCOS][i]=cos(r);
        TABLES[iCOS][i]=1.0/v;
        v=TABLES[tTAN][i]=Math.tan(r);
        TABLES[iTAN][i]=1.0/v;
        //notice that the dist between walls are the same
        //if we know the angle
        //  _____|_/next xi______________
        //       |
        //  ____/|next xi_________   slope = tan = height / dist between xi's
        //     / |
        //  __/__|_________  dist between xi = height/tan where height=tile size
        // old xi|
        // distance between xi = x_step[view_angle];
        if(i>=ANGLE90 && i<ANGLE270){//facing LEFT
          v= TABLES[xSTEP][i] = TILESZ / TABLES[tTAN][i];
          if(v>0) TABLES[xSTEP][i]= -v;
        }else{ // facing RIGHT
          v= TABLES[xSTEP][i] = TILESZ / TABLES[tTAN][i];
          if(v<0) TABLES[xSTEP][i]= -v;
        }
        if(i>=ANGLE0 && i<ANGLE180){//facing DOWN
          v= TABLES[ySTEP][i] = TILESZ* TABLES[tTAN][i];
          if(v<0) TABLES[ySTEP][i]= -v;
        }else{ // FACING UP
          v= TABLES[ySTEP][i] = TILESZ* TABLES[tTAN][i];
          if(v>0) TABLES[ySTEP][i]= -v;
        }
      }
      // Create table for fixing FISHBOWL distortion
      for(let i=-ANGLE30; i<=ANGLE30; ++i){
        // we don't have negative angle, so make it start at 0
        // this will give range from column 0 to (PROJECTONPLANEWIDTH)
        // since we only will need to use those range
        TABLES[tFISH][i+ANGLE30] = 1.0/cos(i*R)
      }
    })(Math.PI/ANGLE180);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert(_S.fillMax(_S.sprite("bg.jpg")));

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function paintRect(gfx,x, y, w, h, c){
      gfx.beginFill(_S.color(c));
      gfx.drawRect(x, y, w, h);
      gfx.endFill();
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function initPlayerPos(mapstr){
      let x,y,n,rc,i, a=mapstr.split("");
      while(rc != "."){
        [rc,i]= _.randItem(a,true);
        if(rc == "."){
          y= _M.ndiv(i,MAPWIDTH);
          x= (i%MAPWIDTH);
          if(a[(y+1)*MAPWIDTH+x]=="."&&
             a[(y-1)*MAPWIDTH+x]=="."&&
             a[y*MAPWIDTH+x+1]=="."&&
             a[y*MAPWIDTH+x-1]=="."){
            _G.playerY= int(y*TILESZ + TILESZ/2);
            _G.playerX= int(x*TILESZ + TILESZ/2);
          }else{
            rc=0;
          }
        }
      }
      a= [ANGLE60, ANGLE30, ANGLE15, ANGLE0,
          ANGLE90, ANGLE180, ANGLE270, ANGLE5, ANGLE10, ANGLE45];
      n= [60, 30, 15, 0, 90, 180, 270, 5,10, 45];
      [_G.playerArc,i] = _.randItem(a,true);
      Mojo.CON.log(`initial playerX= ${_G.playerX}, playerY= ${_G.playerY}, angle=${n[i]}`);
    }

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
    _Z.scene("PlayGame",{
      setup(){
        let self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          fps:0,
          initLevel(){
            //center the scene!!!!!
            let sy= _M.ndiv(Mojo.height-PROJECTIONHEIGHT,2),
              sx= _M.ndiv(Mojo.width-PROJECTIONWIDTH,2);
            self.cvars={ i_x:0, i_y:0,
                         distX:0, distY:0,
                         vtGrid:0, hzGrid:0 };
            _.inject(_G,{
              prev:{x:Infinity,y:Infinity,dir:Infinity},
              playerHeight: WALL_HEIGHT/2,
              playerSpeed: 16,
              textureUsed:true,
              skyUsed:true,
              arena:{ x1:sx, y1:sy, x2: sx+PROJECTIONWIDTH, y2: sy+PROJECTIONHEIGHT }
            });
            initPlayerPos(FMAP);
            this.box=_S.container();
            this.gfx=_S.graphics();
            self.insert( _V.set(this.box,sx,sy));
            return self.insert(_S.opacity(this.gfx2=_S.graphics(), 1));
          },
          drawBg(){
            let width=PROJRATIO*BASEW,
              height=PROJRATIO, r,sx=0,sy=0,step=1,c=255;
            //scene is already centered, so start = 0,0
            for(r=0; r<BASEH/2; r+=step){//sky
              if(!_G.skyUsed){
                this.gfx.beginFill(_S.color3(c, 125, 225));
                this.gfx.drawRect(sx,sy+(r*height),width,height);
                this.gfx.endFill();
              }
              --c;
            }
            for(c=0, r=BASEH/2; r<BASEH; r+=step){//floor
              this.gfx.beginFill(_S.color3(65, c, 65));
              this.gfx.drawRect(sx,sy+(r*height),width, height);
              this.gfx.endFill();
              ++c;
            }
          },
          drawSky(){
            if(_G.skyUsed){
              let sky= _S.sprite("sky.jpg"),
                width = sky.width * (BASEH  / sky.height) * 2,
                sx=0,sy=0, left = (_G.playerArc / ANGLE360) * -width;
              sky.x=sx+left*PROJRATIO;
              sky.y=sy;
              sky.width=width*PROJRATIO;
              sky.height=BASEH*PROJRATIO;
              this.box.addChild(_S.lift(sky));
              if(left < width-BASEW){
                sky= _S.sprite("sky.jpg");
                sky.x= sx+PROJRATIO*(left+width);
                sky.y=sy;
                sky.width=PROJRATIO*width;
                sky.height=BASEH*PROJRATIO;
                this.box.addChild(_S.lift(sky));
              }
            }
          },
          initHUD(){
            return this.hud=new HUD(self)
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel() && this.g.initHUD();
        //put a mat around the arena to hide overflows
        _Z.run("PhotoMat", _.inject({color:"black"},_G.arena));
        if(1){
          let
            alpha=0.5,
            color="grey",
            radius= 42*K,
            fontName=UI_FONT,fontSize= 48*K;
          _Z.run("HotKeys",{
            color,alpha,radius,fontName,fontSize,
            cb(obj){
              _V.set(obj.right, Mojo.width-obj.right.width,Mojo.height-obj.right.height);
              _S.pinLeft(obj.right,obj.left,obj.right.width/3);
              _V.set(obj.up, obj.up.width,Mojo.height-obj.up.height);
              _S.pinRight(obj.up,obj.down,obj.up.width/3);
              return obj;
            }
          });
        }

        this.g.oldFrameRate= Mojo.frameRate;
        Mojo.frameRate=function(){
          return 1/24;
        }
      },
      dispose(){
        Mojo.frameRate= this.g.oldFrameRate;
      },
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //check algo from permadi...
      //https://permadi.com/1996/05/ray-casting-tutorial-7/
      //https://permadi.com/1996/05/ray-casting-tutorial-8/
      raycast(){
        // trace the rays from the left,change if FOV changes!
        let castArc = _G.playerArc;
        castArc-= ANGLE30;
        if(castArc < 0) castArc += ANGLE360;
        for(let castCol=0; castCol<BASEW; ++castCol){
          this.step(castArc,castCol,this.cvars);
          if(++castArc>=ANGLE360) castArc-=ANGLE360;
        }
      },
      step(castArc,castCol,CV){
        let self=this,
          dx,dy,gx,gy,idx, vtStep, hzStep;
        let tan_v= TABLES[tTAN][castArc],
          tan_i= TABLES[iTAN][castArc],
          sin_v= TABLES[iSIN][castArc],
          cos_v= TABLES[iCOS][castArc];
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        //DEAL WITH HORZ LINES(Y), VERT LINES(X), find 1st intercept point
        (function horzIX(rDir){//face down or up
          CV.hzGrid = int(_G.playerY/TILESZ)*TILESZ  + (rDir<0?TILESZ:0);
          CV.i_x = _G.playerX + tan_i*(CV.hzGrid-_G.playerY);
          hzStep = TILESZ * (rDir<0?1:-1);
          CV.hzGrid -= (rDir<0?0:1);
        })((castArc>ANGLE0 && castArc<ANGLE180)?-1:1);
        (function vertIY(rDir){//face right or left
          CV.vtGrid = int(_G.playerX/TILESZ)*TILESZ + (rDir>0?TILESZ:0);
          CV.i_y = _G.playerY + tan_v*(CV.vtGrid - _G.playerX);
          vtStep = TILESZ * (rDir>0?1:-1);
          CV.vtGrid -= (rDir>0?0:1);
        })((castArc < ANGLE90 || castArc > ANGLE270)?1:-1);
        //got our first point
        dx= TABLES[xSTEP][castArc];
        dy= TABLES[ySTEP][castArc];
        CV.distY=
        CV.distX=Infinity;
        function probe(H){
          gx = H ? _M.ndiv(CV.i_x,TILESZ) : _M.ndiv(CV.vtGrid,TILESZ);
          gy = H ? _M.ndiv(CV.hzGrid,TILESZ) : _M.ndiv(CV.i_y,TILESZ);
          if(gx>=MAPWIDTH || gy>=MAPDEPTH || gx<0 || gy<0){
            H ? (CV.distY=Infinity)
              : (CV.distX=Infinity)
          }else if(!vspace(int(gy*MAPWIDTH+gx))){
            H ? (CV.distY= cos_v * (CV.i_x-_G.playerX))
              : (CV.distX= sin_v * (CV.i_y-_G.playerY))
          }else{
            if(H){
              CV.i_x += dx;
              CV.hzGrid += hzStep;
            }else{
              CV.i_y += dy;
              CV.vtGrid += vtStep;
            }
            return 1;
          }
        }
        if(castArc==ANGLE0||castArc==ANGLE180){}else{
          while(probe(1));
        }
        if(castArc==ANGLE90||castArc==ANGLE270){}else{
          while(probe(0));
        }
        this.drawCol(castArc,castCol,CV);
      },
      drawCol(castArc,castCol,CV){
        let color, vertHit, xOffset, dist, topOfWall, bottomOfWall,projWallHeight;
        if(CV.distY< CV.distX){
          this.g.hud.drawRayOnOverheadMap(CV.i_x, CV.hzGrid);
          dist=CV.distY;
          xOffset=CV.i_x%TILESZ;
        }else{
          //the vertical wall is closer than the horizontal wall
          this.g.hud.drawRayOnOverheadMap(CV.vtGrid, CV.i_y);
          dist=CV.distX;
          xOffset=CV.i_y%TILESZ;
          vertHit=true;
        }
        // correct distance (compensate for the fishbown effect)
        dist /= TABLES[tFISH][castCol];
        //projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
        projWallHeight=(WALL_HEIGHT*PLAYERDIST_PROJPLANE/dist);
        bottomOfWall = PROJPLANE_MIDY+(projWallHeight*0.5);
        topOfWall = PROJPLANE_MIDY-(projWallHeight*0.5);
        if(topOfWall<0) topOfWall=0;
        if(bottomOfWall>=BASEH){ bottomOfWall=BASEH-1 }
        // Add simple shading so that farther wall slices appear darker.
        // 750 is arbitrary of the farthest distance, don't allow it to be too dark
        color=255-(dist/750.0)*255.0;
        if(color>255) color=255;
        if(color<20) color=20;
        color=int(color);
        if(_G.textureUsed){
          drawWallSlice(this, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, color);
          drawGoal(this,castArc, castCol,bottomOfWall,1,color);
          //TODO: uncomment to demo floor and ceiling, very slow though
          //drawFloor(this,castArc, castCol,bottomOfWall,1,color);
          //drawCeiling(this,castArc, castCol,topOfWall,1,color);
        }else{
          color=_S.color3(color,color,color);
          paintRect(this.g.gfx, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, color);
        }
      },
      doMotion(){
        _G.prev.dir=_G.playerArc;
        _G.prev.x=_G.playerX;
        _G.prev.y=_G.playerY;

        if(_I.keyDown(_I.LEFT)){
          _G.playerArc-=ANGLE10;
          if(_G.playerArc<ANGLE0) _G.playerArc+=ANGLE360;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.playerArc+=ANGLE10;
          if(_G.playerArc>=ANGLE360) _G.playerArc-=ANGLE360;
        }
        let playerXDir= TABLES[tCOS][_G.playerArc],
          dx=0,dy=0, playerYDir= TABLES[tSIN][_G.playerArc];
        //move forward
        if(_I.keyDown(_I.UP)){
          dx=Math.round(playerXDir*_G.playerSpeed);
          dy=Math.round(playerYDir*_G.playerSpeed);
        }
        if(_I.keyDown(_I.DOWN)){
          dx=-Math.round(playerXDir*_G.playerSpeed);
          dy=-Math.round(playerYDir*_G.playerSpeed);
        }
        _G.playerX+=dx;
        _G.playerY+=dy;
        // CHECK COLLISIONS
        // compute cell position
        let playerXCell = _M.ndiv(_G.playerX,TILESZ),
          playerYCell = _M.ndiv(_G.playerY,TILESZ),
          // compute position relative to cell (ie: how many pixel from edge of cell)
          playerXCellOffset = _G.playerX % TILESZ,
          playerYCellOffset = _G.playerY % TILESZ;
        let minDistanceToWall=30;

        //check if found goal
        if(FMAP.charAt((playerYCell*MAPWIDTH)+playerXCell)=="X"){
          _S.die(this);
          _.delay(100,()=> _Z.modal("EndGame",{

            fontSize:64*Mojo.getScaleFactor(),
            replay:{name:"PlayGame"},
            quit:{name:"Splash", cfg:SplashCfg},
            msg:"You Win!",
            winner:1

          }));
          return;
        }

        // make sure the player don't bump into walls
        if(dx>0){ // moving right
          if((!vspace((playerYCell*MAPWIDTH)+playerXCell+1))&&
             (playerXCellOffset > (TILESZ-minDistanceToWall))){
            // back player up
            _G.playerX -= (playerXCellOffset-(TILESZ-minDistanceToWall));
          }
        }else{ // moving left
          if((!vspace((playerYCell*MAPWIDTH)+playerXCell-1))&&
             (playerXCellOffset < (minDistanceToWall))){
            // back player up
            _G.playerX += (minDistanceToWall-playerXCellOffset);
          }
        }
        if(dy<0){ // moving up
          if((!vspace(((playerYCell-1)*MAPWIDTH)+playerXCell))&&
             (playerYCellOffset < (minDistanceToWall))){
            _G.playerY += (minDistanceToWall-playerYCellOffset);
          }
        }else{ // moving down
          if((!vspace(((playerYCell+1)*MAPWIDTH)+playerXCell))&&
             (playerYCellOffset > (TILESZ-minDistanceToWall))){
            _G.playerY -= (playerYCellOffset-(TILESZ-minDistanceToWall ));
          }
        }
      },
      preUpdate(dt){
        if(this.checkIdle()){}else{
          this.g.box.removeChildren();
          this.g.gfx.clear();
          this.g.gfx2.clear();
          this.g.drawSky();
          this.g.box.addChild(this.g.gfx);
        }
      },
      postUpdate(dt){
        if(this.checkIdle()){}else{
          this.g.drawBg();
          this.g.hud.drawMap();
          this.raycast();
        }
        this.doMotion();
      },
      checkIdle(){
        return _.feq(_G.prev.x, _G.playerX) &&
               _.feq(_G.prev.y, _G.playerY) &&
               _.feq(_G.prev.dir, _G.playerArc)
      }
    });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawCeiling(scene, castArc, castCol, topOfWall, width, tint){
      let B=Mojo.tcached("tile41.png");
      for(let row=int(topOfWall); row >=0; --row){
        let ratio=(WALL_HEIGHT-_G.playerHeight)/(PROJPLANE_MIDY-row);
        let diagDist= int(PLAYERDIST_PROJPLANE*ratio*TABLES[tFISH][castCol]);
        let yEnd = int(diagDist* TABLES[tSIN][castArc]);
        let xEnd = int(diagDist* TABLES[tCOS][castArc]);
        // Translate relative to viewer coordinates:
        xEnd+=_G.playerX;
        yEnd+=_G.playerY;
        // Get the tile intersected by ray:
        let cellX = _M.ndiv(xEnd , TILESZ),
          cellY = _M.ndiv(yEnd , TILESZ);
        if((cellX<MAPWIDTH) && (cellY<MAPDEPTH) && cellX>=0 && cellY>=0){
          // Find offset of tile and column in texture
          let ty = int(yEnd % TILESZ);
          let tx = int(xEnd % TILESZ);
          let s= _S.sprite(new PIXI.Texture(B,new PIXI.Rectangle(tx,ty,1,1)));
          s.width = width*PROJRATIO;
          s.height= PROJRATIO;
          s.x=castCol*PROJRATIO;
          s.y=row*PROJRATIO;
          scene.g.box.addChild(s);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawFloor(scene, castArc, castCol, bottomOfWall, width, tint){
      let B=Mojo.tcached("floortile.png");
      for(let row=int(bottomOfWall); row<BASEH; ++row){
        let ratio=_G.playerHeight/(row-PROJPLANE_MIDY);
        let diagDist= int(PLAYERDIST_PROJPLANE*ratio*TABLES[tFISH][castCol]);
        let yEnd = int(diagDist * TABLES[tSIN][castArc]);
        let xEnd = int(diagDist * TABLES[tCOS][castArc]);
        // Translate relative to viewer coordinates:
        xEnd += _G.playerX;
        yEnd += _G.playerY;
        // Get the tile intersected by ray:
        let cellX = _M.ndiv(xEnd , TILESZ),
          cellY = _M.ndiv(yEnd , TILESZ);
        if((cellX<MAPWIDTH) && (cellY<MAPDEPTH) && cellX>=0 && cellY>=0){
            // Find offset of tile and column in texture
          let tx = int(xEnd % TILESZ);
          let ty = int(yEnd % TILESZ);
          let s= _S.sprite(new PIXI.Texture(B,new PIXI.Rectangle(tx,ty,1,1)));
          s.width = width*PROJRATIO;
          s.height= PROJRATIO;
          s.x=castCol*PROJRATIO;
          s.y=row*PROJRATIO;
          scene.g.box.addChild(s);
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawGoal(scene, castArc, castCol, bottomOfWall, width, tint){
      for(let row=int(bottomOfWall); row<BASEH; ++row){
        let ratio=_G.playerHeight/(row-PROJPLANE_MIDY);
        let diagDist= int(PLAYERDIST_PROJPLANE*ratio*TABLES[tFISH][castCol]);
        let yEnd = int(diagDist * TABLES[tSIN][castArc]);
        let xEnd = int(diagDist * TABLES[tCOS][castArc]);
        // Translate relative to viewer coordinates:
        xEnd += _G.playerX;
        yEnd += _G.playerY;
        let cellX = _M.ndiv(xEnd , TILESZ),
          cellY = _M.ndiv(yEnd , TILESZ);
        if((cellX<MAPWIDTH) && (cellY<MAPDEPTH) && cellX>=0 && cellY>=0){
          if(FMAP.charAt(cellY*MAPWIDTH+cellX)=="X"){
            let sx=castCol*PROJRATIO;
            let sy=row*PROJRATIO;
            scene.g.gfx.beginFill(_S.SomeColors.red);
            scene.g.gfx.drawRect(sx,sy,width*PROJRATIO, PROJRATIO);
            scene.g.gfx.endFill();
          }
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function drawWallSlice(scene, x, y, width, height, xOffset, tint){
      let b= Mojo.tcached("wall64.png");
      let t= new PIXI.Texture(b,new PIXI.Rectangle(int(xOffset),0,width,b.height));
      let s= _S.sprite(t);
      let sx=0,sy=0;
      s.height= height*PROJRATIO;
      s.width = width*PROJRATIO;
      s.x=sx+ x*PROJRATIO;
      s.y=sy+ y*PROJRATIO;
      scene.g.box.addChild(s);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function HUD(scene,inside=true){
      this.fMinimapWidth=PROJRATIO<2 ? 3: 6;
      this.LEFT=_G.arena.x2;
      this.playerMapX=0;
      this.playerMapY=0;
      if(inside)
        this.LEFT -= (MAPWIDTH*this.fMinimapWidth);
      // draw line from the player position to the position where the ray intersect with wall
      this.drawRayOnOverheadMap=(x,y)=>{
        scene.g.gfx2.lineStyle(2,_S.color("#f6e73b"));
        scene.g.gfx2.moveTo(this.playerMapX, this.playerMapY);
        scene.g.gfx2.lineTo(this.LEFT+(x*this.fMinimapWidth/TILESZ), _G.arena.y1+ y*this.fMinimapWidth/TILESZ);
      };
      // draw a red line indication the player's direction
      this.drawPlayerPOV=()=>{
        scene.g.gfx2.lineStyle(2,_S.color("#ff0000"));
        scene.g.gfx2.moveTo( this.playerMapX, this.playerMapY);
        scene.g.gfx2.lineTo(this.playerMapX+ TABLES[tCOS][_G.playerArc]*10,
                            this.playerMapY+ TABLES[tSIN][_G.playerArc]*10);
      };
      this.drawMap=(dt)=>{
        for(let css,r=0; r<MAPDEPTH; ++r){
          for(let s,c=0;c<MAPWIDTH; ++c){
            s=FMAP.charAt(r*MAPWIDTH+c);
            css=s=="#"? "white":(s=="X"?"red":"black");
            paintRect(scene.g.gfx2, this.LEFT+(c*this.fMinimapWidth),
                      _G.arena.y1+(r*this.fMinimapWidth), this.fMinimapWidth, this.fMinimapWidth, css);
          }
        }
        this.playerMapX=this.LEFT+((_G.playerX/TILESZ) * this.fMinimapWidth);
        this.playerMapY= _G.arena.y1+ ((_G.playerY/TILESZ) * this.fMinimapWidth);
        //this.drawPlayerPOV();
      };
    }

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run with this config
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["tile2.png","tile43.png",
                 "tile42.png","tile41.png",
                 "wall64.png","floortile.png",
                 "bg.jpg","sky.jpg", "game_win.mp3","click.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:24,
    start(...args){ scenes(...args) }

  }));

})(this);


