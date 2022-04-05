/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright © 2020-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const int=Math.floor;
  const sin=Math.sin;
  const cos=Math.cos;
  const PI2= Math.PI*2;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           Ute2D:_U,
           v2:_V,
           math:_M,
           ute:_,is}=Mojo;

    const Core= window["io/czlab/mcfud/core"]();

    const ROTATE_LEFT=0,
          ROTATE_RIGHT=1,
			    THRUST_UP=2,
          NONE=3;
		const MAX_ACTION_DURATION= 5;
		const MAX_MUTATION_DURATION=3;
		const DIST_TOLERANCE= 4;
	  const SPEED_TOLERANCE= 4;
	  const ROTATION_TOLERANCE= 0.1;

    // Default physical constants for the game
    const DEFAULT_MASS = 6000;        // Roughly based on LEM (4000 accent module + dry decent module)
    const DEFAULT_FUEL = 8000;        // Fuel on the decent module
    const MASS= DEFAULT_MASS+DEFAULT_FUEL;

    const DEFAULT_DELTA_FUEL = 8;     // HACK - how much fuel we loose each update when the engines fire
    const GRAVITY = 1.62;     // Acceleration of the moon
    const THRUST = 45000;     // 45000N as per the LEM decent module
    const ANGLE_LIMIT = 0.1;  // About 6 degrees
    const SPEED_LIMIT = 10;//2;    // 2 m/s  ( Apollo 17 landed ~ 6.7 feet/s velocity )
    //const DEFAULT_SPEED = 2;          // Game speed - make for a faster 'arcade-like' game
    //const DEFAULT_DELAY = 2000;
    // Constants
    const CONST_ONE_DEGREE = Math.PI / 180;   // 1 degree in radians
    const ROTATION=CONST_ONE_DEGREE;
		const GRAVITY_PER_TICK= GRAVITY/60;
		const THRUST_PER_TICK= THRUST/60;
		const ROTATION_PER_TICK= ROTATION/60;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Moon Lander",
        clickSnd:"click.mp3",
        action: {name:"PlayGame"}
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("PlayGame",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            _G.tickCount=0;
          },
          initTerrain(out){
            let maxH=int(Mojo.height*0.4);
            let minH= int(maxH*0.25);
            let hoffset=100*K;
            let s,pad=4,N=10;
            let w=Mojo.width/N;
            let vcolor=_S.color("#906908");
            let pcolor=_S.color("#cbcb02");
            let T=[0.1,0.24,0.24,0.24,0.24,0.24,0.35,0.35,0.35,0.35];
            let V=[0,0,0.2,0.5,0,0.7,0.7,1.2,1.2,0];
            _.assert(V.length==T.length && T.length==N,"bad terrain");
            for(let h, i=0;i<N;++i){
              h=T[i]* maxH;
              s=_S.rect(w,h,vcolor,vcolor);
              _S.uuid(s,`ground#${i}`);
              s.x=w*i;
              s.y=Mojo.height-hoffset-s.height;
              out.push(T[i]=self.insert(s,true));
            }
            for(let dx,dy,z,x,h, i=0;i<N;++i){
              h=V[i]* maxH;
              z=0;
              dy=0;
              dx=0;
              if(h>0){
                x=w*i;
                if((i+1<N) && V[i]==V[i+1]){
                  z=w;
                }/*
                if(T[i].height>T[i-1].height){
                  dy=T[i].height-T[i-1].height;
                  dx= -dy;
                }*/
                s=_S.triangle(w+z,h,0.5,vcolor,vcolor);
                _S.uuid(s,`hill#${i}`);
                s.x=x+dx;
                s.y=Mojo.height-hoffset-s.height-T[i].height + dy;
                out.push(self.insert(s,true));
                if(z>0)i++;
              }
            }
            let gc=_S.color("#739b08");
            let g=_S.rect(Mojo.width,hoffset,gc,gc);
            g.y=Mojo.height-g.height;
            self.insert(g);
            /////
            let ps=_S.rect(T[pad].width/2,10,pcolor,pcolor);
            _S.uuid(ps,"landing_pad");
            _S.centerAnchor(ps);
            ps.x=T[pad].x+T[pad].width/2;
            ps.y=T[pad].y-ps.height/2;
            self.insert(ps,true);
            /////pad2
            if(false){
              pad=N-1;
              ps=_S.rect(T[pad].width/2,10,pcolor,pcolor);
              _S.centerAnchor(ps);
              ps.x=T[pad].x+T[pad].width/2;
              ps.y=T[pad].y-ps.height/2;
              self.insert(ps,true);
            }
            _.inject(_G,{
              obstacles:out,
              target:ps
            });
          },
          initPlayer(){
            let s= _S.sprite("lander.png"),
                w=s.height,
                p=_S.sprite(_S.frames("lander.png",w,w)),
                k= 0.6*_G.target.width/p.width;
            _S.centerAnchor(_S.scaleBy(p,k,k));
            p.m5.vel[0]=_.randSign()*20;
            //p.m5.vel[1]=100;
            p.m5.mass=MASS;
            p.m5.tick=(dt)=>{
              if(p.g.landed){return}
              p.x += p.m5.vel[0]* dt;
              p.y += p.m5.vel[1] * dt;
              //update the acceleration
              p.m5.vel[1] += 1.2*GRAVITY * dt;
              if(_I.keyDown(_I.LEFT)){
                p.rotation -= CONST_ONE_DEGREE;
              }
              if(_I.keyDown(_I.RIGHT)){
                p.rotation += CONST_ONE_DEGREE;
              }
              if(_I.keyDown(_I.SPACE)||_I.keyDown(_I.UP)){
                let accel = 2*THRUST * dt / p.m5.mass;
                p.m5.vel[0] += accel * Math.sin(p.rotation);
                p.m5.vel[1] -= accel * Math.cos(p.rotation);
              }
            };
            p.x=_.randInt2(Mojo.width*0.1,Mojo.width*0.9);
            _G.player= self.insert(p,true);

          }
        });
        function cb(){
          if(_I.keyDown(_I.SPACE)||_I.keyDown(_I.UP)){
            _G.player.m5.showFrame(1);
          }else{
            _G.player.m5.showFrame(0);
          }
          self.future(cb,500);
        }
        self.future(cb,500);
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _Z.run("StarfieldBg",{static:true});
        this.g.initLevel();
        this.g.initTerrain([]);
        this.g.initPlayer();
        _Z.run("HotKeys",{
          fontSize: 42*K,
          radius: 30*K,
          color: "grey",
          alpha: 0.5,
          cb(obj){
            _V.set(obj.right, Mojo.width-obj.right.width,Mojo.height-obj.right.height);
            _S.pinLeft(obj.right,obj.left,obj.right.width/4);
            _V.set(obj.up,obj.up.width,Mojo.height-obj.up.height);
            delete obj.down;
            return obj;
          }
        });
      },
      dispose(){
        this.g.toggle && this.g.toggle.dispose();
      },
      postUpdate(dt){
        let ok,objs=this.searchSGrid(_G.player);
        for(let o,i=0;i<objs.length;++i){
          o=objs[i];
          if(_S.hit(o,_G.player)){
            if(o.m5.uuid=="landing_pad"){
              let v = _G.player.m5.vel[0] + _G.player.m5.vel[1];
              let ang = Math.abs(_G.player.rotation);
              ok=v < SPEED_LIMIT && ang < ANGLE_LIMIT;
            }
            this.m5.dead=true;
            _.delay(CLICK_DELAY,()=>{
              _Z.modal("EndGame",{

                fontSize:64*Mojo.getScaleFactor(),
                replay:{name:"PlayGame"},
                quit:{name:"Splash", cfg:SplashCfg},
                msg: ok?"You Win!":"You Lose!",
                winner:ok

              })
            });
            break;
          }
        }
      }
    });

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["lander.png","click.mp3","fire.mp3",
                 "explosion.mp3","game_over.mp3","game_win.mp3"],
    arena: {width: 1344, height: 840},
    scaleToWindow:"max",
    scaleFit:"x",
    start(...args){ scenes(...args) }

  }));

})(this);


