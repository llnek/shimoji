/* Licensed under the Apache License, Version 2.0 (the "License");
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
 * Copyright © 2020-2024, Kenneth Leung. All rights reserved. */

;(function(gscope,UNDEF){

  "use strict";

  ////////////////////////////////////////////////////////////////////////////
  /**Create the module. */
  ////////////////////////////////////////////////////////////////////////////
  function _module(Mojo){

    ////////////////////////////////////////////////////////////////////////////
    const Geo=gscope["io/czlab/mcfud/geo2d"]();
    const { v2:_V, math:_M, is, ute:_}=Mojo;
    const
      abs=Math.abs,
      cos=Math.cos,
      sin=Math.sin,
      int=Math.floor,
      R=Math.PI/180,
      CIRCLE=Math.PI*2;

    ////////////////////////////////////////////////////////////////////////////
    /**
     * @module mojoh5/Ute2D
     */
    ////////////////////////////////////////////////////////////////////////////

    /**
     * @typedef {object} HealthBarConfig
     * @property {number} scale scaling factor for drawing
     * @property {number} width width of the widget
     * @property {number} height height of the widget
     * @property {number} lives  default is 3
     * @property {number} borderWidth default is 4
     * @property {number|string} line color used for line
     * @property {number|string} fill color used for fill
     */

    /**
     * @typedef {object} HealthBarObj
     * @property {function} dec decrement live count
     * @property {number} lives lives remaining
     * @property {PIXI/Sprite} sprite the visual widget
     */

    /**
     * @typedef {object} GaugeUIConfig
     * @property {number} cx
     * @property {number} cy
     * @property {number} scale
     * @property {number} radius
     * @property {number} alpha
     * @property {PIXI/Graphics} gfx
     * @property {number|string} fill fill color
     * @property {number|string} line line color
     * @property {number|string} needle color of the needle
     * @property {function} update return next value (e.g. speed)
     */

    /**
     * @typedef {object} GaugeUIObj
     * @property {PIXI/Graphics} gfx
     * @property {function} draw draw the widget
     */

    /**
     * @typedef {object} PatrolObj
     * @property {function} goLeft
     * @property {function} goRight
     * @property {function} goUp
     * @property {function} goDown
     * @property {function} dispose
     */

    /**
     * @typedef {object} PlatformerObj
     * @property {function} dispose
     * @property {function} onTick
     * @property {number} jumpSpeed
     * @property {number} jumpKey  default is UP key
     */

    /**
     * @typedef {object} MazeRunnerObj
     * @property {function} dispose
     * @property {function} onTick
     */

    ////////////////////////////////////////////////////////////////////////////
    //internal use only
    //////////////////////////////////////////////////////////////////////////////
		Mojo.Scenes.scene("Splash",{
      setup(options){
        let C,s, st,self=this, K=Mojo.getScaleFactor();
        let
          {title,titleFont,titleColor,titleSize}= options,
          {footerMsgSize,action,clickSnd}=options,
          {bg, playMsg,playMsgFont,playMsgColor,playMsgSize,playMsgColor2}= options;

        //ffc901 yellow fd5898 pink e04455 red

        playMsgFont= playMsgFont || Mojo.DOKI_LOWER;
        titleFont= titleFont || Mojo.BIGSHOUTBOB;
        footerMsgSize= (footerMsgSize || 18)*K;
        playMsg=playMsg || Mojo.clickPlayMsg();
        playMsgColor= playMsgColor ?? Mojo.Sprites.color("white");
        playMsgColor2= playMsgColor2 ?? Mojo.Sprites.color("#ffc901");
        titleColor= titleColor ?? Mojo.Sprites.color("#ffc901");
        titleSize= (titleSize||96)*K;
        playMsgSize= (playMsgSize||48)*K;

        self.insert(Mojo.Sprites.fillMax(bg?bg:"boot/splash.jpg"));
        C= self.insert(Mojo.Sprites.container());

        ////////////////////////////////////////////////////////////////////////////
        //the title
        if(1){
          st=Mojo.Sprites.bmpText(title, titleFont,titleSize);
          _.echt(titleColor) ? Mojo.Sprites.tint(st,titleColor) : 0;
          _V.set(st, Mojo.width/2,Mojo.height*0.45);
          C.addChild(Mojo.Sprites.centerAnchor(st));
        }

        ////////////////////////////////////////////////////////////////////////////
        //play message
        if(1){
          s=Mojo.Sprites.bmpText(playMsg,playMsgFont,playMsgSize);
          let t2,t=Mojo.FX.throb(s, 0.747, 0.747);
          const cf=()=>{
            Mojo.Sprites.tint(s,playMsgColor2);
            Mojo.FX.remove(t);
            t2=Mojo.FX.tweenAlpha(C,Mojo.FX.EASE_OUT_SINE,0,90);
            t2.onComplete=()=>Mojo.Scenes.runEx(action.name,action.cfg);
          };
          let sub= Mojo.Sprites.oneOffClick(cf,clickSnd);
          Mojo.Sprites.centerAnchor(s);
          Mojo.Sprites.pinBelow(st,s);
          C.addChild(s);
          if(!Mojo.touchDevice){
            this.g.space= Mojo.Input.keybd(Mojo.Input.SPACE,()=>{
              Mojo.Sprites.cancelOneOffClick(sub);
              cf();
              Mojo.sound(clickSnd).play();
            });
          }
        }

        ////////////////////////////////////////////////////////////////////////////
        //footer
        if(1){
          const s2= Mojo.Sprites.bmpText("Powered by MojoH5 2d game engine.",Mojo.UNSCII,footerMsgSize);
          const s1= Mojo.Sprites.bmpText(Mojo.COPYRIGHT, Mojo.UNSCII, footerMsgSize);
          Mojo.Sprites.pinBelow(this,s1,-s1.height*1.5,0);
          Mojo.Sprites.pinBelow(this,s2,-s2.height*1.5,1);
          this.insert(s1);
          this.insert(s2);
        }
      },
      preDispose(){
        this.g.space?.dispose();
      }
    });

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("EndGame",{
      setup(options){
        let
          {winner,snd}=options,
          {fontName,fontSize,msg,replay,quit}= options;
        if(!snd) snd= winner ? "game_win.mp3" : "game_over.mp3";
        fontSize=(fontSize||32)*Mojo.getScaleFactor();
        fontName=fontName || Mojo.DOKI_LOWER;
        let
          os={fontName, fontSize},
          space=()=>Mojo.Sprites.opacity(Mojo.Sprites.bmpText("#",os),0),
          s1=Mojo.Sprites.bmpText("Game Over", os),
          s2=Mojo.Sprites.bmpText(msg, os),
          s4=Mojo.Input.mkBtn(Mojo.Sprites.bmpText("Play Again?",os)),
          s5=Mojo.Sprites.bmpText(" or ",os),
          s6=Mojo.Input.mkBtn(Mojo.Sprites.bmpText("Quit",os));
        s4.m5.press=()=>Mojo.Scenes.runEx(replay.name,replay.cfg);
        s6.m5.press=()=>Mojo.Scenes.runEx(quit.name,quit.cfg);
        Mojo.sound(snd).play();
        this.insert(Mojo.Scenes.layoutY([s1,s2,space(),space(),space(),s4,s5,s6],options));
      }
    });

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("PhotoMat",{
      setup(arg){
        let s= arg.image? Mojo.resource(arg.image): UNDEF;
        this.g.gfx=Mojo.Sprites.graphics();
        //top,bottom
        Mojo.Sprites.grect(this.g.gfx, 0,0,Mojo.width,arg.y1);
        Mojo.Sprites.grect(this.g.gfx, 0,arg.y2,Mojo.width,Mojo.height-arg.y2);
        //left,right
        Mojo.Sprites.grect(this.g.gfx, 0,0,arg.x1,Mojo.height);
        Mojo.Sprites.grect(this.g.gfx, arg.x2,0,Mojo.width-arg.x2,Mojo.height);
        s ? Mojo.Sprites.gfillEx(this.g.gfx, s,{})
          : Mojo.Sprites.gfill(this.g.gfx, {color:Mojo.Sprites.color(arg.color)});
        this.insert(this.g.gfx);
      }
    });

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("HotKeys",{
      setup(options){
        let
          {Sprites:_S, Input:_I}=Mojo,
          K=Mojo.getScaleFactor(),
          gap=1.2,
          W=Mojo.width,
          H=Mojo.height,
          m, dx,dy, bs, opstr= options.buttons?"makeButton":"makeHotspot",
          {fontName,fontSize,cb,radius,alpha,color}=options,
          {char_fire,char_down,char_up,char_left,char_right}=options;

        fontName=fontName||Mojo.DOKI_LOWER;
        fontSize=(fontSize||48)*K;
        radius= (radius || 64)*K;
        alpha= alpha ?? 0.5;
        color=color ?? "grey";

        options.fontName=fontName;
        options.fontSize=fontSize;
        options.radius= radius;
        options.alpha= alpha;
        options.color=color;

        function mk(acc,k,ch){
          let s=_S.opacity(_S.circle(radius,color),alpha);
          s.addChild(_S.centerAnchor(_S.tint(_S.bmpText(ch,fontName,fontSize),"white")));
          acc[k]=s;
        }

        dx=[UNDEF,UNDEF];
        dy=[UNDEF,UNDEF];
        m={};
        (options.right ?? true) ? mk(m, "right", char_right || ">") : 0;
        (options.left ?? true) ? mk(m, "left", char_left || "<") : 0;
        (options.up ?? true) ? mk(m, "up", char_up || "+") : 0;
        (options.down ?? true) ? mk(m, "down", char_down || "-") : 0;
        (options.fire ?? false) ? mk(m, "fire", char_fire || "^") : 0;

        if(options.southpaw){
          if(m.left) dx[0]=m.left;
          if(m.right){ if(dx[0]) dx[1]=m.right; else dx[0]=m.right; }
          if(dx[0]) _V.set(dx[0], gap*dx[0].width, H- gap*dx[0].height);
          if(dx[1]) _S.pinRight(dx[0],dx[1], dx[0].width/3);
          if(m.up) dy[0]=m.up;
          if(m.down){ if(dy[0]) dy[1]=m.down; else dy[0]=m.down; }
          if(dy[0]) _V.set(dy[0], W- gap*dy[0].width, H- gap*dy[0].height);
          if(dy[1]) _S.pinLeft(dy[0],dy[1],dy[0].width/3);
        }else{
          if(m.right) dx[0]=m.right;
          if(m.left){ if(dx[0]) dx[1]=m.left; else dx[0]=m.left; }
          if(dx[0]) _V.set(dx[0], W- gap*dx[0].width, H- gap*dx[0].height);
          if(dx[1]) _S.pinLeft(dx[0],dx[1],dx[0].width/3);
          if(m.up) dy[0]=m.up;
          if(m.down){ if(dy[0]) dy[1]=m.down; else dy[0]=m.down; }
          if(dy[0]) _V.set(dy[0], gap*dy[0].width, H- gap*dy[0].height);
          if(dy[1]) _S.pinRight(dy[0],dy[1], dy[0].width/3);
        }
        if(m.fire){
          if(dy[0])
            _S.pinAbove(dy[0],m.fire, dy[0].height/3);
          else
            _V.set(m.fire, gap*m.fire.width, H- gap*m.fire.height);
        }
        if(cb){
          bs=cb(m);
        }else{
          bs=m;
        }

        function tcb(obj,dir){
          let p=obj.m5.touch;
          obj.m5.touch=function(o,t){
            t?_I.setKeyOn(dir):_I.setKeyOff(dir);
            p? p.call(obj.m5, t) : 0;
          }
          return obj;
        }

        if(bs.right){
          this.insert(_I[opstr](bs.right));
          if(bs.right.m5.hotspot) tcb(bs.right,_I.RIGHT);
        }
        if(bs.left){
          this.insert(_I[opstr](bs.left));
          if(bs.left.m5.hotspot) tcb(bs.left,_I.LEFT);
        }
        if(bs.up){
          this.insert(_I[opstr](bs.up));
          if(bs.up.m5.hotspot) tcb(bs.up, _I.UP);
        }
        if(bs.down){
          this.insert(_I[opstr](bs.down));
          if(bs.down.m5.hotspot) tcb(bs.down, _I.DOWN);
        }
        if(bs.fire){
          this.insert(_I[opstr](bs.fire));
          if(bs.fire.m5.hotspot) tcb(bs.fire, _I.SPACE);
        }
        //run any extra code...
        options.extra?.(this, options);
      }
    });

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("AudioIcon",{
      setup(arg){
        let
          {cb,iconOn,iconOff}= arg,
          {xOffset,yOffset,xScale,yScale}=arg,
          {Sound}=Mojo, K=Mojo.getScaleFactor(),
          s=Mojo.Input.mkBtn(Mojo.Sprites.spriteFrom(iconOn||"boot/audioOn.png",iconOff||"boot/audioOff.png"));

        xScale= xScale ?? K;
        yScale= yScale ?? K;
        yOffset= yOffset ?? 0;
        xOffset= xOffset ?? -10*K;
        Mojo.Sprites.scaleXY(Mojo.Sprites.opacity(s,0.343),xScale,yScale);
        _V.set(s,Mojo.width-s.width+xOffset, 0+yOffset);

        s.m5.showFrame(Sound.sfx()?0:1);
        s.m5.press=()=>{
          if(Sound.sfx()){
            Sound.mute(); s.m5.showFrame(1);
          }else{
            Sound.unmute(); s.m5.showFrame(0);
          }
        };
        this.insert(s);
      }
    });

    ////////////////////////////////////////////////////////////////////////////
    //original source: https://pixijs.com/8.x/playground?exampleId=advanced.starWarp
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("SpaceWarp",{
      setup(o){
        let _S=Mojo.Sprites;
        let self=this;
        let cameraZ = 0;
        const fov = 20;
        const baseSpeed = 0.025;
        let speed = 0;
        const starStretch = 5;
        const starBaseSize = 0.05;
        _.patch(o,{
          count:1000,
          interval: 5000
        });
        _.inject(this.g,{
          stars: [],
          inWarp:false,
          warpSpeed:0,
          interval: o.interval,
          init(){
            for(let s,i=0; i < o.count; ++i){
              s={ sprite: _S.anchorXY(_S.sprite("boot/star.png"),0.5,0.7),  x: 0, y: 0, z:0 };
              this.rand(s, true);
              this.stars.push(s);
              self.insert(s.sprite);
            }
          },
          rand(s,initQ){
            s.sprite.tint= _.rand()<0.3?Mojo.Sprites.SomeColors.yellow:Mojo.Sprites.SomeColors.white;
            // randomize star pos so none hits the camera.
            let deg = Math.random() * Math.PI * 2, dist = Math.random() * 50 + 1;
            s.x = Math.cos(deg) * dist;
            s.y = Math.sin(deg) * dist;
            s.z = initQ ? Math.random() * 2000 : cameraZ + Math.random() * 1000 + 2000;
          },
          moveStars(dt){
            const H=Mojo.height, H2=H/2, W=Mojo.width, W2=W/2;
            let dc,ds,cx,cy,z;
            // simple easing.
            speed += (this.warpSpeed - speed) / 20;
            cameraZ += dt * 1000 * (speed + baseSpeed);
            this.stars.forEach(s=>{
              if(s.z < cameraZ) this.rand(s);
              // map star 3D pos to 2D with simple projection
              z = s.z - cameraZ;
              s.sprite.x = s.x * (fov / z) * W + W2;
              s.sprite.y = s.y * (fov / z) * W + H2;
            // calculate star scale & rotation.
              cx = s.sprite.x - W2;
              cy = s.sprite.y - H2;
              dc = Math.sqrt(cx * cx + cy * cy);//dist to center
              ds = Math.max(0, (2000 - z) / 2000);//dist scale
              s.sprite.scale.x = ds * starBaseSize;
              // Star is looking towards center so that y axis is towards center.
              // Scale the star depending on how fast we are moving, what the stretchfactor is
              // and depending on how far away it is from the center.
              s.sprite.scale.y = ds * starBaseSize + (ds * speed * starStretch * dc) / W;
              s.sprite.rotation = Math.atan2(cy,cx) + Math.PI / 2;
            });
          }
        });
        function loopy(){
          this.g.warpSpeed = this.g.warpSpeed > 0 ? 0 : 1;
          self.future(loopy, o.interval);
        }
        if(o.static){}else{
          this.future(()=>{
            this.g.warpSpeed=1;
            if(o.repeat)
              self.future(loopy, o.interval);
            else
              self.future(()=>{ this.g.warpSpeed=0 },o.interval);
          },o.delayMillis);
        }
        this.g.init();
      },
      postUpdate(dt){
        this.g.moveStars(dt)
      },
      isBusy(){
        return this.g.inWarp;
      },
      warp(){
        let self=this;
        if(this.g.inWarp){}else{
          this.g.inWarp=true;
          this.g.warpSpeed=1;
          self.future(()=>{
            this.g.warpSpeed=0;
            self.g.inWarp=false;
          },this.g.interval);
        }
      }
    },{interval: 3000, count: 1000, delayMillis: 343, repeat:false});

    ////////////////////////////////////////////////////////////////////////////
    //original source: https://github.com/dwmkerr/starfield/blob/master/starfield.js
    ////////////////////////////////////////////////////////////////////////////
    Mojo.Scenes.scene("StarfieldBg",{
      setup(o){
        const
          self=this,
          stars=[],
          gfx=Mojo.Sprites.graphics();

        _.patch(o,{
          height:Mojo.height,
          width:Mojo.width,
          count:100,
          minVel:15,
          maxVel:30
        });
        _.inject(this.g,{
          gfx,
          stars,
          lag:0,
          dynamic:true,
          fps: 1/o.fps,
          draw(){
            Mojo.Sprites.gclear(gfx);
            stars.forEach(s=>{
              Mojo.Sprites.grect(gfx,s.x, s.y, s.size, s.size);
              Mojo.Sprites.gfill(gfx,{color:_.rand()<0.3?Mojo.Sprites.SomeColors.yellow:Mojo.Sprites.SomeColors.white});
            });
            return this;
          },
          moveStars(dt){
            this.lag +=dt;
            if(this.lag>=this.fps){
              this.lag=0;
              stars.forEach(s=>{
                s.y += dt * s.vel;
                if(s.y > o.height){
                  _V.set(s, _.randInt(o.width), 0);
                  s.size=_.randInt(4);
                  s.vel=(_.rand()*(o.maxVel- o.minVel))+o.minVel;
                }
              });
              this.draw();
            }
          }
        });
        if(o.static)
          this.g.dynamic=false;
        for(let i=0; i<o.count; ++i)
          stars[i] = {x: _.rand()*o.width,
                      y: _.rand()*o.height,
                      size:_.rand()*3+1,
                      vel:(_.rand()*(o.maxVel- o.minVel))+o.minVel};
        this.g.draw() && this.insert(gfx);
      },
      postUpdate(dt){
        this.g.dynamic && this.g.moveStars(dt)
      }
    },{fps:90, count:100, minVel:15, maxVel:30 });

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**Emit something every so often...
     * @class
     */
    class Periodic {
      #interval;
      #ctor;
      #timer;
      #size;
      #pool;
      constructor(ctor,intervalSecs,size=16){
        this.#interval=intervalSecs;
        this.#ctor=ctor;
        this.#timer=0;
        this.#size=size
        this.#pool=_.fill(size,ctor);
      }
      lifeCycle(dt){
        this.#timer += dt;
        if(this.#timer > this.#interval){
          this.#timer = 0;
          this.discharge();
        }
      }
      discharge(){
        throw `Periodic: please implement action()` }
      reclaim(o){
        if(this.#pool.length<this.#size) this.#pool.push(o)
      }
      take(){
        return this.#pool.length>0? this.#pool.pop(): this.#ctor()
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function Camera(e,worldWidth,worldHeight,canvas){
      const
        _height= canvas?.height ?? worldHeight,
        _width= canvas?.width ?? worldWidth,
        sigs=[],
        world=e,
        h2=int(_height/2),
        w2=int(_width/2),
        h4=int(_height/4),
        w4=int(_width/4);
      let
        _x=0,
        _y=0,
        self={
          dispose(){ Mojo.off(self) },
          //changing the camera's xy pos shifts pos of the world in the opposite direction
          //e.g. panning camera right means pulling world to left
          set x(v){ _x=v; e.x= -_x },
          set y(v){ _y=v; e.y= -_y },
          get x(){ return _x },
          get y(){ return _y },
          worldHeight,
          worldWidth,
          width: _width,
          height: _height,
          follow(s){
            //Check the sprites position in relation to the viewport.
            //Move the camera to follow the sprite if the sprite
            //strays outside the viewport
            const bx= _.feq0(s.angle)? Mojo.Sprites.getAABB(s) : Mojo.Sprites.boundingBox(s);
            { if(bx.x1< this.x+int(w2-w4)){ this.x = bx.x1-w4 }}//left
            { if(bx.x2> this.x+int(w2+w4)){ this.x = bx.x2-w4*3 }}//right
            { if(bx.y1< this.y+int(h2-h4)){ this.y = bx.y1-h4 }}//top
            { if(bx.y2> this.y+int(h2+h4)){ this.y = bx.y2- h4*3 }}//bottom
            //clamp the camera
            if(this.x<0){ this.x = 0 }
            if(this.y<0){ this.y = 0 }
            if(this.x+_width > worldWidth){ this.x= worldWidth - _width }
            if(this.y+_height > worldHeight){ this.y= worldHeight - _height }
            //contain the object
            let {x1,x2,y1,y2}=s.m5.getImageOffsets();
            let n= bx.x2 - x2;
            if(n>worldWidth){ s.x -= (n-worldWidth) }
            n=bx.y2 - y2;
            if(n>worldHeight){ s.y -= (n-worldHeight) }
            n=bx.x1 + x1;
            if(n<0) { s.x += -n }
            n=bx.y1  + y1;
            if(n<0) { s.y += -n }
            return s;
          },
          //NOTE: old fashion funcdef when `arguments` is used
          centerOver:function(s,y){
            if(arguments.length==1 && !is.num(s)){
              const c=Mojo.Sprites.centerXY(s);
              this.x = c[0]- w2;
              this.y = c[1] - h2;
            }else{
              if(is.num(s)) this.x=s - w2;
              if(is.num(y)) this.y=y - h2;
            }
            return s;
          }
        };
      Mojo.on(["post.remove",e],"dispose",self);
      return self;
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function Meander(e){
      function boomFn(e,col,dv,signal){
        //_.log(`boomFn dv=${dv}, signal=${signal}`);
        col.impact=abs(dv);
        Mojo.emit([signal, e],col);
      }
      const colls=[];
      const self={
        dispose(){ Mojo.off(self) },
        boom(col){
          _.assert(col.A===e,"got hit by someone else???");
          if(col.B && col.B.m5.sensor){
            //tell sensor it got hit by A
            Mojo.emit(["bump.sensor", col.B], col.A)
          }else{
            let b=0,[dx,dy]= e.m5.vel;
            col.impact=UNDEF;
            //update position
            _V.sub$(e,col.overlapV);
            if(col.overlapN[1] < -0.3){
              dy<0?(e.m5.skipHit?0: _V.setY(e.m5.vel,0)):0;
              boomFn(e,col,dy,"bump.top");
            }else if(col.overlapN[1] > 0.3){
              dy>0?(e.m5.skipHit?0: _V.setY(e.m5.vel,0)):0;
              boomFn(e,col,dy,"bump.bottom");
            }
            if(col.overlapN[0] < -0.3){
              dx<0?(e.m5.skipHit?0: _V.setX(e.m5.vel,0)):0;
              boomFn(e,col,dx,"bump.left");
            }else if(col.overlapN[0] > 0.3){
              dx>0?(e.m5.skipHit?0: _V.setX(e.m5.vel,0)):0;
              boomFn(e,col,dx,"bump.right");
            }
            if(col.impact===UNDEF){ col.impact=0 }else{
              Mojo.emit(["bump.*",e],col);
            }
          }
          colls.push(col);
        }
      };
      Mojo.on(["hit",e],"boom", self);
      Mojo.on(["post.remove",e],"dispose",self);
      return function(dt){
        colls.length=0;
        Mojo.Sprites.move(e,dt) && e.parent.collideXY(e);
        return colls.length>0?colls[0]:UNDEF;
      };
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function Jitter(e,jumpSpeed,jumpKey){
      jumpSpeed= jumpSpeed ?? -300;
      jumpKey= jumpKey ?? Mojo.Input.UP;
      //give some time to ease into or outof that ground state
      //instead of just on or off ground,
      let jumpCnt=0, ground=0, j3= jumpSpeed/3;
      const _DT15=1/15;
      const self={
        onGround(){ ground=_DT15 },
        dispose(){ Mojo.off(self) } };
      Mojo.on(["bump.bottom",e],"onGround",self);
      return function(dt,col){
        if(!e.m5.skipHit){
          let
            vs= e.m5.speed,
            pR= Mojo.Input.keyDown(Mojo.Input.RIGHT),
            pL= Mojo.Input.keyDown(Mojo.Input.LEFT),
            pU= Mojo.Input.keyDown(jumpKey);
          if(col && (pL || pR || ground>0)){
            //too steep to go up or down
            if(col.overlapN[1] > 0.85 ||
               col.overlapN[1] < -0.85){ col= UNDEF }
          }
          if(pL && !pR){
            e.m5.heading = Mojo.LEFT;
            if(col && ground>0){
              _V.set(e.m5.vel, vs * col.overlapN[1], -vs * col.overlapN[0])
            }else{
              _V.setX(e.m5.vel,-vs)
            }
          }else if(pR && !pL){
            e.m5.heading = Mojo.RIGHT;
            if(col && ground>0){
              _V.set(e.m5.vel, -vs * col.overlapN[1], vs * col.overlapN[0])
            }else{
              _V.setX(e.m5.vel, vs)
            }
          }else{
            _V.setX(e.m5.vel,0);
          }
          if(ground>0 && jumpCnt==0 && pU){
            //handle jumpy things, very first jump
            _V.setY(e.m5.vel, jumpSpeed);
            jumpCnt +=1;
            ground = -dt;
          }else if(pU){
            //held long enough, tell others it's jumping
            if(jumpCnt<2){
              jumpCnt +=1;
              Mojo.emit(["jump",e]);
            }
          }
          if(jumpCnt && !pU){
            jumpCnt = 0;
            Mojo.emit(["jumped",e]);
            if(e.m5.vel[1] < j3){ e.m5.vel[1] = j3 }
          }
          if(ground>0) e.m5.vel[1]=0;
        }
        ground -=dt;
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /** */
    ////////////////////////////////////////////////////////////////////////////
    function MazeRunner(e,frames){
      const self={ dispose(){ Mojo.off(self) } };
      return function(dt,col){
        let
          [vx,vy]=e.m5.vel,
          vs=e.m5.speed,
          mx = !_.feq0(vx),
          my = !_.feq0(vy);
        if(!(mx&&my) && frames){
          if(my){
            if(is.obj(frames)){
              e.m5.showFrame(frames[vy>0?Mojo.DOWN:Mojo.UP]);
            }else if(frames){
              e.angle=vy>0?180:0;
            }
          }
          if(mx){
            if(is.obj(frames)){
              e.m5.showFrame(frames[vx>0?Mojo.RIGHT:Mojo.LEFT]);
            }else if(frames){
              e.angle=vx>0?90:-90;
            }
          }
        }

        let
          bt=Mojo.u.touchOnly,
          r=bt ? (e.m5.heading==Mojo.RIGHT) : (Mojo.Input.keyDown(Mojo.Input.RIGHT) && Mojo.RIGHT),
          l=bt ? (e.m5.heading==Mojo.LEFT) : (Mojo.Input.keyDown(Mojo.Input.LEFT) && Mojo.LEFT),
          u=bt ? (e.m5.heading==Mojo.UP) : (Mojo.Input.keyDown(Mojo.Input.UP) && Mojo.UP),
          d=bt ? (e.m5.heading==Mojo.DOWN) : (Mojo.Input.keyDown(Mojo.Input.DOWN) && Mojo.DOWN);

        if(l||u){vs *= -1}
        if(l&&r){
          _V.setX(e.m5.vel,0);
        }else if(l||r){
          e.m5.heading= l||r;
          _V.setX(e.m5.vel,vs); }
        if(u&&d){
          _V.setY(e.m5.vel,0);
        }else if(u||d){
          e.m5.heading= u||d;
          _V.setY(e.m5.vel,vs);
        }
      }
    }

    ////////////////////////////////////////////////////////////////////////////
    /**Sprite walks back and forth, like a patrol.
     * @memberof module:mojoh5/Ute2D
     * @param {PIXI/Sprite} e
     * @param {boolean} xDir walk left and right
     * @param {boolean} yDir walk up and down
     * @return {PatrolObj}
     */
    function Patrol(e,xDir,yDir){
      const sigs=[];
      const self={
        dispose(){ Mojo.off(self) },
        goLeft(col){
          e.m5.heading=Mojo.LEFT;
          e.m5.flip= "x";
          _V.setX(e.m5.vel, -col.impact);
        },
        goRight(col){
          e.m5.heading=Mojo.RIGHT;
          e.m5.flip= "x";
          _V.setX(e.m5.vel, col.impact);
        },
        goUp(col){
          _V.setY(e.m5.vel,-col.impact);
          e.m5.heading=Mojo.UP;
          e.m5.flip= "y";
        },
        goDown(col){
          _V.setY(e.m5.vel, col.impact);
          e.m5.heading=Mojo.DOWN;
          e.m5.flip= "y";
        }
      };

      if(xDir){
        Mojo.on(["bump.right",e],"goLeft",self);
        Mojo.on(["bump.left",e],"goRight",self); }
      if(yDir){
        Mojo.on(["bump.top",e],"goDown",self);
        Mojo.on(["bump.bottom",e],"goUp",self); }

      Mojo.on(["post.remove",e],"dispose",self);
      return self;
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    /**The Module */
    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const _$={
      Periodic,
      Meander,
      Camera,
      Patrol,
      Jitter,
      MazeRunner,
      //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
      //steering stuff
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @return {Sprite}
       */
      seek(s, pos){
        const dv = _V.unit$(_V.sub(pos,s));
        if(dv){
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer,dv); }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       * @return {Sprite}
       */
      flee(s, pos,range){
        //only flee if the target is within 'panic distance'
        let dv=_V.sub(s,pos), n=_V.len2(dv);
        if(range === undefined)
          range= s.m5.steerInfo.tooCloseDistance;
        if(n>range*range){}else{
          if(!_V.unit$(dv)) dv=[0.1,0.1];
          _V.mul$(dv, s.m5.maxSpeed);
          _V.sub$(dv, s.m5.vel);
          _V.add$(s.m5.steer, dv);
        }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {vec2} pos
       * @param {number} range
       * @return {Sprite}
       */
      arrive(s, pos,range){
        let r=1, n= _V.dist(s,pos);
        let dv = _V.unit$(_V.sub(pos,s));
        if(range === undefined)
          range= s.m5.steerInfo.arrivalThreshold;
        if(n>range){}else{ r=n/range }
        _V.mul$(dv,s.m5.maxSpeed * r);
        _V.sub$(dv,s.m5.vel);
        _V.add$(s.m5.steer,dv);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} target
       * @return {Sprite}
       */
      pursue(s,target){
        return this.seek(s,
                         //predicted pos
                         _V.add(target,
                                _V.mul(target.m5.vel,
                                       // lookahead time
                                       _V.dist(s,target) / s.m5.maxSpeed)))
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} target
       * @return {Sprite}
       */
      evade(s,target){
        return this.flee(s,
                         //predicted pos
                         _V.sub(target,
                                _V.mul(target.m5.vel,
                                       //lookahead time
                                       _V.dist(s,target) / s.m5.maxSpeed)))

      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @return {Sprite}
       */
      idle(s){
        _V.mul$(s.m5.vel,0);
        _V.mul$(s.m5.steer,0);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @return {Sprite}
       */
      wander(s){
        let
          offset = _V.mul$([1,1], s.m5.steerInfo.wanderRadius),
          n=_V.len(offset),
          center= _V.mul$(_V.unit(s.m5.vel), s.m5.steerInfo.wanderDistance);
        offset[0] = Math.cos(s.m5.steerInfo.wanderAngle) * n;
        offset[1] = Math.sin(s.m5.steerInfo.wanderAngle) * n;
        s.m5.steerInfo.wanderAngle += _.rand() * s.m5.steerInfo.wanderRange - s.m5.steerInfo.wanderRange * 0.5;
        _V.add$(s.m5.steer, _V.add$(center,offset));
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} targetA
       * @param {Sprite} targetB
       * @return {Sprite}
       */
      interpose(s,targetA, targetB){
        let
          mid= _V.div$(_V.add(targetA,targetB),2),
          dt= _V.dist(s,mid) / s.m5.maxSpeed,
          pA = _V.add(targetA, _V.mul(targetA.m5.vel,dt)),
          pB = _V.add(targetB,_V.mul(targetB.m5.vel,dt));
        return this.seek(s, _V.div$(_V.add$(pA,pB),2));
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} separationRadius
       * @param {number} maxSeparation
       * @return {Sprite}
       */
      separation(s, ents, separationRadius=300, maxSeparation=100){
        let force = [0,0], neighborCount = 0;
        ents.forEach(e=>{
          if(e !== s && _V.dist(e,s) < separationRadius){
            _V.add$(force,_V.sub(e,s));
            ++neighborCount;
          }
        });
        if(neighborCount > 0)
          _V.flip$(_V.div$(force,neighborCount));
        _V.add$(s.m5.steer, _V.mul$(_V.unit$(force), maxSeparation));
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {Sprite} leader
       * @param {array} ents
       * @param {number} distance
       * @param {number} separationRadius
       * @param {number} maxSeparation
       * @param {number} leaderSightRadius
       * @param {number} arrivalThreshold
       * @return {Sprite}
       */
      followLeader(s,leader, ents, distance=400, separationRadius=300,
                   maxSeparation = 100, leaderSightRadius = 1600, arrivalThreshold=200){
        function isOnLeaderSight(s,leader, ahead, leaderSightRadius){
          return _V.dist(ahead,s) < leaderSightRadius ||
                 _V.dist(leader,s) < leaderSightRadius
        }
        let tv = _V.mul$(_V.unit(leader.m5.vel),distance);
        let behind, ahead = _V.add(leader,tv);
        _V.flip$(tv);
        behind = _V.add(leader,tv);
        if(isOnLeaderSight(s,leader, ahead, leaderSightRadius)){
          this.evade(s,leader);
        }
        this.arrive(s,behind,arrivalThreshold);
        return this.separation(s,ents, separationRadius, maxSeparation);
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @param {number} maxQueueAhead
       * @param {number} maxQueueRadius
       * @return {Sprite}
       */
      queue(s,ents, maxQueueAhead=500, maxQueueRadius = 500){
        function getNeighborAhead(){
          let qa=_V.mul$(_V.unit(s.m5.vel),maxQueueAhead);
          let res, ahead = _V.add(s, qa);
          for(let d,i=0; i<ents.length; ++i){
            if(ents[i] !== s &&
               _V.dist(ahead,ents[i]) < maxQueueRadius){
              res = ents[i];
              break;
            }
          }
          return res;
        }
        let neighbor = getNeighborAhead();
        let brake = [0,0], v = _V.mul(s.m5.vel,1);
        if(neighbor){
          brake = _V.mul$(_V.flip(s.m5.steer),0.8);
          _V.unit$(_V.flip$(v));
          _V.add$(brake,v);
          if(_V.dist(s,neighbor) < maxQueueRadius){
            _V.mul$(s.m5.vel,0.3)
          }
        }
        _V.add$(s.m5.steer,brake);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} ents
       * @return {Sprite}
       */
      flock(s, ents){
        function inSight(e){
          return _V.dist(s,e) > s.m5.steerInfo.inSightDistance ? false
                                        : (_V.dot(_V.sub(e, s), _V.unit(s.m5.vel)) < 0 ? false : true);
        }
        let
          inSightCount = 0,
          averagePosition = [0,0],
          averageVelocity = _V.mul(s.m5.vel,1);
        ents.forEach(e=>{
          if(e !== this && inSight(e)){
            _V.add$(averageVelocity,e.m5.vel);
            _V.add$(averagePosition,e);
            if(_V.dist(s,e) < s.m5.steerInfo.tooCloseDistance){
              this.flee(s, e)
            }
            ++inSightCount;
          }
        });
        if(inSightCount>0){
          _V.div$(averageVelocity, inSightCount);
          _V.div$(averagePosition,inSightCount);
          this.seek(s,averagePosition);
          _V.add$(s.m5.steer, _V.sub$(averageVelocity, s.m5.vel));
        }
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} path
       * @param {boolean} loop
       * @param {number} thresholdRadius
       * @return {Sprite}
       */
      followPath(s, path, loop, thresholdRadius=1){
        let wayPoint = path[s.m5.pathIndex];
        if(!wayPoint){return}
        if(_V.dist(s, wayPoint) < thresholdRadius){
          if(s.m5.pathIndex >= path.length-1){
            if(loop)
              s.m5.pathIndex = 0;
          }else{
            s.m5.pathIndex += 1;
          }
        }
        (s.m5.pathIndex >= path.length-1 && !loop) ? this.arrive(s,wayPoint)
                                                   : this.seek(s,wayPoint);
        return s;
      },
      /**
       * @memberof module:mojoh5/Ute2D
       * @param {Sprite} s
       * @param {array} obstacles
       * @return {Sprite}
       */
      avoid(s,obstacles){
        let
          avoidance, mostThreatening = null,
          dlen= _V.len(s.m5.vel) / s.m5.maxSpeed,
          ahead = _V.add(s, _V.mul$(_V.unit(s.m5.vel),dlen)),
          ahead2 = _V.add(s, _V.mul$(_V.unit(s.m5.vel),s.m5.steerInfo.avoidDistance*0.5));
        for(let c,i=0; i<obstacles.length; ++i){
          if(obstacles[i] === this) continue;
          c = _V.dist(obstacles[i],ahead) <= obstacles[i].m5.radius ||
              _V.dist(obstacles[i],ahead2) <= obstacles[i].m5.radius;
          if(c)
            if(mostThreatening === null ||
               _V.dist(s,obstacles[i]) < _V.dist(s, mostThreatening)){
              mostThreatening = obstacles[i]
            }
        }
        if(mostThreatening){
          avoidance = _V.mul$(_V.unit$(_V.sub(ahead,mostThreatening)),100);
          _V.add$(s.m5.steer,avoidance);
        }
        return s;
      },
      /**Check if there’s clear line of sight between two sprites.
       * memberof module:mojoh5/Sprites
       * @param {Sprite} s1
       * @param {Sprite} s2
       * @param {any[]} obstacles
       * @return {boolean}
       */
      lineOfSight(s1, s2, obstacles){
        let c1=Mojo.Sprites.centerXY(s1), c2=Mojo.Sprites.centerXY(s2);
        for(let b,rc,s,o,i=0;i<obstacles.length;++i){
          o=obstacles[i];
          rc=o.m5.circle? Geo.hitTestLineCircle(c1,c2, o.x, o.y, o.width/2)
                        : Geo.hitTestLinePolygon(c1,c2, Geo.bodyWrap(Mojo.Sprites.toPolygon(o),o.x,o.y));
          if(rc[0]) return false;
        }
        return true;
      },
      /**Create a projectile being fired out of a shooter.
       * @memberof module:mojoh5/Ute2D
       * @param {any} src
       * @param {number} angle
       * @param {number} speed
       * @param {function} ctor
       * @param {number} x
       * @param {number} y
       * @return {Sprite}
       */
      shoot(src, angle, speed, ctor,x,y){
        const b=ctor(), soff=Mojo.Sprites.topLeftOffsetXY(src);
        _V.add$(soff,[x,y]);
        _V.copy(b,_V.add(src,soff));
        _V.set(b.m5.vel, Math.cos(angle) * speed,
                         Math.sin(angle) * speed);
        return b;
      },
      /**Create a HealthBar widget.
       * @memberof module:mojoh5/Ute2D
       * @param {HealthBarConfig} cfg
       * @return {HealthBarObj}
       */
      healthBar(arg){
        let {scale:K,width,height, lives, borderWidth,line,fill}=arg;
        let c, padding=4*K, fit=4*K, out=[];
        borderWidth = (borderWidth||4)*K;
        lives= lives||3;
        fill=Mojo.Sprites.color(fill);
        line=Mojo.Sprites.color(line);
        for(let r,w=int(width/lives), i=0;i<lives;++i){
          out.push(Mojo.Sprites.rect(w,height-2*borderWidth,fill))
        }
        return{
          dec(){
            if(this.lives>0){
              this.lives -= 1;
              out[this.lives].visible=false;
            }
            return this.lives>0;
          },
          lives: out.length,
          sprite: Mojo.Scenes.layoutX(out,{bg:["#cccccc",0],
                                  borderWidth,
                                  border:line,padding,fit})
        }
      },
      //modified from original source: codepen.io/johan-tirholm/pen/PGYExJ
      /**Create a gauge like speedometer.
       * @memberof module:mojoh5/Ute2D
       * @param {GaugeUIConfig} cfg
       * @return {GaugeUIObj}
       */
      gaugeUI(arg){
        let
          {minDeg,maxDeg,line,gfx,scale:K,
           cx,cy,radius,alpha,fill,needle }= _.patch(arg,{minDeg:90,maxDeg:360});
        const segs= [0, R*45, R*90, R*135, R*180, R*225, R*270, R*315];
        function getPt(x, y, r,rad){ return [x + r * cos(rad), y + r * sin(rad) ] }
        function drawTig(x, y, rad, size){
          let
            [sx,sy] = getPt(x, y, radius - 4*K, rad),
            [ex,ey] = getPt(x, y, radius - 12*K, rad);
          Mojo.Sprites.gpath(gfx, [["moveTo",sx, sy],
                        ["lineTo",ex, ey], ["closePath"]]);
          Mojo.Sprites.gstroke(gfx,{color: line, width:size, cap:"round"});
        }
        function drawPtr(r,color, rad){
          let
            [px,py]= getPt(cx, cy, r - 20*K, rad),
            [p2x,p2y] = getPt(cx, cy, 2*K, rad+R*90),
            [p3x,p3y] = getPt(cx, cy, 2*K, rad-R*90);
          Mojo.Sprites.gpath(gfx, [["moveTo",p2x, p2y],
                         ["lineTo",px, py], ["lineTo",p3x, p3y], ["closePath"]]);
          Mojo.Sprites.gstroke(gfx,{cap:"round", width:4*K, color: needle});
          Mojo.Sprites.gcircle(gfx,cx,cy,9*K);
          Mojo.Sprites.gfill(gfx,{color:line});
          Mojo.Sprites.gstroke(gfx,{color:line});
        }
        needle=Mojo.Sprites.color(needle);
        line=Mojo.Sprites.color(line);
        fill=Mojo.Sprites.color(fill);
        radius *= K;
        return {
          gfx,
          draw(){
            Mojo.Sprites.gclear(gfx);
            Mojo.Sprites.gcircle(gfx,cx, cy, radius);
            Mojo.Sprites.gfill(gfx,{color:fill, alpha});
            Mojo.Sprites.gstroke(gfx,{width: radius/8,color:line});
            segs.forEach(s=> drawTig(cx, cy, s, 7*K));
            drawPtr(radius*K, fill, R* _M.lerp(minDeg, maxDeg, arg.update()));
          }
        }
      }
    };

    return (Mojo["Ute2D"]= _$);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //exports
  if(typeof module=="object" && module.exports){
    throw "Panic: browser only"
  }else{
    gscope["io/czlab/mojoh5/Ute2D"]=(M)=>{
      return M["Ute2D"] ? M["Ute2D"] : _module(M) } }

})(this);


