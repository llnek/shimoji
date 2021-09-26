(function(window){

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
      },
      raycast(){
        let vtGrid;  // horizotal or vertical coordinate of intersection
        let hzGrid; // theoritically, this will be multiple of TILE_SIZE
        // , but some trick did here might cause the values off by 1
        let distToNextVtGrid; // how far to the next bound (this is multiple of
        let distToNextHzGrid; // tile size)
        let i_x, i_y; // interseection
        let distToNextXI;
        let distToNextYI;
        let xGridIndex; // the current cell that the ray is in
        let yGridIndex;
        let distToVtGridBeingHit; // the distance of the x and y ray intersections from
        let distToHzGridBeingHit; // the viewpoint
        let castArc = _G.fPlayerArc;
        castArc-= ANGLE30; // trace the rays from the left
        if(castArc < 0) castArc += ANGLE360;

        //the big loop
        for(let mapIndex,xtemp,ytemp,castCol=0; castCol<PROJECTIONWIDTH; ++castCol){
          // Ray is facing down
          if(castArc > ANGLE0 && castArc < ANGLE180){
            // truncuate then add to get the coordinate of the FIRST grid (horizontal
            // wall) that is in front of the player (this is in pixel unit) ROUNDED DOWN
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE  + TILE_SIZE;
            // compute distance to the next horizontal wall
            distToNextHzGrid = TILE_SIZE;
            xtemp = TABLES[iTAN][castArc]*(hzGrid-_G.fPlayerY);
            // we can get the vertical distance to that wall by (hzGrid-playerY)
            // we can get the horizontal distance to that wall by 1/tan(arc)*verticalDistance
            // find the x interception to that wall
          }else{// Else, the ray is facing up
            hzGrid = int(_G.fPlayerY/TILE_SIZE)*TILE_SIZE;
            distToNextHzGrid = -TILE_SIZE;
            xtemp = TABLES[iTAN][castArc]*(hzGrid - _G.fPlayerY);
            --hzGrid;
          }
          i_x = xtemp + _G.fPlayerX;
          // LOOK FOR HORIZONTAL WALL
          // If ray is directly facing right or left, then ignore it
          if(castArc==ANGLE0 || castArc==ANGLE180){
            distToHzGridBeingHit=Number.MAX_VALUE;
          }else{ // else, move the ray until it hits a horizontal wall
            distToNextXI = TABLES[xSTEP][castArc];
            while(true){
              yGridIndex = int(hzGrid/TILE_SIZE);
              xGridIndex = int(i_x/TILE_SIZE);
              mapIndex=int(yGridIndex*MAP_WIDTH+xGridIndex);
              // If we've looked as far as outside the map range, then bail out
              if((xGridIndex>=MAP_WIDTH) || (yGridIndex>=MAP_HEIGHT) || xGridIndex<0 || yGridIndex<0){
                distToHzGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(FMAP.charAt(mapIndex)!="."){
                // If the grid is not an Opening, then stop
                distToHzGridBeingHit  = (i_x-_G.fPlayerX)* TABLES[iCOS][castArc];
                break;
              }else{ // Else, keep looking.  At this point, the ray is not blocked, extend the ray to the next grid
                i_x += distToNextXI;
                hzGrid += distToNextHzGrid;
              }
            }
          }
          // FOLLOW X RAY
          if(castArc < ANGLE90 || castArc > ANGLE270){
            vtGrid = TILE_SIZE + int(_G.fPlayerX/TILE_SIZE)*TILE_SIZE;
            distToNextVtGrid = TILE_SIZE;
            ytemp = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
          }else{ // RAY FACING LEFT
            vtGrid = int(_G.fPlayerX/TILE_SIZE)*TILE_SIZE;
            distToNextVtGrid = -TILE_SIZE;
            ytemp = TABLES[tTAN][castArc]*(vtGrid - _G.fPlayerX);
            --vtGrid;
          }
          i_y = ytemp + _G.fPlayerY;
          // LOOK FOR VERTICAL WALL
          if(castArc==ANGLE90||castArc==ANGLE270){
            distToVtGridBeingHit = Number.MAX_VALUE;
          }else{
            distToNextYI = TABLES[ySTEP][castArc];
            while(true){
              // compute current map position to inspect
              xGridIndex = int(vtGrid/TILE_SIZE);
              yGridIndex = int(i_y/TILE_SIZE);
              mapIndex=int(yGridIndex*MAP_WIDTH+xGridIndex);
              if((xGridIndex>=MAP_WIDTH) || (yGridIndex>=MAP_HEIGHT) || xGridIndex<0 || yGridIndex<0){
                distToVtGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(FMAP.charAt(mapIndex)!="."){
                distToVtGridBeingHit =(i_y-_G.fPlayerY)* TABLES[iSIN][castArc];
                break;
              }else{
                i_y += distToNextYI;
                vtGrid += distToNextVtGrid;
              }
            }
          }
          // DRAW THE WALL SLICE
          let scaleFactor;
          let dist;
          let topOfWall;   // used to compute the top and bottom of the sliver that
          let bottomOfWall;   // will be the staring point of floor and ceiling
          // determine which ray strikes a closer wall.
          // if yray distance to the wall is closer, the yDistance will be shorter than
          // the xDistance
          if(distToHzGridBeingHit < distToVtGridBeingHit){
            _G.HUD.drawRayOnOverheadMap(i_x, hzGrid);
            dist=distToHzGridBeingHit;
          }else{
            // else, we use xray instead (meaning the vertical wall is closer than
            //   the horizontal wall)
            _G.HUD.drawRayOnOverheadMap(vtGrid, i_y);
            dist=distToVtGridBeingHit;
          }
          // correct distance (compensate for the fishbown effect)
          dist /= TABLES[tFISH][castCol];
          // projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
          let projWallHeight=(WALL_HEIGHT*this.fPlayerDistToTheProjPlane/dist);
          bottomOfWall = this.fProjPlaneYCenter+(projWallHeight*0.5);
          topOfWall = this.fProjPlaneYCenter-(projWallHeight*0.5);
          if(topOfWall<0) topOfWall=0;
          if(bottomOfWall>=PROJECTIONHEIGHT)
            bottomOfWall=PROJECTIONHEIGHT-1;
          // Add simple shading so that farther wall slices appear darker.
          // 850 is arbitrary value of the farthest distance.
          dist=int(dist);
          let color=255-(dist/750.0)*255.0;
          // don't allow it to be too dark
          if(color<20) color=20;
          if(color>255) color=255;
          color=int(color);
          paintRect(this.g.gfx, castCol, topOfWall, 1, (bottomOfWall-topOfWall)+1, _S.color3(color,color,color));
          // TRACE THE NEXT RAY
          castArc+=1;
          if(castArc>=ANGLE360) castArc-=ANGLE360;
        }
      },
      preUpdate(dt){
        _G.HUD.g.gfx.clear();
        this.g.gfx.clear();
      },
      postUpdate(dt){
        this.g.drawBackgd();
        _G.HUD.drawMap();
        this.raycast();
        if(_I.keyDown(_I.LEFT)){
          _G.fPlayerArc-=ANGLE10;
          if(_G.fPlayerArc<ANGLE0) _G.fPlayerArc+=ANGLE360;
        }
        if(_I.keyDown(_I.RIGHT)){
          _G.fPlayerArc+=ANGLE10;
          if(_G.fPlayerArc>=ANGLE360) _G.fPlayerArc-=ANGLE360;
        }
        //  _____     _
        // |\ arc     |
        // |  \       y
        // |    \     |
        //            -
        // |--x--|
        //
        //  sin(arc)=y/diagonal
        //  cos(arc)=x/diagonal   where diagonal=speed
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
      }

    });


    _Z.defScene("HUD",{
      setup(){
        this.insert(this.g.gfx=_S.graphics());
        this.fMinimapWidth=10;
        this.fPlayerMapX=0;
        this.fPlayerMapY=0;
        _G.HUD=this;
      },
      // draw line from the player position to the position where the ray intersect with wall
      drawRayOnOverheadMap(x,y){
        this.g.gfx.lineStyle(2,_S.color("#00ff00"));
        this.g.gfx.moveTo(this.fPlayerMapX, this.fPlayerMapY);
        this.g.gfx.lineTo(PROJECTIONWIDTH+(x*this.fMinimapWidth/TILE_SIZE), y*this.fMinimapWidth/TILE_SIZE);
      },
      // draw a red line indication the player's direction
      drawPlayerPOV(){
        this.g.gfx.lineStyle(2,_S.color("#ff0000"));
        this.g.gfx.moveTo( this.fPlayerMapX, this.fPlayerMapY);
        this.g.gfx.lineTo(this.fPlayerMapX+ TABLES[tCOS][_G.fPlayerArc]*10,
                          this.fPlayerMapY+ TABLES[tSIN][_G.fPlayerArc]*10);
      },
      drawMap(dt){
        for(let css,r=0; r<MAP_HEIGHT; ++r){
          for(let c=0; c<MAP_WIDTH;++c){
            css="white";
            if(FMAP.charAt(r*MAP_WIDTH+c)=="#"){
              css="black";
            }
            paintRect(this.g.gfx, PROJECTIONWIDTH+(c*this.fMinimapWidth),
                      (r*this.fMinimapWidth), this.fMinimapWidth, this.fMinimapWidth, css);
          }
        }
        this.fPlayerMapX=PROJECTIONWIDTH+((_G.fPlayerX/TILE_SIZE) * this.fMinimapWidth);
        this.fPlayerMapY=((_G.fPlayerY/TILE_SIZE) * this.fMinimapWidth);
        this.drawPlayerPOV();
      }
    });


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
      Mojo.Scenes.runScene("HUD");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


