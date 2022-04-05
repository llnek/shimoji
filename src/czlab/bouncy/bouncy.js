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
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           Ute2D:_U,
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_,is}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const
      UI_FONT="Doki Lowercase",
      SplashCfg= {
        title:"Bouncy Balls",
        action: {name:"PlayGame"},
        clickSnd:"click.mp3",
      };

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onSelected(self){
      if(_G.selectedBall){
        //draw the rubberband between the mouse and the marble
        let c=_S.centerXY(_G.selectedBall);
        _S.show(_G.sling);
        _G.sling.m5.ptA(c[0],c[1]);
        _G.sling.m5.ptB(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _offSelected(self){
      if(Mojo.mouse.isUp){
        let K=Mojo.getScaleFactor();
        _S.hide(_G.sling);
        if(_G.selectedBall){
          let
            c=_S.centerXY(_G.selectedBall),
            mc=_V.sub(c, [Mojo.mouse.x-self.x,
                          Mojo.mouse.y-self.y]),
            len=_V.len(mc),
            u=_V.unit$(mc);
          _V.set(_G.selectedBall.m5.vel, len*u[0]*32*K,
                                         len*u[1]*32*K);
          _G.selectedBall = UNDEF;
        }
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _moveXY(self,m,dt){
      if(Mojo.mouse.isDown && !_G.selectedBall && Mojo.mouse.hitTest(m)){
        _V.set(m.m5.vel,0,0);
        _G.selectedBall = m;
      }
      _V.mul$(m.m5.vel,m.m5.friction);
      _S.move(m,dt);
      _S.clamp(m,_G.arena,true);
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _hitAll(s,objs){
      objs.forEach(o=>{
        if(o !== s)
          _S.collide(s, o)
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //use default spatial grid
    _Z.scene("PlayGame",{
      setup(){
        let
          self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let
              out={x:0,y:0},
              grid=_S.gridSQ(8,0.8,out),
              pbox=_S.gridBBox(0,0,grid),
              SIZES = [8, 12, 16, 20, 24, 28, 32, 64].map(x=> x*K);
            _V.copy(self,out);
            for(let rr,r,y=0;y<grid.length;++y){
              r=grid[y];
              for(let m,g,x=0;x<r.length;++x){
                g=r[x];
                m= _S.animation("balls.png", 166, 166);
                m.m5.showFrame(_.randInt2(0,5));
                m.m5.circle=true;
                _S.anchorXY(m,0.5);
                _V.set(m,_M.ndiv(g.x1+g.x2,2),
                         _M.ndiv(g.y1+g.y2,2));
                _S.sizeXY(m, rr=SIZES[_.randInt2(0, 7)],rr);
                _V.set(m.m5.vel, _.randInt2(-400, 400),
                                 _.randInt2(-400, 400));
                _V.set(m.m5.friction, 0.995,0.995);
                m.m5.mass = 0.75 + m.width/2/32;
                self.insert(m,true);
              }
            }
            if(1){
              let s= _S.bmpText("Grab a ball and pull!",UI_FONT,24*K);
              _S.anchorXY(s,0.5);
              _S.pinAbove(pbox,s,s.height);
              self.insert(s);
            }
            _G.selectedBall = UNDEF;
            _G.arena=Mojo.mockStage(out);
            _V.set(_G.arena,0,0);
            //make a line that will connect the mouse to the marbles
            _G.sling= _S.line("yellow",4*K, [0,0],[32,32]);
            self.insert(_S.hide(_G.sling));
            self.insert(_S.bboxFrame(pbox));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      postUpdate(dt){
        let
          self=this,
          K=Mojo.getScaleFactor();
        _onSelected(this);
        _offSelected(this);
        this.children.forEach(m=>{
          if(m.m5 && m.m5.circle){
            _moveXY(self,m,dt);
            this.m5.sgrid.engrid(m);
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circle)
            _hitAll(s, this.searchSGrid(s))
        });
      }
    },{centerStage:true});

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //use quadtree
    _Z.scene("QuadTree",{
      setup(){
        _init(this);
        _G.qtree=QT.quadtree({x1:0,y1:0,
                              x2:_G.arena.width,
                              y2:_G.arena.height});
      },
      postUpdate(dt){
        let
          self=this,
          K=Mojo.getScaleFactor();
        _onSelected(this);
        _offSelected(this);
        _G.qtree.reset();
        this.children.forEach(m=>{
          if(m.m5 && m.m5.circle){
            _moveXY(this,m,dt);
            _G.qtree.insert(m)
          }
        });
        this.children.forEach(s=>{
          if(s.m5 && s.m5.circle)
            _hitAll(s, _G.qtree.search(s))
        });
      }
    },{centerStage:true});

    _Z.run("Splash", SplashCfg);
  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["balls.png","click.mp3"],
    arena: {width:1344, height:840},
    scaleToWindow:"max",
    scaleFit:"y",
    start(...args){ scenes(...args) }

  }));

})(this);



