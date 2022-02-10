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
 * Copyright © 2020-2021, Kenneth Leung. All rights reserved. */

;(function(window){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  const int=Math.floor;
  const sin=Math.sin;
  const cos=Math.cos;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){

    const geo=window["io/czlab/mcfud/geo2d"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const HALF_PI = Math.PI/2,
          QUAD_PI = Math.PI/4,
          PI2  = Math.PI*2,
          PI3_4=Math.PI+QUAD_PI;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function mkSensors(s){
      let c=[s.x,s.y];
      return [s.rotation - HALF_PI,
              s.rotation - QUAD_PI,
              s.rotation,
              s.rotation + QUAD_PI,
              s.rotation + HALF_PI].map((a,i)=>{
                return [c,_V.add(c, _V.mul([Math.cos(a),Math.sin(a)],s.g.diag))]
              });
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        let ticks=0,
            radius,gfx,trail=[];
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          testSensors(s){
            for(let res,w,ss=mkSensors(s),i=0;i<ss.length;++i){
              w=ss[i];
              res=null;
              if(1)
              for(let p,j=0;j<_G.blocks.length;++j){
                p=_S.toPolygon(_G.blocks[j]);
                res= geo.hitTestLinePolygon(w[0],w[1],p);
                if(res[0]){
                  break;
                }else{ res=null }
              }
              if(res && res[0]){
                _.assert(0<= res[1]&&res[1]<=1,"bad sensor result");
                if(res[1]< s.g.diagRatio){
                  return true;
                }
              }
            }
          },
          env(){
            let bottom= _S.centerAnchor(_S.rect(800,100));
            _S.scaleXY(bottom,K,K);
            bottom.x=Mojo.width/2;
            bottom.y=Mojo.height;
            self.insert(bottom);
            let top= _S.centerAnchor(_S.rect(800,100));
            _S.scaleXY(top,K,K);
            top.x=Mojo.width/2;
            top.y=0;
            self.insert(top);
            let left= _S.centerAnchor(_S.rect(100,600));
            _S.scaleXY(left,K,K);
            left.x=0;
            left.y=Mojo.height/2;
            self.insert(left);
            let right= _S.centerAnchor(_S.rect(100,600));
            _S.scaleXY(right,K,K);
            right.x=Mojo.width;
            right.y=Mojo.height/2;
            self.insert(right);

            let c= _S.centerAnchor(_S.rect(800,100));
            _S.scaleXY(c,K,K);
            c.x=Mojo.width/2;
            c.y=Mojo.height/2;
            self.insert(c);

            let cl= _S.centerAnchor(_S.rect(80,300));
            _S.scaleXY(cl,K,K);
            _S.pinLeft(c,cl,-20);
            self.insert(cl);

            let cr= _S.centerAnchor(_S.rect(80,300));
            _S.scaleXY(cr,K,K);
            _S.pinRight(c,cr,-20);
            self.insert(cr);

            _G.blocks=[left,right,top,bottom,c,cl,cr];
          },
          initLevel(){
            gfx=self.insert(_S.graphics());
          },
          initRoomba(px,py){
            let s= _S.sprite("roomba.png");
            _S.centerAnchor(s);
            _S.scaleXY(s, 0.2*K,0.2*K);
            radius=s.width/2;
            let d= radius;//Math.sqrt(s.width/2*s.width/2+s.height/2*s.height/2);
            s.g.diag= d * 1.2;
            s.g.diagRatio= d/s.g.diag;
            s.m5.circle=true;
            s.m5.speed=25;
            s.g.lookAt = [Math.cos(s.rotation), Math.sin(s.rotation)];
            s.m5.tick=(dt)=>{
              s.g.lookAt[0] = Math.cos(s.rotation);
              s.g.lookAt[1] = Math.sin(s.rotation);
              s.x += s.g.lookAt[0] * s.m5.speed * dt;
              s.y += s.g.lookAt[1] * s.m5.speed * dt;
              if(++ticks % 20 == 0){ trail.push([s.x,s.y]) }
            };
            if(s.rotation>=0 && s.rotation< QUAD_PI){
            }
            if(s.rotation>=QUAD_PI && s.rotation < Math.PI){
            }
            if(s.rotation>=Math.PI && s.rotation < Math.PI*1.5){
            }
            if(s.rotation>=Math.PI && s.rotation < Math.PI*1.5){
            }


            s.rotation= _.rand()*Math.PI*_.randSign();
            this.player= self.insert(_V.set(s,px,py));
          },
          drawTrail(){
            if(ticks % 40 != 0){return}
            gfx.clear();
            trail.forEach(p=>{
              gfx.beginFill(_S.color("#cccccc"));
              gfx.drawCircle(p[0],p[1],radius);
            })
          },
          chkHits(){
            _S.clamp(this.player,self);
            if(this.testSensors(this.player)){
              this.player.rotation += _.randSign()* _.rand()* QUAD_PI;
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.g.env();
        function cb(){
          Mojo.off(["single.tap"],cb);
          self.g.initRoomba(Mojo.mouse.x,Mojo.mouse.y);
        }
        Mojo.on(["single.tap"],cb);
      },
      postUpdate(dt){
        if(!this.g.player){return}
        this.g.chkHits();
        this.g.drawTrail();
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["roomba.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


