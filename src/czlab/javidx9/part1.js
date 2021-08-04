(function(window){

	"use strict";

  const COLORS={
    LIGHT:{road: "0x888888", grass: "0x429352", rumble: "0xb8312e"},
    DARK:{road: "0x666666", grass: "0x397d46", rumble: "0xDDDDDD", lane: "0xFFFFFF"}
  };
  const round=Math.round;
  const int=Math.floor;
  const ceil=Math.ceil;

  class Camera{
    constructor(){
      //camera world coordinates
      this.x = 0;
      this.y = 1000;
      this.z = 0;
      //Z-distance between camera and player
      this.distToPlayer = 500;
      //Z-distance between camera and normalized projection plane
      this.distToPlane = null;
    }
    init(){
      this.distToPlane = 1 / (this.y / this.distToPlayer);
      return this;
    }
    project3D(Mojo,point,roadWidth){
      //translating world coordinates to camera coordinates
      let transX = point.world.x - this.x;
      let transY = point.world.y - this.y;
      let transZ = point.world.z - this.z;
      //scaling factor based on the law of similar triangles
      point.scale = this.distToPlane/transZ;
      //projecting camera coordinates onto a normalized projection plane
      let projectedX = point.scale * transX;
      let projectedY = point.scale * transY;
      let projectedW = point.scale * roadWidth;
      //scaling projected coordinates to the screen coordinates
      point.screen.x = round((1 + projectedX) * Mojo.width/2);
      point.screen.y = round((1 - projectedY) * Mojo.height/2);
      point.screen.w = round(projectedW * Mojo.width/2);
    }
    update(){
      // place the camera behind the player at the desired distance
      this.z = -this.distToPlayer;
    }
  }
  class Circuit{
    constructor(){
      this.segments=[];
      this.totalSegments = 0;
      this.visibleSegments = 200;
      this.rumbleSegments = 5;
      this.roadLanes = 3;
      this.roadLength = 0;
    }
    create(rw){
      this.segments.length=0;
      this.roadWidth=rw;
      this.createRoad();
      this.totalSegments = this.segments.length;
      this.roadLength = this.totalSegments * Circuit.SEGLEN;
      return this;
    }
    createRoad(){ this.createSection(1000) }
    createSection(s){
      for(let i=0;i<s;++i) this.createSegment();
    }
    getSegment(z){
      if(z<0) z += this.roadLength;
      return this.segments[int(z / Circuit.SEGLEN) % this.totalSegments]
    }
    createSegment(){
      let n=this.segments.length;
      this.segments.push({
        color: int(n/this.rumbleSegments)%2 ? COLORS.DARK : COLORS.LIGHT,
        index:n,
        point:{world: {x:0,y:0,z: n*Circuit.SEGLEN}, screen: {x:0, y:0, w:0}, scale: -1 } })
    }
  }
  Circuit.SEGLEN=100;

	function scenes(Mojo){

		const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

		_Z.defScene("level1",{
			setup(){
        this.drawBackgd();
        this.insert(this.gfx=_S.graphics());
        _G.circuit=new Circuit().create(Mojo.width/2);
        _G.camera=new Camera().init();
			},
      drawBackgd(){
        this.insert(_S.rect(Mojo.width,Mojo.height,"#69d9fb"));
      },
      draw(){
        this.gfx.clear();
        //get the base segment
        let baseSegment = _G.circuit.getSegment(_G.camera.z);
        let baseIndex = baseSegment.index;
        for(let n=0; n< _G.circuit.visibleSegments; ++n){
          let currIndex = (baseIndex + n) % _G.circuit.totalSegments;
          let currSegment = _G.circuit.segments[currIndex];
          //project the segment to the screen space
          _G.camera.project3D(Mojo,currSegment.point, _G.circuit.roadWidth);
          if(n>0){
            let prevIndex = (currIndex>0) ? currIndex-1 : _G.circuit.totalSegments-1;
            let prevSegment = _G.circuit.segments[prevIndex];
            let p1 = prevSegment.point.screen;
            let p2 = currSegment.point.screen;
            this.drawSegment( p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, currSegment.color);
          }
        }
      },
      drawSegment(x1, y1, w1, x2, y2, w2, color){
        //draw grass
        this.gfx.beginFill(_S.color(color.grass));
        this.gfx.drawRect(0, y2, Mojo.width, y1-y2);
        this.gfx.endFill();
        //draw road
        this.drawPolygon(x1-w1, y1,	x1+w1, y1, x2+w2, y2, x2-w2, y2, color.road);
        //draw rumble strips
        let rumble_w1 = w1/5;
        let rumble_w2 = w2/5;
        this.drawPolygon(x1-w1-rumble_w1, y1, x1-w1, y1, x2-w2, y2, x2-w2-rumble_w2, y2, color.rumble);
        this.drawPolygon(x1+w1+rumble_w1, y1, x1+w1, y1, x2+w2, y2, x2+w2+rumble_w2, y2, color.rumble);
        //draw lanes
        if(color.lane){
          let line_w1 = (w1/20) / 2;
          let line_w2 = (w2/20) / 2;
          let lane_w1 = (w1*2) / _G.circuit.roadLanes;
          let lane_w2 = (w2*2) / _G.circuit.roadLanes;
          let lane_x1 = x1 - w1;
          let lane_x2 = x2 - w2;
          for(let i=1; i<_G.circuit.roadLanes; ++i){
            lane_x1 += lane_w1;
            lane_x2 += lane_w2;
            this.drawPolygon( lane_x1-line_w1, y1, lane_x1+line_w1, y1, lane_x2+line_w2, y2, lane_x2-line_w2, y2, color.lane);
          }
        }
      },
      drawPolygon(x1, y1, x2, y2, x3, y3, x4, y4, color){
        this.gfx.beginFill(_S.color(color));
        this.gfx.drawPolygon({x:x1,y:y1},{x:x2,y:y2},{x:x3,y:y3},{x:x4,y:y4});
        this.gfx.endFill();
      },
			postUpdate(dt){
        _G.camera.update();
        this.draw();
			}
    },{centerStage:true});
	}

	const _$={
    //assetFiles: [],
    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

	window.addEventListener("load",()=> MojoH5(_$));

})(this);

