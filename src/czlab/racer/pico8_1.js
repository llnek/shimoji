(function(window){

  "use strict";

  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor;
    const ceil=Math.ceil;
    const sin=Math.sin,
          cos=Math.cos;

    _Z.scene("level1",{
      _initLevel(){
        _G.road=[
         {ct:10,tu:0},
         {ct:6,tu:-1},
         {ct:8,tu:0},
         {ct:4,tu:1.5},
         {ct:10,tu:0.2},
         {ct:4,tu:0},
         {ct:5,tu:-1},
        ];
        _G.cam={x:0, y:0, z:0, cnr:0, seg:0};
        _G.W2=_G.arena.width/2;
        _G.H2=_G.arena.height/2;
        let sumct=0;
        _G.road.forEach(r=>{
          r.sumct=sumct;
          sumct+=r.ct;
        });
      },
      setup(){
        let out={x:0, y:0};
        _S.gridXY([120,40],0.9,0.8,out);
        _G.arena=Mojo.mockStage(out);
        //_G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _V.set(this,_G.arena.x,_G.arena.y);
        this.insert(_S.rect(_G.arena.width,_G.arena.height,"#87CEFA"));//sky blue
        this.insert(this.gfx=_S.graphics());
        this._initLevel();
        this._draw();
      },
      _draw(){
        let camang= _G.cam.z * _G.road[_G.cam.cnr].tu;
        //direction
        let xd= 0 -camang,yd=0,zd=1;
        //skew camera to account for direction
        let cx,cy,cz;
        let x,y,z;
        [cx,cy,cz]=this.skew(_G.cam.x,_G.cam.y,_G.cam.z,xd,yd);
        //cursor, relative to skewed camera
        //let x=0,y=1,z=1;
        x= -cx, y= -cy+2, z= -cz+2;
        //road position
        let {cnr,seg}=_G.cam;
        let px,py,scale;
        let ppx,ppy,pscale;
        [ppx,ppy,pscale]=this.project(x,y,z);
        for(let i=0;i<30;++i){
          //move forward
          x+=xd;
          y+=yd;
          z+=zd;
          //project
          [px,py,scale]=this.project(x,y,z);
          //draw road
          this.drawRoad(px,py,scale,ppx,ppy,pscale, this.getsumct(cnr,seg));
          //turn
          xd+= _G.road[cnr].tu;
          //advance along road
          [cnr,seg]=this.advance(cnr,seg);
          //track previous projected position
          ppx=px;ppy=py;pscale=scale;
        }
      },
      _update(){
        _G.cam.z +=0.3;
        if(_G.cam.z>1){
          _G.cam.z -=1;
          let r= this.advance(_G.cam.cnr,_G.cam.seg);
          _G.cam.cnr=r[0];
          _G.cam.seg=r[1];
        }
      },
      skew(x,y,z,xd,yd){
        return [x+z*xd, y+z*yd, z];
      },
      project(x,y,z){
        let scale=(_G.H2)/z;
        return [x*scale+_G.W2, y*scale+_G.H2, scale];
      },
      advance(cnr,seg){
        seg+=1;
        if(seg>=_G.road[cnr].ct){
            seg=0;
            cnr+=1;
            if(cnr>=_G.road.length)cnr=0;
        }
        return [cnr,seg];
      },
      drawRoad(x1,y1,scale1,x2,y2,scale2,sumct){
        if(int(y2)<ceil(y1))return;
        //draw ground
        let gndcol="#008000"; //darkgreen
        if((sumct%6)>=3)gndcol="#7CFC00"; //light green
        this.gfx.beginFill(_S.color(gndcol));
        this.gfx.drawRect(0,ceil(y1),_G.arena.width,int(y2)-ceil(y1));
        this.gfx.endFill();
        //main road
        let w1=3*scale1,w2=3*scale2;  //start and end widths
        this.drawTrapezium(x1,y1,w1,x2,y2,w2,"#A9A9A9"); //dark grey
        //center line markings
        if(sumct%4==0){
          let mw1=0.1*scale1,mw2=0.1*scale2;
          this.drawTrapezium(x1,y1,mw1,x2,y2,mw2,"white");
        }
        //shoulders
        let scol="#d3d3d3";
        if((sumct%2)==0)scol="red";
        let sw1=0.2*scale1,sw2=0.2*scale2;
        this.drawTrapezium(x1-w1,y1,sw1,x2-w2,y2,sw2,scol);
        this.drawTrapezium(x1+w1,y1,sw1,x2+w2,y2,sw2,scol);
      },
      skew(x,y,z,xd,yd){
        return [x+z*xd, y+z*yd, z];
      },
      getsumct(cnr,seg){
        return _G.road[cnr].sumct+seg-1;
      },
      drawTrapezium(x1,y1,w1,x2,y2,w2,col){
        //draw a trapezium by stacking horizontal lines
        let h=y2-y1;  //height
        let xd=(x2-x1)/h,wd= (w2-w1)/h; //width and x deltas
        let x=x1,y=y1,w=w1;   //current position
        let yadj=ceil(y)-y;
        x+=yadj*xd;
        y+=yadj;
        w+=yadj*wd;
        col=_S.color(col);
        while(y<y2){
          this.gfx.beginFill(col);
          this.gfx.drawRect(x-w,y,2*w,1);
          this.gfx.endFill();
          x+=xd;
          y+=1;
          w+=wd;
        }
      },
      postUpdate(dt){
        this._update(dt);
        this.gfx.clear() && this._draw();
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=> MojoH5({

    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }

  }));

})(this);

