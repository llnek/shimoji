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

    // Remember that PROJECTIONPLANE = screen.  This demo assumes your screen is 320 pixels wide, 200 pixels high
    const PROJECTIONPLANEWIDTH = 640;
    const PROJECTIONPLANEHEIGHT = 400;

    // We use FOV of 60 degrees.  So we use this FOV basis of the table, taking into account
    // that we need to cast 320 rays (PROJECTIONPLANEWIDTH) within that 60 degree FOV.
    const ANGLE60 = PROJECTIONPLANEWIDTH;
    // You must make sure these values are integers because we're using loopup tables.
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

    // trigonometric tables (the ones with "I" such as ISiTable are "Inverse" table)
    let fSinTable;
    let fISinTable;
    let fCosTable;
    let fICosTable;
    let fTanTable;
    let fITanTable;
    let fFishTable;
    let fXStepTable;
    let fYStepTable;

    // size of tile (wall height)
    const TILE_SIZE = 64;
    const WALL_HEIGHT = 64;
    const MAP_WIDTH=12;
    const MAP_HEIGHT=12;

    function arcToRad(arcAngle){
		  return ((arcAngle*Math.PI)/ANGLE180);
	  }

    function _rgbToHexColor(red, green, blue){
      return "#"+
      red.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+""+
      green.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+""+
      blue.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    }

    function init(self){
      fSinTable = new Array(ANGLE360+1);
      fISinTable = new Array(ANGLE360+1);
      fCosTable = new Array(ANGLE360+1);
      fICosTable = new Array(ANGLE360+1);
      fTanTable = new Array(ANGLE360+1);
      fITanTable = new Array(ANGLE360+1);
      fFishTable = new Array(ANGLE360+1);
      fXStepTable = new Array(ANGLE360+1);
      fYStepTable = new Array(ANGLE360+1);
      for(let r,i=0; i<=ANGLE360;++i){
        // Populate tables with their radian values.
        // (The addition of 0.0001 is a kludge to avoid divisions by 0. Removing it will produce unwanted holes in the wall when a ray is at 0, 90, 180, or 270 degree angles)
        r= arcToRad(i) + (0.0001);
			  fSinTable[i]=sin(r);
			  fISinTable[i]=(1.0/(fSinTable[i]));
			  fCosTable[i]=cos(r);
			  fICosTable[i]=(1.0/(fCosTable[i]));
			  fTanTable[i]=Math.tan(r);
			  fITanTable[i]=(1.0/fTanTable[i]);
        // Next we crate a table to speed up wall lookups.
        //  You can see that the distance between walls are the same
        //  if we know the angle
        //  _____|_/next xi______________
        //       |
        //  ____/|next xi_________   slope = tan = height / dist between xi's
        //     / |
        //  __/__|_________  dist between xi = height/tan where height=tile size
        // old xi|
        //                  distance between xi = x_step[view_angle];
        // Facing LEFT
			  if(i>=ANGLE90 && i<ANGLE270){
          fXStepTable[i] = (TILE_SIZE/fTanTable[i]);
				if(fXStepTable[i]>0)
					fXStepTable[i]=-fXStepTable[i];
        }else{ // facing RIGHT
				  fXStepTable[i] = (TILE_SIZE/fTanTable[i]);
				  if(fXStepTable[i]<0)
					  fXStepTable[i]=-fXStepTable[i];
        }
        // FACING DOWN
        if(i>=ANGLE0 && i<ANGLE180){
				  fYStepTable[i] = (TILE_SIZE*fTanTable[i]);
				  if(fYStepTable[i]<0)
					  fYStepTable[i]=-fYStepTable[i];
        }else{ // FACING UP
          fYStepTable[i] = (TILE_SIZE*fTanTable[i]);
				  if(fYStepTable[i]>0)
					  fYStepTable[i]=-fYStepTable[i];
        }
      }
		  // Create table for fixing FISHBOWL distortion
		  for(let r,i=-ANGLE30; i<=ANGLE30; ++i){
        r = arcToRad(i);
			  // we don't have negative angle, so make it start at 0
			  // this will give range from column 0 to 319 (PROJECTONPLANEWIDTH) since we only will need to use those range
			  fFishTable[i+ANGLE30] = (1.0/cos(r));
      }
      // CREATE A SIMPLE MAP.
      // Use string for elegance (easier to see).  W=Wall, O=Opening
      let map=
			'WWWWWWWWWWWW'+
			'WOOOOOOOOOOW'+
			'WOOOOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWOOWOWOOW'+
			'WOOWWWWOWOOW'+
			'WOOOOOOOOOOW'+
			'WWWWWWWWWWWW';
      let map2=
			'WWWWWWWWWWWW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WOOOOOOOOOOW'+
			'WWWWWWWWWWWW';
      let map3=
                'WWWWWWWWWWWW'+
                'WOOOOOOOOOOW'+
                'WOOOOOOOOOOW'+
                'WOOOOOOOWOOW'+
                'WOOWOWOOWOOW'+
                'WOOWOWWOWOOW'+
                'WOOWOOWOWOOW'+
                'WOOOWOWOWOOW'+
                'WOOOWOWOWOOW'+
                'WOOOWWWOWOOW'+
                'WOOOOOOOOOOW'+
                'WWWWWWWWWWWW';
      // Remove spaces and tabs
      self.fMap=map3.replace(/\s+/g, '');
    }

    _Z.defScene("level1",{
      setup(){
        init(this);
        this.fPlayerX = 100;
        this.fPlayerY = 160;
        this.fPlayerArc = ANGLE5+ANGLE5;
        this.fPlayerDistanceToTheProjectionPlane = 277*2;
        this.fPlayerHeight = WALL_HEIGHT/2;
        this.fPlayerSpeed = 16;
        // Half of the screen height
        this.fProjectionPlaneYCenter = PROJECTIONPLANEHEIGHT/2;
        // the following variables are used to keep the player coordinate in the overhead map
        this.fPlayerMapX=0;
        this.fPlayerMapY=0;
        this.fMinimapWidth=0;
        // 2 dimensional map
        let sy= int((Mojo.height-PROJECTIONPLANEHEIGHT)/2);
        let sx= int((Mojo.width-PROJECTIONPLANEWIDTH)/2);
        _V.set(this,sx,sy);
        _G.arena= {x1:sx, y1:sy, x2: sx+PROJECTIONPLANEWIDTH, y2: sy+PROJECTIONPLANEHEIGHT};
        let pbox={x1:0,y1:0,
                  x2:_G.arena.width,
                  y2:_G.arena.height};
        this.insert(_S.drawGridBox(pbox));
        this.insert( this.gfx=_S.graphics());
      },
      drawBackgd(){
        // sky
        let c=255;
        let r,css;
        let incement=1;
        for(r=0; r<PROJECTIONPLANEHEIGHT/2; r+=incement){
          css= _rgbToHexColor(c, 125, 225);
          //this.drawLine(0, r, PROJECTIONPLANEWIDTH,r, css);
          this.gfx.beginFill(_S.color(css));
          this.gfx.drawRect(0,r,PROJECTIONPLANEWIDTH,1);
          this.gfx.endFill();
          c-=incement;
        }
        // ground
        c=22;
        for(; r<PROJECTIONPLANEHEIGHT; r+=incement){
          css=_rgbToHexColor(c, 20, 20);
          //this.drawLine(0, r, PROJECTIONPLANEWIDTH,r, css);
          this.gfx.beginFill(_S.color(css));
          this.gfx.drawRect(0,r,PROJECTIONPLANEWIDTH,1);
          this.gfx.endFill();
          c+=incement;
        }
      },
      drawFillRect(x, y, width, height, css){
        this.gfx.beginFill(_S.color(css));
        this.gfx.drawRect(x, y, width, height);
        this.gfx.endFill();
      },
      raycast(){
        let verticalGrid;  // horizotal or vertical coordinate of intersection
        let horizontalGrid; // theoritically, this will be multiple of TILE_SIZE
        // , but some trick did here might cause
        // the values off by 1
        let distToNextVerticalGrid; // how far to the next bound (this is multiple of
        let distToNextHorizontalGrid; // tile size)
        let xIntersection;  // x and y intersections
        let yIntersection;
        let distToNextXIntersection;
        let distToNextYIntersection;
        let xGridIndex;        // the current cell that the ray is in
        let yGridIndex;
        let distToVerticalGridBeingHit;      // the distance of the x and y ray intersections from
        let distToHorizontalGridBeingHit;      // the viewpoint
        let castArc, castColumn;
        let DEBUG=false;
        castArc = this.fPlayerArc;
        // field of view is 60 degree with the point of view (player's direction in the middle)
        // 30  30
        //    ^
        //  \ | /
        //   \|/
        //    v
        // we will trace the rays starting from the leftmost ray
        castArc-= ANGLE30;
        // wrap around if necessary
        if(castArc < 0)
          castArc= ANGLE360 + castArc;

        for(castColumn=0; castColumn<PROJECTIONPLANEWIDTH; castColumn+=1){
          // Ray is between 0 to 180 degree (1st and 2nd quadrant).
          // Ray is facing down
          if(castArc > ANGLE0 && castArc < ANGLE180){
            // truncuate then add to get the coordinate of the FIRST grid (horizontal
            // wall) that is in front of the player (this is in pixel unit)
            // ROUNDED DOWN
            horizontalGrid = int(this.fPlayerY/TILE_SIZE)*TILE_SIZE  + TILE_SIZE;
            // compute distance to the next horizontal wall
            distToNextHorizontalGrid = TILE_SIZE;
            let xtemp = fITanTable[castArc]*(horizontalGrid-this.fPlayerY);
            // we can get the vertical distance to that wall by
            // (horizontalGrid-playerY)
            // we can get the horizontal distance to that wall by
            // 1/tan(arc)*verticalDistance
            // find the x interception to that wall
            xIntersection = xtemp + this.fPlayerX;
            if(DEBUG)
              console.log("castArc="+castArc+" in CHECKPOINT A, horizontalGrid="+horizontalGrid+" distToNextHorizontalGrid="+distToNextHorizontalGrid+ " xtemp="+xtemp+" xIntersection="+xIntersection);
          }else{// Else, the ray is facing up
            horizontalGrid = int(this.fPlayerY/TILE_SIZE)*TILE_SIZE;
            distToNextHorizontalGrid = -TILE_SIZE;
            let xtemp = fITanTable[castArc]*(horizontalGrid - this.fPlayerY);
            xIntersection = xtemp + this.fPlayerX;
            --horizontalGrid;
            if(DEBUG)
              console.log("castArc="+castArc+" in CHECKPOINT B, horizontalGrid="+horizontalGrid+" distToNextHorizontalGrid="+distToNextHorizontalGrid+ " xtemp="+xtemp+" xIntersection="+xIntersection);
          }
          // LOOK FOR HORIZONTAL WALL
          // If ray is directly facing right or left, then ignore it
          if(castArc==ANGLE0 || castArc==ANGLE180){
            distToHorizontalGridBeingHit=Number.MAX_VALUE;
          }else{ // else, move the ray until it hits a horizontal wall
            distToNextXIntersection = fXStepTable[castArc];
            while(true){
              xGridIndex = int(xIntersection/TILE_SIZE);
              yGridIndex = int(horizontalGrid/TILE_SIZE);
              let mapIndex=int(yGridIndex*MAP_WIDTH+xGridIndex);
              if(DEBUG){
                console.log("this.fPlayerY="+this.fPlayerY+" this.fPlayerX="+this.fPlayerX+" castColumn="+castColumn+" castArc="+castArc+" xIntersection="+xIntersection+" horizontalGrid="+horizontalGrid+" xGridIndex="+xGridIndex+" yGridIndex="+yGridIndex+" mapIndex="+mapIndex);
                console.log("fITanTable="+fITanTable[castArc]);
              }
              // If we've looked as far as outside the map range, then bail out
              if((xGridIndex>=MAP_WIDTH) || (yGridIndex>=MAP_HEIGHT) || xGridIndex<0 || yGridIndex<0){
                distToHorizontalGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(this.fMap.charAt(mapIndex)!="O"){
                // If the grid is not an Opening, then stop
                distToHorizontalGridBeingHit  = (xIntersection-this.fPlayerX)*fICosTable[castArc];
                break;
              }else{ // Else, keep looking.  At this point, the ray is not blocked, extend the ray to the next grid
                xIntersection += distToNextXIntersection;
                horizontalGrid += distToNextHorizontalGrid;
              }
            }
          }
          // FOLLOW X RAY
          if(castArc < ANGLE90 || castArc > ANGLE270){
            verticalGrid = TILE_SIZE + int(this.fPlayerX/TILE_SIZE)*TILE_SIZE;
            distToNextVerticalGrid = TILE_SIZE;
            let ytemp = fTanTable[castArc]*(verticalGrid - this.fPlayerX);
            yIntersection = ytemp + this.fPlayerY;
            if(DEBUG)
              console.log("castArc="+castArc+" in CHECKPOINT C, horizontalGrid="+horizontalGrid+" distToNextHorizontalGrid="+distToNextHorizontalGrid+ " ytemp="+ytemp+" yIntersection="+yIntersection);
          }else{ // RAY FACING LEFT
            verticalGrid = int(this.fPlayerX/TILE_SIZE)*TILE_SIZE;
            distToNextVerticalGrid = -TILE_SIZE;
            let ytemp = fTanTable[castArc]*(verticalGrid - this.fPlayerX);
            yIntersection = ytemp + this.fPlayerY;
            --verticalGrid;
            if(DEBUG)
              console.log("castArc="+castArc+" in CHECKPOINT D, horizontalGrid="+horizontalGrid+" distToNextHorizontalGrid="+distToNextHorizontalGrid+ " ytemp="+ytemp+" yIntersection="+yIntersection);
          }
          // LOOK FOR VERTICAL WALL
          if(castArc==ANGLE90||castArc==ANGLE270){
            distToVerticalGridBeingHit = Number.MAX_VALUE;
          }else{
            distToNextYIntersection = fYStepTable[castArc];
            while(true){
              // compute current map position to inspect
              xGridIndex = int(verticalGrid/TILE_SIZE);
              yGridIndex = int(yIntersection/TILE_SIZE);
              let mapIndex=int(yGridIndex*MAP_WIDTH+xGridIndex);
              if(DEBUG){
                console.log("this.fPlayerY="+this.fPlayerY+" this.fPlayerX="+this.fPlayerX+" castColumn="+castColumn+" castArc="+castArc+" xIntersection="+xIntersection+" horizontalGrid="+horizontalGrid+" xGridIndex="+xGridIndex+" yGridIndex="+yGridIndex+" mapIndex="+mapIndex);
                console.log("fITanTable="+fITanTable[castArc]);
              }
              if((xGridIndex>=MAP_WIDTH) || (yGridIndex>=MAP_HEIGHT) || xGridIndex<0 || yGridIndex<0){
                distToVerticalGridBeingHit = Number.MAX_VALUE;
                break;
              }else if(this.fMap.charAt(mapIndex)!="O"){
                distToVerticalGridBeingHit =(yIntersection-this.fPlayerY)*fISinTable[castArc];
                break;
              }else{
                yIntersection += distToNextYIntersection;
                verticalGrid += distToNextVerticalGrid;
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
          if(distToHorizontalGridBeingHit < distToVerticalGridBeingHit){
            // the next function call (drawRayOnMap()) is not a part of raycating rendering part,
            // it just draws the ray on the overhead map to illustrate the raycasting process
            //this.drawRayOnOverheadMap(xIntersection, horizontalGrid);
            dist=distToHorizontalGridBeingHit;
            if(DEBUG)
              console.log("castColumn="+castColumn+" using distToHorizontalGridBeingHit");
          }else{
            // else, we use xray instead (meaning the vertical wall is closer than
            //   the horizontal wall)
            // the next function call (drawRayOnMap()) is not a part of raycating rendering part,
            // it just draws the ray on the overhead map to illustrate the raycasting process
            //this.drawRayOnOverheadMap(verticalGrid, yIntersection);
            dist=distToVerticalGridBeingHit;
            if(DEBUG)
              console.log("castColumn="+castColumn+" using distToVerticalGridBeingHit");
          }
          // correct distance (compensate for the fishbown effect)
          dist /= fFishTable[castColumn];
          // projected_wall_height/wall_height = fPlayerDistToProjectionPlane/dist;
          let projectedWallHeight=(WALL_HEIGHT*this.fPlayerDistanceToTheProjectionPlane/dist);
          bottomOfWall = this.fProjectionPlaneYCenter+(projectedWallHeight*0.5);
          topOfWall = this.fProjectionPlaneYCenter-(projectedWallHeight*0.5);
          if(topOfWall<0) topOfWall=0;
          if(bottomOfWall>=PROJECTIONPLANEHEIGHT)
            bottomOfWall=PROJECTIONPLANEHEIGHT-1;
          if(DEBUG)
            console.log("castColumn="+castColumn+" distance="+dist);
          // Add simple shading so that farther wall slices appear darker.
          // 850 is arbitrary value of the farthest distance.
          dist=int(dist);
          let color=255-(dist/750.0)*255.0;
          //color=255*(color/1000);
          // don't allow it to be too dark
          if(color<20) color=20;
          if(color>255) color=255;
          color=int(color);
          let cssColor=_rgbToHexColor(color,color,color);
          //console.log("dist="+dist+" color="+color);
          this.drawFillRect(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, cssColor);
          // TRACE THE NEXT RAY
          castArc+=1;
          if(castArc>=ANGLE360) castArc-=ANGLE360;
        }
      },
      preUpdate(dt){
        this.gfx.clear();
      },
      postUpdate(dt){
        this.drawBackgd();
        this.raycast();
        if(_I.keyDown(_I.LEFT)){
          this.fPlayerArc-=ANGLE10;
          if(this.fPlayerArc<ANGLE0) this.fPlayerArc+=ANGLE360;
        }
        if(_I.keyDown(_I.RIGHT)){
          this.fPlayerArc+=ANGLE10;
			    if(this.fPlayerArc>=ANGLE360) this.fPlayerArc-=ANGLE360;
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
        let playerXDir=fCosTable[this.fPlayerArc];
        let playerYDir=fSinTable[this.fPlayerArc];
        if(_I.keyDown(_I.UP)){
          this.fPlayerX+=Math.round(playerXDir*this.fPlayerSpeed);
          this.fPlayerY+=Math.round(playerYDir*this.fPlayerSpeed);
        }
        if(_I.keyDown(_I.DOWN)){
          this.fPlayerX-=Math.round(playerXDir*this.fPlayerSpeed);
          this.fPlayerY-=Math.round(playerYDir*this.fPlayerSpeed);
        }
      }

    },{centerStage:true})

  }

  const _$={
    //assetFiles: [],
    arena: {width: 1024, height: 640},
    scaleToWindow:"max",
    scaleFit:"x",
    fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


