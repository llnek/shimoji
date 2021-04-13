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

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           Tiles:_T,
           Game:_G,
           ute:_,is,EventBus}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();
    const _V=window["io/czlab/mcfud/vec2"]();
    const MFL=Math.floor;

    function _init(self){
      let K=Mojo.getScaleFactor();
      let SIZES = [8, 12, 16, 20, 24, 28, 32].map(x=> x*K);
      let out={x:0,y:0};
      let grid=_S.gridSQ(5,0.8,out);
      let pbox=_S.gridBBox(0,0,grid);
      _S.setXY(self,out.x,out.y);
      for(let rr,r,y=0;y<grid.length;++y){
        r=grid[y];
        for(let m,g,x=0;x<r.length;++x){
          g=r[x];
          m= _S.animation("marbles.png", 32, 32);
          m.m5.showFrame(_.randInt2(0,5));
          m.m5.circular=true;
          _S.centerAnchor(m);
          _S.setXY(m,MFL((g.x1+g.x2)/2),
                     MFL((g.y1+g.y2)/2));
          _S.sizeXY(m, rr=SIZES[_.randInt2(0, 6)],rr);
          _S.velXY(m, _.randInt2(-400, 400),
                      _.randInt2(-400, 400));
          _S.frictionXY(m, 0.99,0.99);
          m.m5.mass = 0.75 + m.width/2/32;
          self.insert(m,true);
        }
      }
      _G.capturedMarble = null;
      _G.arena=Mojo.mockStage(out);
      _G.arena.x=0;
      _G.arena.y=0;
      //Create the "sling", a line that will connect the mouse to the marbles
      _G.sling= _S.line("Yellow",4*K, [0,0],[32,32]);
      _G.sling.visible = false;
      self.insert(_G.sling);
      self.insert(_S.drawGridBox(pbox));
    }

    function _onCaptured(self){
      if(_G.capturedMarble){
        //draw the sling between the mouse and the captured marble
        let c=_S.centerXY(_G.capturedMarble);
        _G.sling.visible = true;
        _G.sling.m5.ptA(c[0],c[1]);
        _G.sling.m5.ptB(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
      }
    }

    //Shoot the marble when mouse is released
    function _offCaptured(self){
      if(Mojo.mouse.isUp){
        let s=_G.sling,
            K=Mojo.getScaleFactor();
        s.visible = false;
        if(_G.capturedMarble){
          let c=_S.centerXY(_G.capturedMarble),
              m=_V.vec(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
          let mc=_V.sub(c,m),
              u=_V.unit(mc),
              len=_V.len(mc);
          _S.velXY(_G.capturedMarble, len*u[0]*32*K,
                                      len*u[1]*32*K);
          _G.capturedMarble = null;
        }
      }
    }

    function _moveCircle(self,m,dt){
      if(Mojo.mouse.isDown && !_G.capturedMarble){
        if(Mojo.mouse.hitTest(m)){
          _S.velXY(m,0,0);
          _G.capturedMarble = m;
        }
      }
      m.m5.vel[0] *= m.m5.friction[0];
      m.m5.vel[1] *= m.m5.friction[1];
      _S.move(m,dt);
      _2d.contain(m,_G.arena,true);
    }

    function _hitCircles(s,objs){
      objs.forEach(o=>{
        if(o !== s)
          _2d.collide(s, o)
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
          if(m.m5 && m.m5.circular){
            _moveCircle(self,m,dt);
            this.m5.sgrid.engrid(m);
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circular)
            _hitCircles(s, this.searchSGrid(s))
        });
      }
    },{centerStage:true});

    //use quadtree
    _Z.defScene("quadtree",{
      setup(){
        _init(this);
        _G.qtree=QT.quadtree({left:0,top:0,right:_G.arena.width,bottom:_G.arena.height});
      },
      postUpdate(dt){
        let K=Mojo.getScaleFactor();
        let self=this;
        _onCaptured(this);
        _offCaptured(this);
        _G.qtree.reset();
        this.children.forEach(m=>{
          if(m.m5 && m.m5.circular){
            _moveCircle(this,m,dt);
            _G.qtree.insert(m)
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circular)
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
        //Mojo.Scenes.runScene("quadtree");
        Mojo.Scenes.runScene("spatial");
      }
    })
  });

})(this);



