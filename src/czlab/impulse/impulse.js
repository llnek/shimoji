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
 * Copyright © 2013-2022, Kenneth Leung. All rights reserved. */

;(function(window,UNDEF){

  "use strict";

  function scenes(Mojo){

    const IE=window["io/czlab/impulse_engine/core"]();
    const _2d=window["io/czlab/mcfud/geo2d"]();
    const {Mat2}=IE;
    const MFL=Math.floor;
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Game:_G,
           math:_M,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.scene("level1", {
      _initLevel(){
        let g= _S.gridXY([2,2],0.5,0.9);
        let K=Mojo.getScaleFactor();
        let gf=g[0][0];
        let gl=g[1][1];
        let w= gl.x2-gf.x1;
        let h= gl.y2-gf.y1;
        let w2=w/2;
        let w4=w/4;
        let h2=h/2;
        let h4=h/4;
        let h8=h/8;
        let d= Math.sqrt(w2*w2+h8*h8);
        let a={x1:gf.x1,y1:gf.y1,x2:gl.x2,y2:gl.y2};
        _G.rect=new _2d.Rect(gf.x1,gf.y1,w,h);
        _G.arena=a;
        _G.btn=0;
        _G.world= new IE.World(1/Mojo.u.fps,Mojo.u.iterations);
        let p1=_G.world.add(new IE.Polygon().setBox(d/2,10*K),a.x1+w4,a.y2-h8);
        let p2=_G.world.add(new IE.Polygon().setBox(d/2,10*K),a.x2-w4,a.y2-h2);
        p1.setOrient(-2.8).setStatic();
        p2.setOrient(2.7).setStatic();
        p1.rgb="blue";
        p2.rgb="blue";
      },
      onClick(){
        let K=Mojo.getScaleFactor();
        let b;
        if(++_G.btn%2){
          let e= _.randInt2(30*K, 60*K);
          let z= _.randInt2(3,12);
          let vs=[];
          let p= new IE.Polygon();
          for(let i=0;i<z;++i)
            vs.push([_.randInt2(-e, e),_.randInt2(-e,e)]);
          p.set(vs);
          b=_G.world.add(p, Mojo.mouse.x, Mojo.mouse.y);
          b.rgb="yellow";
          b.setOrient(_.randFloat2(-Math.PI,Math.PI));
        }else{
          b=new IE.Circle(4*K+_.randInt(20*K));
          b.rgb="red";
          _G.world.add(b, Mojo.mouse.x,Mojo.mouse.y);
        }
        b.staticFriction = 0.4;
        b.dynamicFriction = 0.2;
        b.restitution = 1;//0.2;
      },
      setup(){
        let g= this.g.gfx=_S.graphics();
        this.insert(g);
        this._initLevel();
        _I.on(["mouseup"],"onClick",this);
      },
      _drawPolygon(ctx,b,K){
        ctx.lineStyle(1*K,_S.color(b.rgb));
        let ps=b.shape._calcPoints().map(p=>new PIXI.Point(p[0],p[1]));
        ctx.drawPolygon(ps);
      },
      _drawCircle(ctx,b,K){
        ctx.lineStyle(1,_S.color(b.rgb));
        ctx.drawCircle(b.position[0], b.position[1],b.shape.radius);
        let r=Mat2.mul(b.shape.u,_V.vec(1,0));
        r=_V.mul(r,b.shape.radius);
        r= _V.add(r, b.position);
        ctx.lineStyle(1,_S.color("green"));
        ctx.moveTo(b.position[0],b.position[1]);
        ctx.lineTo(r[0],r[1]);
      },
      postUpdate(dt){
        let w= _G.world,
            g=this.g.gfx,
            K=Mojo.getScaleFactor();
        g.clear();
        _S.drawGridBox(_G.arena,1,"green",g);
        w.bodies.forEach(b=>{
          if(b.shape.isCircular())
            this._drawCircle(g,b,K);
          else
            this._drawPolygon(g,b,K);
        });
        w.step();
        for(let b,i=0;i<w.bodies.length;++i){
          b=w.bodies[i];
          if(!_2d.rectContainsPoint(_G.rect,b.position[0],b.position[1]))
            if(!_2d.rectContainsRect(_G.rect,b.shape.getAABB())){
              w.bodies.splice(i,1);
              --i;
            }
        }
        /*
        if(w.bodies.length===1 && !_G.root){
          let b= w.bodies[0];
          _G.rootOrient=b.orient;
          _G.root=b;
          _G.root.setOrient(0);
        }
        if(w.bodies.length>1 && _G.root){
          _G.root.setOrient(_G.rootOrient);
          _G.root=null;
        }
        */
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5({

    arena: {width: 800, height: 640},
    scaleToWindow: "max",
    scaleFit:"y",
    iterations:10,
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("level1");
    }
  }));

})(this);


