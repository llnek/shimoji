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

    class Line{
      constructor(){
        this.spriteX=
        this.curve=
        this.x=
        this.y=
        this.z=0;
        this.clip=0;
        this.scale=0;
        //screen pos
        this.X=0;
        this.Y=0;
        this.W=0;
        this.sprite=null;
      }
      project(camX,camY,camZ){
        this.scale = _G.camD/(this.z-camZ);
        this.X = (1 + this.scale*(this.x - camX)) * _G.arena.width/2;
        this.Y = (1 - this.scale*(this.y - camY)) * _G.arena.height/2;
        this.W = this.scale * _G.roadW  * _G.arena.width/2;
      }
      drawSprite(){
        /*
        let s = this.sprite;
        int w = s.getTextureRect().width;
        int h = s.getTextureRect().height;
        float destX = X + scale * spriteX * width/2;
        float destY = Y + 4;
        float destW  = w * W / 266;
        float destH  = h * W / 266;
        destX += destW * spriteX; //offsetX
        destY += destH * (-1);    //offsetY
        float clipH = destY+destH-clip;
        if(clipH<0) clipH=0;
        if(clipH>=destH) return;
        s.setTextureRect(IntRect(0,0,w,h-h*clipH/destH));
        s.setScale(destW/w,destH/h);
        s.setPosition(destX, destY);
        */
      }
    };

    const HH=1500;

    _Z.defScene("level1",{
      drawQuad(c, x1,y1,w1,x2,y2,w2){
        this.gfx.beginFill(_S.color(c));
        this.gfx.drawPolygon(
          {x:x1-w1,y:y1},
          {x:x2-w2,y:y2},
          {x:x2+w2,y:y2},
          {x:x1+w1,y:y1});
        this.gfx.endFill();
      },
      _init(){
        _G.arena={x:0,y:0,width:Mojo.width,height:Mojo.height};
        _G.lines=[];
        _G.roadW=2000;
        _G.segL=200;
        _G.pos=0;
        _G.playerX=0;
        _G.camD=0.84;//camera depth
        for(let n, i=0;i<1600;++i){
          n=new Line();
          n.z= i*_G.segL;
          if(i>300&&i<700) n.curve=0.5;
          if(i>750) n.y=sin(i/30)*HH;
          _G.lines.push(n);
        }
        _G.segN=_G.lines.length;
        _G.roadL=_G.segN*_G.segL;
        _S.repeatSprite("images/outrun/bg.png",true,true,Mojo.width,Mojo.height).forEach(s=>{
          this.insert(s);
        });
      },
      setup(){
        this._init();
        this.insert(this.gfx=_S.graphics());
        this.__draw();
      },
      __draw(){
        const N=_G.lines.length;
        let l,maxY=_G.arena.height;
        let startPos=int(_G.pos/_G.segL);
        let camH= HH+_G.lines[startPos].y;
        let x=0,dx=0;
        for(let n=startPos;n<startPos+300;++n){
          l=_G.lines[n%N];
          l.project(_G.playerX-x,camH,_G.pos- (n>=_G.segN?_G.roadL:0));

          x+=dx;
          dx+= l.curve;

          if(l.Y>=maxY)continue;
          maxY=l.Y;

          let grass  = (n/3)%2? _S.color3(16,200,16): _S.color3(0,154,0);
          let rumble = (n/3)%2? _S.color3(255,255,255): _S.color3(0,0,0);
          let road   = (n/3)%2? _S.color3(107,107,107): _S.color3(105,105,105);
          let p = _G.lines[(n-1)%N]; //previous line
          this.drawQuad(grass, 0, p.Y, _G.arena.width, 0, l.Y, _G.arena.width);
          this.drawQuad(rumble,p.X, p.Y, p.W*1.2, l.X, l.Y, l.W*1.2);
          this.drawQuad(road,  p.X, p.Y, p.W, l.X, l.Y, l.W);
        }
      },
      postUpdate(dt){
        if(_I.keyDown(_I.RIGHT)) _G.playerX+=200;
        if(_I.keyDown(_I.LEFT)) _G.playerX-=200;
        if(_I.keyDown(_I.UP)) _G.pos+=200;
        if(_I.keyDown(_I.DOWN)) _G.pos-=200;

        while(_G.pos>= _G.roadL) _G.pos-=_G.roadL;
        while(_G.pos<0) _G.pos+= _G.roadL;

        this.gfx.clear() && this.__draw();
      }
    });
  }

  const _$={
    assetFiles: ["images/outrun/bg.png"],
    arena: {width: 640, height: 320},
    scaleToWindow:"max",
    scaleFit:"x",
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("level1");
    }
  };

  window.addEventListener("load",()=> MojoH5(_$));

})(this);

