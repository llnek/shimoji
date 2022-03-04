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

;(function(window){
  "use strict";

  function scenes(Mojo){
    const _M=window["io/czlab/mcfud/math"]();
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Tiles:_T,
           v2:_V,
           Game:_G,
           ute:_,is}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();
    const MFL=Math.floor;

    function _init(self){
      let K=Mojo.getScaleFactor();
      let SIZES = [8, 12, 16, 20, 24, 28, 32].map(x=> x*K);
      let out={x:0,y:0};
      let grid=_S.gridSQ(5,0.8,out);
      let pbox=_S.gridBBox(0,0,grid);
      _V.copy(self,out);
      for(let rr,r,y=0;y<grid.length;++y){
        r=grid[y];
        for(let m,g,x=0;x<r.length;++x){
          g=r[x];
          m= _S.animation("marbles.png", 32, 32);
          m.m5.showFrame(_.randInt2(0,5));
          m.m5.circle=true;
          _S.centerAnchor(m);
          _V.set(m,_M.ndiv(g.x1+g.x2,2),
                   _M.ndiv(g.y1+g.y2,2));
          _S.sizeXY(m, rr=SIZES[_.randInt2(0, 6)],rr);
          _V.set(m.m5.vel, _.randInt2(-400, 400),
                           _.randInt2(-400, 400));
          _V.set(m.m5.friction, 0.99,0.99);
          m.m5.mass = 0.75 + m.width/2/32;
          self.insert(m,true);
        }
      }
      _G.capturedMarble = null;
      _G.arena=Mojo.mockStage(out);
      _V.set(_G.arena,0,0);
      //Create the "rubber-band", a line that will connect the mouse to the marbles
      _G.rubber= _S.line("yellow",4*K, [0,0],[32,32]);
      _G.rubber.visible = false;
      self.insert(_G.rubber);
      self.insert(_S.drawGridBox(pbox));
    }

    function _onCaptured(self){
      if(_G.capturedMarble){
        //draw the rubber-band between the mouse and the captured marble
        let c=_S.centerXY(_G.capturedMarble);
        _G.rubber.visible = true;
        _G.rubber.m5.ptA(c[0],c[1]);
        _G.rubber.m5.ptB(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
      }
    }

    //Shoot the marble when mouse is released
    function _offCaptured(self){
      if(Mojo.mouse.isUp){
        let s=_G.rubber,
            K=Mojo.getScaleFactor();
        s.visible = false;
        if(_G.capturedMarble){
          let c=_S.centerXY(_G.capturedMarble),
              m=_V.vec(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
          let mc=_V.sub(c,m),
              u=_V.unit(mc),
              len=_V.len(mc);
          _V.set(_G.capturedMarble.m5.vel, len*u[0]*32*K,
                                           len*u[1]*32*K);
          _G.capturedMarble = null;
        }
      }
    }

    function _moveCircle(self,m,dt){
      if(Mojo.mouse.isDown && !_G.capturedMarble){
        if(Mojo.mouse.hitTest(m)){
          _V.set(m.m5.vel,0,0);
          _G.capturedMarble = m;
        }
      }
      _V.mul$(m.m5.vel,m.m5.friction);
      _S.move(m,dt);
      _S.clamp(m,_G.arena,true);
    }

    function _hitCircles(s,objs){
      objs.forEach(o=>{
        if(o !== s)
          _S.collide(s, o)
      })
    }

    //use default spatial grid
    _Z.defScene("spatial",{
      setup(){
        _init(this);
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();
        let self=this;
        _onCaptured(this);
        _offCaptured(this);
        this.children.forEach(m=>{
          if(m.m5 && m.m5.circle){
            _moveCircle(self,m,dt);
            this.m5.sgrid.engrid(m);
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circle)
            _hitCircles(s, this.searchSGrid(s))
        });
      }
    },{centerStage:true});

    //use quadtree
    _Z.defScene("quadtree",{
      setup(){
        _init(this);
        _G.qtree=QT.quadtree({x1:0,y1:0,
                              x2:_G.arena.width,
                              y2:_G.arena.height});
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();
        let self=this;
        _onCaptured(this);
        _offCaptured(this);
        _G.qtree.reset();
        this.children.forEach(m=>{
          if(m.m5 && m.m5.circle){
            _moveCircle(this,m,dt);
            _G.qtree.insert(m)
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circle)
            _hitCircles(s, _G.qtree.search(s))
        });
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["marbles.png"],
      arena: {width:512, height:512},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("quadtree");
        //Mojo.Scenes.runScene("spatial");
      }
    })
  });

})(this);



