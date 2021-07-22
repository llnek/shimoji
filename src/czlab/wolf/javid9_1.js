(function(window){

	"use strict";

	const int=Math.floor;
	const cos=Math.cos;
	const sin=Math.sin;
	const acos=Math.acos;

	function scenes(Mojo){
		const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;
		//tile dimension
		const GW = 16;// World Dimensions
		const GH = 16;
		const GDepth = 16;	// Maximum rendering distance
		let fSpeed = 5.0;			// Walking Speed
		let fFOV = Math.PI / 4.0;	// Field of View

		_Z.defScene("level1",{
			setup(){
				// Create Map of world space # = wall block, . = space
				let s="";
				s += "#########.......";
				s += "#...............";
				s += "#.......########";
				s += "#..............#";
				s += "#......##......#";
				s += "#......##......#";
				s += "#..............#";
				s += "###............#";
				s += "##.............#";
				s += "#......####..###";
				s += "#......#.......#";
				s += "#......#.......#";
				s += "#..............#";
				s += "#......#########";
				s += "#..............#";
				s += "################";

				this.gmap=s;
				let out={x:0,y:0},
            K=Mojo.getScaleFactor();
        _G.grid= _S.gridXY([120,40],0.9,0.6,out);
        _G.arena=Mojo.mockStage(out);//playable area
				//make scene as big as the play area
        _V.set(this,_G.arena.x,_G.arena.y);
				let pbox={x1:0,y1:0,
                  x2:_G.arena.width,
                  y2:_G.arena.height};
				this.insert(_S.drawGridBox(pbox));
				this.insert(this.gfx=_S.graphics());
				this.screen=[];
				this.fPlayerX = 5;			// Player Start Position
				this.fPlayerY = 7;
				this.fPlayerA = -Math.PI/2;			// Player Start Rotation
				for(let i=0;i<_G.grid[0].length;++i)
					this.screen.push(new Array(_G.grid.length));
			},
			hitTest(c,x,y){
				x= x===undefined?this.fPlayerX:x;
				y= y===undefined?this.fPlayerY:y;
				return this.gmap[int(y) * GW + int(x)] == c;
			},
			hud(){
				for(let nx = 0; nx < GW; ++nx)
					for(let g,v,c,ny = 0; ny < GH; ++ny){
						c=this.gmap[ny*GW+nx];
						v="blue";
						if(c=="#"){
							v="red";
						}
						g=_G.grid[ny][nx];
						this.gfx.beginFill(_S.color(v));
						this.gfx.drawRect(g.x1,g.y1,g.x2-g.x1,g.y2-g.y1);
						this.gfx.endFill();
					}

				let g=_G.grid[int(this.fPlayerY)][int(this.fPlayerX)];
				this.gfx.beginFill(_S.color("yellow"));
				this.gfx.drawRect(g.x1,g.y1,g.x2-g.x1,g.y2-g.y1);
				this.gfx.endFill();
			},
			draw(){
				this.gfx.clear();
				for(let c,x= 0; x < this.screen.length;++x){
					c=this.screen[x];
					for(let g,y=0; y< c.length;++y){
						g=_G.grid[y][x];
						this.gfx.beginFill(_S.color(c[y]));
						this.gfx.drawRect(g.x1,g.y1,g.x2-g.x1,g.y2-g.y1);
						this.gfx.endFill();
					}
				}
			},
			postUpdate(dt){
				// We'll need time differential per frame to calculate modification
				// to movement speeds, to ensure consistant movement, as ray-tracing
				// is non-deterministic
				let sdt= fSpeed*dt;
				let r= sdt*0.75;
				let pi2=2*Math.PI;
				// Handle CCW Rotation
				if(_I.keyDown(_I.LEFT)) this.fPlayerA -= r;
				// Handle CW Rotation
				if(_I.keyDown(_I.RIGHT)) this.fPlayerA += r;

				if(this.fPlayerA > pi2) this.fPlayerA -= pi2;
				if(this.fPlayerA < -pi2) this.fPlayerA += pi2;

				if(_I.keyDown(_I.DOWN)||_I.keyDown(_I.UP)){
					let dir= _I.keyDown(_I.DOWN) ? -sdt : sdt;
					let sA=sin(this.fPlayerA);
					let cA=cos(this.fPlayerA);
					let px=this.fPlayerX+cA*dir;
					let py=this.fPlayerY+sA*dir;
					if(!this.hitTest("#",px,py)){
						this.fPlayerX = px;
						this.fPlayerY = py;
					}
				}

				let fRayAngle;
				let fStepSize;// Increment size for ray casting, decrease to increase
				let fDistanceToWall; // resolution
				let bHitWall;// Set when ray hits wall block
				let bBoundary;// Set when ray hits boundary between two wall blocks
				let fEyeX;// Unit vector for ray in player space
				let fEyeY;
				let nTestX;
				let nTestY;
				let nWidth=_G.grid[0].length;
				let nHeight=_G.grid.length;
				for(let x= 0; x<nWidth; ++x){
					// For each column, calculate the projected ray angle into world space
					fRayAngle = (this.fPlayerA - fFOV/2) + (x / nWidth) * fFOV;
					// Find distance to wall
					fStepSize = 0.2;
					fDistanceToWall = 0;
					bHitWall = false;
					bBoundary = false;

					if(fRayAngle > pi2) fRayAngle -= pi2;
					if(fRayAngle < -pi2) fRayAngle += pi2;

					fEyeX = cos(fRayAngle);
					fEyeY = sin(fRayAngle);
					// Incrementally cast ray from player, along ray angle, testing for intersection with a block
					while(!bHitWall && fDistanceToWall < GDepth){
						fDistanceToWall += fStepSize;
						nTestX = int(this.fPlayerX + fEyeX * fDistanceToWall);
						nTestY = int(this.fPlayerY + fEyeY * fDistanceToWall);
						// Test if ray is out of bounds
						if(nTestX < 0 || nTestX >= GW || nTestY < 0 || nTestY >= GH){
							bHitWall = true; // Just set distance to maximum depth
							fDistanceToWall = GDepth;
						}else{
							// Ray is inbounds so test to see if the ray cell is a wall block
							if(this.hitTest("#",nTestX,nTestY)){
								//Ray has hit wall
								bHitWall = true;
								// To highlight tile boundaries, cast a ray from each corner
								// of the tile, to the player. The more coincident this ray
								// is to the rendering ray, the closer we are to a tile
								// boundary, which we'll shade to add detail to the walls
								let p=[];
								// Test each corner of hit tile, storing the distance from
								// the player, and the calculated dot product of the two rays
								for(let tx = 0; tx < 2; ++tx)
									for(let ty = 0; ty < 2; ++ty){
										// Angle of corner to eye
										let vy = nTestY + ty - this.fPlayerY;
										let vx = nTestX + tx - this.fPlayerX;
										let d = Math.sqrt(vx*vx + vy*vy);
										let dot = (fEyeX * vx / d) + (fEyeY * vy / d);
										p.push([d, dot]);
									}
								// Sort Pairs from closest to farthest
								p.sort((a,b)=> a[0] < b[0]);
								// First two/three are closest (we will never see all four)
								let fBound = 0.01;
								if(acos(p[0][1]) < fBound) bBoundary = true;
								if(acos(p[1][1]) < fBound) bBoundary = true;
								//if(acos(p[2][1]) < fBound) bBoundary = true;
							}
						}
					}
					// Calculate distance to ceiling and floor
					let nCeiling = (nHeight/2) - nHeight / fDistanceToWall;
					let nFloor = nHeight - nCeiling;
					// Shader walls based on distance
					let nShade;
					if(fDistanceToWall <= GDepth / 4.0)	nShade = "#eeeeee";	// Very close
					else if(fDistanceToWall < GDepth / 3.0)	nShade = "#c5c5c5";
					else if(fDistanceToWall < GDepth / 2.0)	nShade = "#8d8d8d";
					else if(fDistanceToWall < GDepth)	nShade = "#464646";
					else	nShade = "#000000";		// Too far away

					if(bBoundary)	nShade = "#000000"; // Black it out

					let r=this.screen[x];
					for(let y = 0; y < nHeight; ++y){
						// Each Row
						if(y <= nCeiling)
							r[y] = "#000000";
						else if(y > nCeiling && y <= nFloor)
							r[y] = nShade;
						else{// Floor
							//Shade floor based on distance
							let b = 1.0 - ((y -nHeight/2) / (nHeight / 2));
							if(b < 0.25) nShade = "#8db200";
							else if(b < 0.5)	nShade = "#749201";
							else if(b < 0.75)	nShade = "#556b00";
							else if(b < 0.9)	nShade = "#303c00";
							else nShade = "#000000";
							r[y] = nShade;
						}
					}
				}
				this.draw();
				this.hud();
				console.log(`X=${this.fPlayerX}, Y=${this.fPlayerY}, A=${this.fPlayerA} FPS=${1/dt}`);
			}
		},{centerStage:true});

	}

  const _$={
    //assetFiles: [],
    arena: {width: 720, height: 240},
    scaleToWindow:"max",
    scaleFit:"x",
		DIM:16,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);

