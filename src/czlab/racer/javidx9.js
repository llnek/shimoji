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

    const int=Math.floor;
    const ceil=Math.ceil;
    const sin=Math.sin,
          cos=Math.cos;

    _Z.defScene("hud",{
      __fmtNum(n,v){
        return `${this.__msgs[n]}:${Number(v).toFixed(5)}`;
      },
      setup(){
        // Draw Stats
        this.__msgs=["        Distance",
                     "         Section",
                     "Target Curvature",
                     "Player Curvature",
                     "    Player Speed",
                     " Track Curvature",
                     "        LAP Time"];
        this.__stats=[];
        let pad=10,
            args={fontSize:24,fill:"white"};
        for(let z=this.__msgs.length,i=0;i<z;++i)
          this.__stats[i]=_S.bitmapText(this.__fmtNum(i,0),args);

        let p,s=_S.bitmapText("Statistics",args);
        this.insert(s);
        s.y -= (s.height+pad);
        p=s;
        this.__stats.forEach((t,i)=>{
          _S.pinBottom(p,t,pad,0);
          this.insert(t);
          p=t;
        });
      },
      postUpdate(){
        let n=-1;
        this.__stats[++n].text= this.__fmtNum(n,_G.distance);
        this.__stats[++n].text= this.__fmtNum(n,_G.trackSection);
        this.__stats[++n].text= this.__fmtNum(n,_G.targetCurvature);
        this.__stats[++n].text= this.__fmtNum(n,_G.playerCurvature);
        this.__stats[++n].text= this.__fmtNum(n,_G.speed);
        this.__stats[++n].text= this.__fmtNum(n,_G.trackCurvature);
        this.__stats[++n].text= this.__fmtNum(n,_G.curLapTime);
      }
    });

    _Z.defScene("level1",{
      initLevel(){
        _G.ROAD=[
          {ct:10,tu:0},
          {ct:200,tu:0},
          {ct:200,tu:1},
          {ct:400,tu:0},
          {ct:100,tu:-1},
          {ct:200,tu:0},
          {ct:200,tu:-1},
          {ct:200,tu:1},
          {ct:200,tu:0},
          {ct:500,tu:0.2},
          {ct:200,tu:0}
        ];
        //calculate total track distance, so we can set lap times
        _G.trackDistance= _G.ROAD.reduce((acc,r)=> acc+r.ct, 0);
        _G.listLapTimes = [0,0,0,0,0];
        _G.curLapTime = 0;
        _G.distance=0;
        _G.curvature=0;
        _G.carPos=0;
        _G.carDir=0;
        _G.curLapTime =0;
        _G.speed=0;
        _G.trackSection=0;
        _G.playerCurvature = 0;
        _G.trackCurvature=0;
        _G.targetCurvature=0;
      },
      setup(){
        this.initLevel();
        this.insert(this.gfx=_S.graphics());
        this.insert(this.car= _S.sprite("images/javidx9/red_car.png"));
        _S.centerAnchor(this.car);
        _S.scaleXY(this.car,Mojo.getScaleFactor(),Mojo.getScaleFactor());
      },
      findSectionAndBend(){
        let t=0,d=0;
        while(t < _G.ROAD.length && d <= _G.distance){
          d += _G.ROAD[t].ct;
          ++t;
        }
        _G.trackSection=t;
        _G.targetCurvature = _G.ROAD[t-1].tu;
      },
      __drawBackdrop(K,W,H,W2,H2){
        const HILLHEIGHT=128;
        //draw Sky
        this.gfx.beginFill(_S.color("#87cefa"));
        this.gfx.drawRect(0,0,W,H2);
        this.gfx.endFill();
        // Draw Scenery - our hills are a rectified sine wave, where the phase is adjusted by the accumulated track curvature
        this.gfx.lineStyle(1,_S.color("#556b2f"));
        for(let hh,x = 0; x < W; ++x){
          hh = Math.abs(sin(x * 0.01 + _G.trackCurvature) * HILLHEIGHT*K);
          this.gfx.moveTo(x,H2-hh);
          this.gfx.lineTo(x,H2);
        }
      },
      __project(y,W,H,W2,H2,out){
        let perspective = y / H2;
        let roadWidth = 0.1 + perspective * 0.8; // Min 10% Max 90%
        let clipWidth = roadWidth * 0.15;

        out.p3= Math.pow(1-perspective,3);
        out.p2= Math.pow(1-perspective,2);
        roadWidth *= 0.5;  // Halve it as track is symmetrical around center of track, but offset...
        // ...depending on where the middle point is, which is defined by the current
        // track curvature.
        let middle= 0.5 + _G.curvature * out.p3;
        //work out segment boundaries
        out.leftGrassX = (middle- roadWidth - clipWidth) * W;
        out.leftClipX = (middle- roadWidth) * W;
        out.rightClipX = (middle + roadWidth) * W;
        out.rightGrassX = (middle+ roadWidth + clipWidth) * W;
      },
      __draw3d(dt){
        const W=Mojo.width,
              H=Mojo.height,
              H8= H*0.8,
              W2= Mojo.width/2,
              H2= Mojo.height/2,
              dts= dt* _G.speed,
              K=Mojo.getScaleFactor();
        //interpolate towards current section curvature
        _G.curvature += (_G.targetCurvature - _G.curvature) * dts;
        //accumulate track curvature
        _G.trackCurvature += _G.curvature * dts;

        this.__drawBackdrop(K,W,H,W2,H2);

        let proj={};
        for(let r,y=0;y<H2;++y){
          this.__project(y,W,H,W2,H2,proj);
          //Using periodic oscillatory functions to give lines, where the phase is controlled
          //by the distance around the track. These take some fine tuning to give the right "feel"
          proj.grassColor = _S.color(sin(20 *proj.p3 + _G.distance * 0.1) > 0 ? "#a6d608": "#8db600");
          proj.clipColor = _S.color(sin(80 *proj.p2  + _G.distance) > 0 ? "#ff6347": "white");
          // Start finish straight changes the road colour to inform the player lap is reset
          proj.roadColor = _S.color((_G.trackSection-1) == 0 ? "#fffacd" : "#808080");
          // Draw the row segments
          r = H2 + y; //screen bottom up visually
          this.__drawLine(0,r,proj.leftGrassX,r,proj.grassColor);
          this.__drawLine(proj.leftGrassX,r,proj.leftClipX,r,proj.clipColor);
          this.__drawLine(proj.leftClipX,r,proj.rightClipX,r,proj.roadColor);
          this.__drawLine(proj.rightClipX,r,proj.rightGrassX,r,proj.clipColor);
          this.__drawLine(proj.rightGrassX,r,W,r,proj.grassColor);
        }

        this.__drawCar(W,H,W2,H2);
      },
      __drawCar(W,H,W2,H2){
        //draw Car - car position on road is proportional to difference between
        // current accumulated track curvature, and current accumulated player curvature
        // i.e. if they are similar, the car will be in the middle of the track
        _G.carPos = _G.playerCurvature - _G.trackCurvature;
        this.car.x= W2 + ((W * _G.carPos) * 0.5);
        this.car.y= H;
        this.car.angle= _G.carDir;
      },
      __drawLine(x1,y1,x2,y2,color){
        this.gfx.lineStyle(1,color);
        this.gfx.moveTo(x1,y1);
        this.gfx.lineTo(x2,y2);
      },
      postUpdate(dt){

        if(_I.keyDown(_I.SPACE))
          _G.speed += 2 * dt;
        else
          _G.speed -= 1 * dt;

        _G.carDir= 0;

        // Car Curvature is accumulated left/right input, but inversely proportional to speed
        // i.e. it is harder to turn at high speed
        if(_I.keyDown(_I.LEFT)){
         _G.playerCurvature -= 0.7 * dt * (1 - _G.speed/2);
         _G.carDir= -30;
        }
        if(_I.keyDown(_I.RIGHT)){
			    _G.playerCurvature += 0.7 * dt * (1 - _G.speed / 2);
          _G.carDir= 30;
        }

        // If car curvature is too different to track curvature, slow down
        // as car has gone off track
        if(Math.abs(_G.playerCurvature - _G.trackCurvature) >= 0.8)
          _G.speed -= 5 * dt;

        //clamp Speed
        if(_G.speed < 0)	_G.speed = 0;
        if(_G.speed > 1)	_G.speed = 1;

        // Move car along track according to car speed
        _G.distance += (70 * _G.speed) * dt;

        // Lap Timing and counting
        _G.curLapTime += dt;
        if(_G.distance >= _G.trackDistance){
          _G.distance -= _G.trackDistance;
          _G.listLapTimes.unshift(_G.curLapTime);
          _G.listLapTimes.pop();
          _G.curLapTime = 0;
        }

        //update to track section
        this.findSectionAndBend();
        this.gfx.clear() && this.__draw3d(dt);
      }
    });
  }

  const _$={
    assetFiles: ["images/javidx9/red_car.png"],
    arena: {width: 1280, height: 800},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:24,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
      Mojo.Scenes.runScene("hud");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);

