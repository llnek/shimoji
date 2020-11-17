;(function(window){
  "use strict";

  function scenes(Mojo){
    let _=Mojo.u, is=Mojo.is;
    let _Z=Mojo.Scenes;
    let _S=Mojo.Sprites;
    let _T=Mojo.Effects;
    let _I=Mojo.Input;
    let _G=Mojo.Game;
    let _2d= Mojo["2d"];

    let _bullets=[];

    _Z.defScene("Bg",{
      setup(){
      }
    });

    function _repos(p){
      let maxSide = Math.sqrt(p.height * p.height  + p.width + p.width);
      if(p.x > Mojo.width + maxSide) { p.x -= Mojo.width + maxSide }
      if(p.x < -maxSide) { p.x += Mojo.width + maxSide }

      if(p.y > Mojo.height + maxSide) { p.y -= Mojo.height + maxSide }
      if(p.y < -maxSide) { p.y += Mojo.height + maxSide }
    }

    function _mkAstro(kind){
      let z= Mojo.scaleSZ(Mojo.designResolution,Mojo);
      let a= _S.sprite("astro.png");
      //486,462
      //780,540
      _S.centerAnchor(a);
      a.scale.x= 0.2;
      a.scale.y=0.2;
      switch(kind){
      case 1:
      a.mojoh5.rank=1;
      a.mojoh5.speed=10;
      break;
      case 2:
      a.scale.x *= 0.45;
      a.scale.y *= 0.45;
      a.mojoh5.rank=2;
      a.mojoh5.speed=15;
      break;
      case 3:
      a.scale.x *= 0.25;
      a.scale.y *= 0.25;
      a.mojoh5.rank=3;
      a.mojoh5.speed=20;
      break;
      }
      let twist= Math.random() > 0.5 ? 1 : -1;
      a.scale.x *= z.width;
      a.scale.y *= z.width;
      a.mojoh5.step=function(dt){
        let scene=a.parent;
        let b;
        _S.move(a,dt);
        _repos(a);
        a.angle += twist*0.2;
        for(let i=0;i<_bullets.length;++i){
          b=_bullets[i];
          if(Mojo["2d"].hitTest(a,b)){
            _.disj(_bullets,b);
            _S.remove(b);
            a.explode();
            break;
          }
          b=null;
        }
        if(!b){
          if(scene.ship && Mojo["2d"].hitTest(a,scene.ship)){
            _S.remove(scene.ship);
            scene.ship=null;
          }
        }
      }
      a.explode=function(){
        let t= a.mojoh5.rank===1?2:(a.mojoh5.rank===2?3:0);
        let scene=a.parent;
        let X=a.x;
        let Y=a.y;
        _S.remove(a);
        if(t===0){

        }else{
          for(let g,x,i=0;i<3;++i){
            x=_mkAstro(t);
            g= 120*i + Math.random() * 120;
            x.mojoh5.vel[0]=Math.cos(g)*x.mojoh5.speed;
            x.mojoh5.vel[1]=Math.sin(g)*x.mojoh5.speed;
            x.x=X;
            x.y=Y;
            scene.insert(x);
          }
        }
      }
      return a;
    }

    function _mkShip(scene){
      let s= _S.sprite(_S.frames("rocket.png",512,512));
      _S.centerAnchor(s);
      s.mojoh5.showFrame(0);
      s.mojoh5.acc[0] = 8;
      s.mojoh5.acc[1]=8;
      s.scale.x *= 0.07;
      s.scale.y *= 0.07;
      s.angle= 0;
      _G.omega=0;
      _G.omegaDelta= 700;
      _G.maxOmega= 400;
      let fire=_I.keyboard(_I.keySPACE);
      fire.press = function(){
        let S=Math.sin(s.rotation);
        let C=Math.cos(s.rotation);
        let y=s.y+s.height*S* 0.5;
        let x=s.x+s.height*C* 0.5;

        let b=_S.sprite("laser.png");
        _S.centerAnchor(b);
        b.scale.x *= 0.3;
        b.scale.y *= 0.5;
        b.rotation=s.rotation;
        b.x=x;
        b.y=y;
        b.mojoh5.vel[0]=3 * C;
        b.mojoh5.vel[1]=3 * S;
        b.mojoh5.step=function(){
          if(!b.mojoh5.dead) _S.move(b);
        };
        _bullets.push(b);
        scene.insert(b);
      };
      s.mojoh5.step=function(dt){
        let u= _I.keyDown(_I.keyUP);
        let r= _I.keyDown(_I.keyRIGHT);
        let l=_I.keyDown(_I.keyLEFT);
        s.mojoh5.showFrame(u?1:0);
        s.angle += _G.omega * dt;
        _G.omega *=  1 - 1*dt;

        if(r){
          _G.omega += _G.omegaDelta * dt;
          if(_G.omega > _G.maxOmega) { _G.omega = _G.maxOmega }
        }else if(l){
          _G.omega -= _G.omegaDelta * dt;
          if(_G.omega < -_G.maxOmega) { _G.omega = -_G.maxOmega }
        }

        if(s.angle > 360) { s.angle -= 360 }
        if(s.angle < 0) { s.angle += 360 }

        if(u){
          let dy = Math.sin(s.angle * Math.PI / 180);
          let dx= Math.cos(s.angle * Math.PI / 180);
          s.mojoh5.vel[0] += dx * s.mojoh5.acc[0];
          s.mojoh5.vel[1] += dy * s.mojoh5.acc[1];
        }

        _S.move(s,dt);
        _repos(s);
      };
      return s;
    }

    function _initAstros(scene){
      let a= _mkAstro(1);
      let h= a.height;
      let w= a.width;
      let W= _.floor(Mojo.width /w);
      let W3=_.floor(W/3);
      let H= Mojo.height/h;
      let cx=Mojo.width/2;
      let cy=Mojo.height/2;
      let speed=20;
      for(let r,vx,vy,px,py,i=0;i <5;++i){
        r= _.isEven(i) ? _.randInt2(W-W3,W) : _.randInt2(0,W3);
        px=r * w + w/2;
        py=Math.random()*H * h + h/2;
        a=_mkAstro(1);
        a.x=px;
        a.y=py;
        if(px>cx){
          vx= -speed;
        }else{
          vx= speed;
        }
        if(py>cy){
          vy=-speed;
        }else{
          vy=speed;
        }
        a.mojoh5.vel[0]=vx;
        a.mojoh5.vel[1]=vy;
        scene.insert(a);
      }
    }

    _Z.defScene("PlayGame", {
      setup(){
        let s= this.ship= _mkShip(this);
        s.x=Mojo.width/2;
        s.y=Mojo.height/2;
        this.insert(s);
        _initAstros(this);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){
      }
    });
  }

  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("Bg");
    Mojo.Scenes.runScene("PlayGame");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["astro.png","rocket.png","laser.png"],
      arena: {width:780, height:540},
      scaleToWindow: "max",
      backgroundColor: 0,
      start: setup,
    });
  });

})(this);


