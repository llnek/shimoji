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

    //background types
    const BG_TREE={
      img:[8,0,16,32], //sprite image
      pos:[1.5,0],     //position rel 2 side of road
      siz:[1.5,3],     //size
      spc:3            //spacing
    };
    const BG_SIGN={
      img:[80,0,32,32],
      pos:[0.5,0],
      siz:[1.5,1.5],
      spc:1,
      flpr:true        //flip when on right hand side
    };
    const BG_HOUSE={
      mp:[0,0,8,5],    //map image (x,y,w,h in tiles)
      pos:[3.5,0],
      siz:[6,3.5],
      spc:4
    };
    const BG_BEAMS={
     mp:[8,0,16,8],
     siz:[10,5],
     spc:2
    };
    const ROAD=[
     {ct:10,tu:0,bgl:BG_TREE,bgr:BG_TREE},
     {ct:6,tu:-0.25,bgl:BG_TREE,bgr:BG_SIGN},
     {ct:8,tu:0,pi:-0.75,bgl:BG_TREE,bgr:BG_TREE},

     {ct:8,tu:0,tnl:true},
     {ct:4,tu:0,tnl:true},
     {ct:8,tu:0,pi:0.75,tnl:true},
     {ct:8,tu:-0.5,pi:0.75,tnl:true},
     {ct:4,tu:0,tnl:true},
     {ct:8,tu:0.5,tnl:true},
     {ct:4,tu:0,pi:-0.5,tnl:true},
     {ct:8,tu:0,pi:-0.5,tnl:true},

     {ct:4,tu:0.375,bgl:BG_SIGN,bgr:BG_TREE},
     {ct:10,tu:0.05,pi:0.75,bgl:BG_TREE},
     {ct:4,tu:0,bgl:BG_TREE,bgr:BG_TREE},
     {ct:5,tu:-0.25,bgl:BG_TREE,bgr:BG_SIGN},
     {ct:15,tu:0,pi:-0.5,bgc:BG_BEAMS},
     {ct:12,tu:0,bgl:BG_HOUSE,bgr:BG_HOUSE},
     {ct:8,tu:-0.5,bgl:BG_HOUSE,bgr:BG_SIGN},
     {ct:8,tu:0.5,bgl:BG_SIGN,bgr:BG_HOUSE}
    ];

    _Z.defScene("level1",{
      setup(){
        _G.camx=0;_G.camy=0;_G.camz=0;
        _G.camcnr=0;_G.camseg=0;

      },
      _init(){
        //calculate the # of segments in the road before each corner.
        //this is useful for spacing things out evenly along the road
        let sumct=0;
        ROAD.forEach(r=>{
          r.sumct=sumct;
          sumct+=r.ct;
        });
        //calculate the change in pitch per segment for each corner.
        ROAD.forEach((r,i)=>{
          let pi=r.pi || 0,
              nextpi= ROAD[i%ROAD.length+1].pi || 0;
          r.dpi= (nextpi-pi)/r.ct;
          r.pi=pi;
        });
      },
      _update(){
        _G.camz+=0.3;
        if(_G.camz>1){
          _G.camz-=1;
          [_G.camcnr,_G.camseg]= this.advance(_G.camcnr,_G.camseg);
        }
      },
      project(x,y,z){
        let scale=64/z;
        return [x*scale+64, y*scale+64, scale];
      },
      advance(cnr,seg){
        seg+=1;
        if(seg>=ROAD[cnr].ct){
          seg=0;
          cnr+=1;
          if(cnr>=ROAD.length)cnr=0;
        }
        return [cnr,seg];
      },
      skew(x,y,z,xd,yd){
        return [x+z*xd, y+z*yd, z];
      },
      drawground(y1,y2,sumct){
        if(int(y2)<ceil(y1))return;
        let gndcol=3;
        if((sumct%6)>=3)gndcol=11;
         rectfill(0,ceil(y1),128,int(y2),gndcol);
      },
      drawroad(x1,y1,scale1,x2,y2,scale2,sumct){
        if(int(y2)<ceil(y1))return;
        //main road
        let w1=3*scale1,w2= 3*scale2; //start and end widths
        this.drawtrapezium(x1,y1,w1,x2,y2,w2,5);
        //center line markings
        if(sumct%4==0){
          let mw1=0.1*scale1,mw2= 0.1*scale2;
          this.drawtrapezium(x1,y1,mw1,x2,y2,mw2,7);
        }
        //shoulders
        let scol=6;
        if((sumct%2)==0)scol=8;
        let sw1=0.2*scale1,sw2=0.2*scale2;
        this.drawtrapezium(x1-w1,y1,sw1,x2-w2,y2,sw2,scol);
        this.drawtrapezium(x1+w1,y1,sw1,x2+w2,y2,sw2,scol);
      },
      getsumct(cnr,seg){
        return ROAD[cnr].sumct+seg-1;
      },
      drawtrapezium(x1,y1,w1,x2,y2,w2,col){
        //draw a trapezium by stacking horizontal lines
        let h=y2-y1; //height
        let xd=(x2-x1)/h, wd=(w2-w1)/h;  //width and x deltas
        let x=x1,y=y1,w=w1;  //current position
        let yadj=ceil(y)-y;
        x+=yadj*xd;
        y+=yadj;
        w+=yadj*wd ;
        while(y<y2){
          rectfill(x-w,y,x+w,y,col);
          x+=xd;
          y+=1;
          w+=wd;
        }
      },
      addbgsprite(sp,sumct,bg,side,px,py,scale,clp){
        if(!bg)return;
        if((sumct%bg.spc) != 0)return;
        //find position
        px+=3*scale*side;
        if(bg.pos){
          px+=bg.pos[1]*scale*side;
          py+=bg.pos[2]*scale;
        }
        //calculate size
        let w=bg.siz[1]*scale, h= bg.siz[2]*scale;
        //flip horizontally?
        let flp=side>0 && bg.flpr;
        //add to sprite array
        add(sp,{x:px,y:py,w:w,h:h,
                img:bg.img, mp:bg.mp, flp:flp, clp:[clp[1],clp[2],clp[3],clp[4]] });
      },
      drawbgsprite(s){
        setclip(s.clp);
        if(s.mp){
          smap(s.mp[1],s.mp[2],s.mp[3],s.mp[4], s.x-s.w/2,s.y-s.h,s.w,s.h);
        }else{
          let x1=ceil(s.x-s.w/2);
          let x2=ceil(s.x+s.w/2);
          let y1=ceil(s.y-s.h);
          let y2=ceil(s.y);
          sspr(s.img[1],s.img[2],s.img[3],s.img[4], x1,y1,x2-x1,y2-y1, s.flp);
       }
      },
      smap(mx,my,mw,mh,dx,dy,dw,dh){
        //tile size on screen
        let tw=dw/mw,th=dh/mh;
        //loop over map tiles
        for(let y=0;y<mh-1;++y){
          for(let x=0;x<mw-1;++x){
            //lookup sprite
            let s=mget(mx+x,my+y);
            //don't draw sprite 0
            if(s!=0){
              //sprite row and column index
              //use to get sprite image coords
              let sc=s%16,sr=int(s/16);  // 16 sprites per row
              let sx=sc*8,sy=sr*8;    // 8x8 pixels per sprite
              //sprite position on screen
              let x1=ceil(dx+x*tw);
              let y1=ceil(dy+y*th);
              let x2=ceil(dx+x*tw+tw);
              let y2=ceil(dy+y*th+th);
              //scale sprite
              sspr(sx,sy,8,8, x1,y1,x2-x1,y2-y1);
            }
          }
        }
      },
      setclip(clp){
        clip(clp[1],clp[2],clp[3]-clp[1],clp[4]-clp[2]);
      },
      drawtunnelface(px,py,scale){
        //tunnel mouth
        let x1,y1,x2,y2;
        [x1,y1,x2,y2]=gettunnelrect(px,py,scale);
        //tunnel wall top
        let wh=4.5*scale;
        let wy=ceil(py-wh);
        //draw faces
        if(y1>0) rectfill(0,wy,128,y1-1,7);
        if(x1>0) rectfill(0,y1,x1-1,y2-1,7);
        if(x2<128) rectfill(x2,y1,127,y2-1,7);
      },
      gettunnelrect(px,py,scale){
        let w=6.4*scale,h=4*scale;
        let x1=ceil(px-w/2);
        let y1=ceil(py-h);
        let x2=ceil(px+w/2);
        let y2=ceil(py);
        return [x1,y1,x2,y2];
      },
      cliptotunnel(px,py,scale,clp){
        let x1,y1,x2,y2;
        [x1,y1,x2,y2]=gettunnelrect(px,py,scale);
        clp[1]=Math.max(clp[1],x1);
        clp[2]=Math.max(clp[2],y1);
        clp[3]=Math.min(clp[3],x2);
        clp[4]=Math.min(clp[4],y2);
      },
      drawtunnelwalls(px,py,scale,ppx,ppy,pscale,sumct){
        //colour
        let wallcol=0;
        if(sumct%4<2)wallcol=1;
        //draw walls
        let px1,py1,px2,py2;
        let x1,y1,x2,y2;
        [x1,y1,x2,y2]=gettunnelrect(px,py,scale);
        [px1,py1,px2,py2]=gettunnelrect(ppx,ppy,pscale);
        if(y1>py1) rectfill(px1,py1,px2-1,y1-1,wallcol);
        if(x1>px1) rectfill(px1,y1,x1-1,py2-1,wallcol);
        if(x2<px2) rectfill(x2,y1,px2-1,py2-1,wallcol);
      },
      _draw(){
        cls(12);
        //direction
        let camang= _G.camz*ROAD[_G.camcnr].tu;
        let xd=-camang;
        let yd=ROAD[_G.camcnr].pi+ ROAD[_G.camcnr].dpi*(_G.camseg-1);
        let zd=1;
        //skew camera to account for direction
        let cx,cy,cz;
        [cx,cy,cz]=skew(camx,camy,camz,xd,yd);
        //cursor, relative to skewed camera
        let x=-cx, y= -cy+2, z= -cz+2;
        //road position
        let cnr=_G.camcnr,seg=_G.camseg;
        //previous projected position
        let ppx,ppy,pscale;
        [ppx,ppy,pscale]=project(x,y,z);
        //previous tunnel flag
        let ptnl=ROAD[cnr].tnl;
        //array of sprites to draw
       let sp=[];
       //current clip region
       let clp=[0,0,128,128];
       clip();
       //draw forward
       for(let i=0;i<30;++i){
         //move forward
         x+=xd;
         y+=yd:
         z+=zd;
         //project
         let px,py,scale;
         [px,py,scale]=this.project(x,y,z);
         //draw tunnel face
         let tnl=ROAD[cnr].tnl;
         if(tnl && !ptnl){
           this.drawtunnelface(ppx,ppy,pscale);
           this.cliptotunnel(ppx,ppy,pscale,clp);
           this.setclip(clp);
         }
         //draw ground/tunnel walls
         let sumct=this.getsumct(cnr,seg);
         if(tnl){
           this.drawtunnelwalls(px,py,scale,ppx,ppy,pscale,sumct);
         }else{
           this.drawground(py,ppy,sumct);
         }
         //draw road
         this.drawroad(px,py,scale,ppx,ppy,pscale,sumct);
         //add background sprites
         this.addbgsprite(sp,sumct,ROAD[cnr].bgl,-1,px,py,scale,clp);
         this.addbgsprite(sp,sumct,ROAD[cnr].bgr, 1,px,py,scale,clp);
         this.addbgsprite(sp,sumct,ROAD[cnr].bgc, 0,px,py,scale,clp);
         //reduce clip region
         if(tnl){
           this.cliptotunnel(px,py,scale,clp);
         }else{
           clp[4]=Math.min(clp[4],ceil(py));
         }
         this.setclip(clp);
         //turn and pitch
         xd+=ROAD[cnr].tu;
         yd+=ROAD[cnr].dpi
         //advance along road
         [cnr,seg]= this.advance(cnr,seg);
         //track previous projected position
         ppx=px;ppy=py;pscale=scale;
         ptnl=tnl;
       }
        // draw background sprites in reverse order
        for(let j=sp.length-1;j>=0;--j)
          this.drawbgsprite(sp[j]);
        clip();
      },
      postUpdate(dt){
            this._update(dt);
            this._draw();
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

