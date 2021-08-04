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

    const ROAD=[
        {ct:10,tu:0},
        {ct:6,tu:-0.25},
        {ct:8,tu:0},
        {ct:4,tu:0.375},
        {ct:10,tu:0.05},
        {ct:4,tu:0},
        {ct:5,tu:-0.25}
    ];

		_Z.defScene("level1",{
			setup(){
        this.insert(_S.rect(Mojo.width,Mojo.height,"#64e5ff"));
        _G.camx=0;_G.camy=0;_G.camz=0;
        _G.camcnr=0;
        _G.camseg=0;
        let sumct=0;
        ROAD.forEach(r=>{
          r.sumct=sumct;
          sumct+=r.ct;
        });
        this.insert(this.gfx=_S.graphics());
			},
      draw3d(){
        this.gfx.clear();
        //direction
        let camang= _G.camz*ROAD[_G.camcnr].tu;
        let xd= -camang, yd=0, zd=1;
        //skew camera to account for direction
        let cx,cy,cz;
        let ooo=2;
        [cx,cy,cz]= this.skew(_G.camx,_G.camy,_G.camz,xd,yd);
        //cursor, relative to skewed camera
        let x= -cx, y= -cy+ooo, z= -cz+ooo;
        //road position
        let cnr=_G.camcnr,seg=_G.camseg;
        //previous projected position
        let ppx,ppy,pscale;
        [ppx,ppy,pscale]=this.project(x,y,z);
        //draw forward
        for(let i=0;i<30;++i){
          //move forward
          x+=xd;
          y+=yd;
          z+=zd;
          //project
          let px,py,scale;
          [px,py,scale]=this.project(x,y,z);
          //draw road
          let sumct=this.getsumct(cnr,seg);
          this.drawroad(px,py,scale,ppx,ppy,pscale,sumct);
          //turn
          xd +=ROAD[cnr].tu;
          //advance along road
          [cnr,seg]= this.advance(cnr,seg);
          //track previous projected position
          ppx=px; ppy=py; pscale=scale;
        }
      },
      project(x,y,z){
        let w2=Mojo.width/2;
        let h2=Mojo.height/2;
        let s=w2/z;
        return [x*s+w2, y*s+h2, s];
      },
      advance(cnr,seg){
        seg+=1;
        if(seg>=ROAD[cnr].ct){
          seg=0;
          cnr+=1;
          if(cnr>= ROAD.length)cnr=0;
        }
        return [cnr,seg];
      },
      skew(x,y,z,xd,yd){
        return [x+z*xd,y+z*yd,z];
      },
      drawroad(x1,y1,scale1,x2,y2,scale2,sumct){
        if(int(y2)<ceil(y1))return;
        //draw ground
        let X,Y,gndcol="#20872f";
        if((sumct%6)>=3)gndcol="#49cc5b";
        this.gfx.beginFill(_S.color(gndcol));
        this.gfx.drawRect(0,Y=ceil(y1),Mojo.width,int(y2)-Y);
        this.gfx.endFill();
        //main road
        let w1=3*scale1, w2=3*scale2; //start and end widths
        this.drawtrapezium(x1,y1,w1,x2,y2,w2,"#666868");
        //center line markings
        if((sumct%4)==0){
          let mw1=0.1*scale1, mw2=0.1*scale2;
          this.drawtrapezium(x1,y1,mw1,x2,y2,mw2,"white");
        }
        //shoulders
        let scol="#c6c9c9";
        if((sumct%2)==0) scol="red";
        let sw1=0.2*scale1,sw2=0.2*scale2;
        this.drawtrapezium(x1-w1,y1,sw1,x2-w2,y2,sw2,scol);
        this.drawtrapezium(x1+w1,y1,sw1,x2+w2,y2,sw2,scol);
      },
      getsumct(cnr,seg){
        return ROAD[cnr].sumct+seg-1;
      },
      drawtrapezium(x1,y1,w1,x2,y2,w2,col){
        //draw a trapezium by stacking
        //horizontal lines
        let X,Y,h=y2-y1; //height
        let xd=(x2-x1)/h, wd= (w2-w1)/h; //width and x deltas
        let x=x1,y=y1,w=w1;  //current position
        let yadj=ceil(y)-y;
        x+=yadj*xd;
        y+=yadj;
        w+=yadj*wd;
        while(y<y2){
          this.gfx.beginFill(_S.color(col));
          X=x-w;
          //this.gfx.drawRect(X,y,x+w-X,y);
          this.gfx.drawRect(X,y,x+w-X,1);
          this.gfx.endFill();
          x+=xd;
          y+=1;
          w+=wd;
        }
      },
			postUpdate(dt){
        _G.camz+=0.3;
        if(_G.camz>1){
          _G.camz-=1;
          [_G.camcnr,_G.camseg]=this.advance(_G.camcnr,_G.camseg);
        }
        this.draw3d();
			}
    });
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

