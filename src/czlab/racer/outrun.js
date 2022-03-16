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
  //original source: https://www.youtube.com/watch?v=N60lBZDEwJ8&ab_channel=FamTrinli
  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const {Sprites:_S,
           Scenes:_Z,
           FX:T,
           Input:_I,
           Game:_G,
           Arcade:_2d,
           math:_M,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const int=Math.floor, ceil=Math.ceil;
    const sin=Math.sin, cos=Math.cos;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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
        this.X = (1 + this.scale*(this.x - camX)) * Mojo.width/2;
        this.Y = (1 - this.scale*(this.y - camY)) * Mojo.height/2;
        this.W = this.scale * _G.roadW  * Mojo.width/2;
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
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("level1",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          gfx: _S.graphics(),
          findSection(){
            let t=0;
            while(t<_G.segN && _G.lines[t].z <= _G.pos){ ++t }
            _G.trackSection=t;
            _G.targetBend = _G.lines[t-1].curve;
          },
          initLevel(){
            _.inject(_G,{
              trackCurvature:0,
              trackSection:0,
              curvature:0,
              targetBend:0,
              camD:0.84, //camera depth
              lines:[],
              segL:200,
              posDiff:0,
              pos:0,
              playerX:0,
              speed:0,
              maxSpeed:15000,
              playerArc:0,
              HH:1500,
              segN:2000,
              roadL:0,
              roadW:2000,
              playerCurvature:0,
              player: _S.sprite("red_car.png")
            });
            _G.roadL= _G.segN * _G.segL;
            for(let n, i=0,z=_G.segN; i<z; ++i){
              _G.lines.push(n=new Line());
              //n.ct=_G.segL;
              n.z= i*_G.segL;
              if(i>300&&i<700) n.curve= 0.5;
              if(i>750 && i< 1400) n.y=sin(i/30)* _G.HH;
              if(i>1450) n.curve = -0.5;
            }
            return this;
          },
          draw(dt){
             let dts= dt*_G.speed;
            _G.curvature += (_G.targetBend - _G.curvature) * dts;
            _G.trackCurvature += _G.curvature * dts;
            //////
            let sp=int(_G.pos/_G.segL);
            let camH= _G.lines[sp].y;
            let l, maxY=Mojo.height;
            let x=0,dx=0;
            camH += _G.HH;
            this.gfx.clear();
            for(let n=sp;n<sp+300;++n){
              l=_G.lines[n % _G.segN];
              l.project(_G.playerX-x,camH,_G.pos- (n>=_G.segN?_G.roadL:0));
              x+=dx;
              dx+= l.curve;
              if(l.Y>=maxY){continue}
              maxY=l.Y;
              let grass  = (n/3)%2? _S.color3(16,200,16): _S.color3(0,154,0);
              let rumble = (n/3)%2? _S.color3(255,255,255): _S.color3(0,0,0);
              let road   = (n/3)%2? _S.color3(107,107,107): _S.color3(105,105,105);
              let p = _G.lines[(n-1)% _G.segN]; //previous line
              if(p){
                this.drawQuad(grass, 0, p.Y, Mojo.width, 0, l.Y, Mojo.width);
                this.drawQuad(rumble,p.X, p.Y, p.W*1.2, l.X, l.Y, l.W*1.2);
                this.drawQuad(road,  p.X, p.Y, p.W, l.X, l.Y, l.W);
              }
            }
            this.drawCar();
          },
          drawQuad(c, x1,y1,w1,x2,y2,w2){
            this.gfx.beginFill(c);
            this.gfx.drawPolygon(
              {x:x1-w1,y:y1},
              {x:x2-w2,y:y2},
              {x:x2+w2,y:y2},
              {x:x1+w1,y:y1});
            this.gfx.endFill();
          },
          drawCar(){
            _G.player.angle= _G.playerArc;
            _G.playerX = _G.playerCurvature - _G.trackCurvature;
            return _V.set(_G.player, Mojo.width/2 + ((Mojo.width * _G.playerX) * 0.5), Mojo.height);
          }
        });
        this.g.initLevel();
        this.insert(this.g.gfx);
        self.insert(_S.centerAnchor(_S.scaleBy(_G.player,K*1.4,K*1.4)));
        this.g.draw(0);
      },
      postUpdate(dt){
        _G.speed += dt * (_I.keyDown(_I.SPACE)?4:-2);
        //if(_I.keyDown(_I.RIGHT)) _G.playerX+=200;
        //if(_I.keyDown(_I.LEFT)) _G.playerX-=200;
        //if(_I.keyDown(_I.UP)) _G.pos+=200;
        //if(_I.keyDown(_I.DOWN)) _G.pos-=200;
        _G.playerArc= 0;
        let b=0,dv= 0.7*dt*(1-_G.speed/2);
        if(_I.keyDown(_I.LEFT)){ b=-1 }
        if(_I.keyDown(_I.RIGHT)){ b=1 }
        if(b != 0){
          _G.playerArc= b*30;
          _G.playerCurvature += b*dv;
        }
        _G.speed= _M.clamp(0,1,_G.speed);
        _G.posDiff += (_G.maxSpeed * _G.speed) * dt;

        if(_G.posDiff>=_G.segL){
          _G.pos+=_G.segL;
          _G.posDiff= Math.max(0,_G.posDiff - _G.segL);
        }

        while(_G.pos>= _G.roadL) _G.pos-=_G.roadL;
        while(_G.pos<0) _G.pos+= _G.roadL;

        this.g.findSection();
        this.g.draw(dt);
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    //fps:30,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }
  }));

})(this);

