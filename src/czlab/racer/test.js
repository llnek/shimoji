;(function(window,UNDEF){

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

    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    const GREEN=_S.color("green");
    const GREY=_S.color("grey");
    const RED=_S.color("red");
    const SEGN= 1;//200;

    _Z.scene("level1",{
      setup(){
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _G.H2=Mojo.height/2;
        _G.W2=Mojo.width/2;
        _G.H=Mojo.height;
        _G.W=Mojo.width;
        _G.road=[
          {ct:10,tu:0,co:_S.color("red")},
          {ct:6,tu:-1,co:_S.color("white")},
          {ct:8,tu:0,co:_S.color("blue")},
          {ct:4,tu:1.5,co:_S.color("yellow")},
          {ct:10,tu:0.2,co:_S.color("orange")},
          {ct:4,tu:0,co:_S.color("magenta")},
          {ct:5,tu:-1,co:_S.color("green")}
        ];
        let e=0,b=0;
        _G.roadDist= _G.road.reduce((acc,r)=>{
          acc += r.ct*SEGN;
          r.nn= acc;
          r.s=b;
          r.e= b + r.ct - 1;
          b += r.ct;
          e=r.e;
          return acc;
        },0);
        _G.segN=e+1;
        _G.dist=0;
        _G.pos=0;
        _G.camD=0.84;
        _G.playerX=0;
        this.insert(this.gfx=_S.graphics());
        //this.__draw();
      },
      __findSegCt(n){
        for(let c,i=0;i<_G.road.length;++i){
          c=_G.road[i];
          if(n>=c.s && n<= c.e){ return i }
        }
        throw "Fatal!";
      },
      __draw(){
        let curSeg= int(_G.pos/SEGN);
        let xd=0;
        let cx=0;
        let cy= 1;//1500;
        let rw=3;//2000;
        let cz;
        let px,py,scale,width;

        for(let ps,ct,s, end= curSeg+30, i=curSeg;i< end;++i){
          if(i>=_G.segN){
            cz = _G.pos - _G.roadDist;
          }else{
            cz=_G.pos;
          }

          ps=i%_G.segN;
          ct= this.__findSegCt(ps);
          [px,py,scale]=this.project(ps, _G.playerX-cx,cy,cz);
          width = scale * rw  * _G.W2;

          //console.log(`ct====${ct}`);
          cx+=xd;
          xd+=_G.road[ct].tu;

          this.gfx.lineStyle(1,_G.road[ct].co);
          this.gfx.moveTo(px-width,py);
          this.gfx.lineTo(px+width,py);

        }
      },
      project(s,cx,cy,cz){
        let z= SEGN*s;
        let scale = _G.camD/(z-cz);
        let x = (1 + scale*(0 - cx)) * _G.W2;
        let y = (1 - scale*(0 - cy)) * _G.H2;
        return [x,y,scale];
      },
      __update(){
        if(_I.keyDown(_I.UP)) _G.pos += 1;//200;
        if(_I.keyDown(_I.DOWN)) _G.pos -= 200;

        while(_G.pos>= _G.roadDist) _G.pos-=_G.roadDist;
        while(_G.pos<0) _G.pos+= _G.roadDist;
      },
      postUpdate(dt){
        this.__update();
        this.gfx.clear() && this.__draw();
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=> MojoH5({

    arena: {width: 128, height: 128},
    //scaleToWindow:"max",
    scaleFit:"x",
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }

  }));

})(this);


