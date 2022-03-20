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
           Arcade:_2d,
           FX:_F,
           v2:_V,
           math:_M,
           Game:_G,
           ute:_,is}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob",
      UI_FONT="Doki Lowercase",
      C_TITLE=_S.color("#e4ea1c"),
      C_BG=_S.color("#169706"),
      C_TEXT=_S.color("#fff20f"),
      C_GREEN=_S.color("#7da633"),
      C_ORANGE=_S.color("#f4d52b");


    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const doBackDrop=(s)=> s.insert( _S.fillMax(_S.sprite("bg.png")));
    const playClick=()=> Mojo.sound("click.mp3").play();
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _onCaptured(self){
      if(_G.capturedMarble){
        //draw the sling between the mouse and the captured marble
        let c=_S.centerXY(_G.capturedMarble);
        _S.show(_G.sling);
        _G.sling.m5.ptA(c[0],c[1]);
        _G.sling.m5.ptB(Mojo.mouse.x-self.x,Mojo.mouse.y-self.y);
      }
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //Shoot the marble when mouse is released
    function _offCaptured(self){
      if(Mojo.mouse.isUp){
        let s=_G.sling,
            K=Mojo.getScaleFactor();
        _S.hide(s);
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function _hitCircles(s,objs){
      objs.forEach(o=>{
        if(o !== s)
          _S.collide(s, o)
      })
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //use default spatial grid
    _Z.scene("Splash",{
      setup(){
        const self=this,
          K=Mojo.getScaleFactor();
        _.inject(this.g,{
          initLevel(){
            let SIZES = [8, 12, 16, 20, 24, 28, 32,64].map(x=> x*K);
            let out={x:0,y:0};
            let grid=_S.gridSQ(8,0.8,out);
            let pbox=_S.gridBBox(0,0,grid);
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
                _V.set(m.m5.friction, 0.99,0.99);
                m.m5.mass = 0.75 + m.width/2/32;
                self.insert(m,true);
              }
            }
            _G.capturedMarble = null;
            _G.arena=Mojo.mockStage(out);
            _V.set(_G.arena,0,0);
            //make a line that will connect the mouse to the marbles
            _G.sling= _S.line("Yellow",4*K, [0,0],[32,32]);
            _S.hide(_G.sling);
            self.insert(_G.sling);
            //self.insert(_S.drawGridBox(pbox));
            self.insert(_S.bboxFrame(pbox));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel();
      },
      postUpdate(dt){
        let self=this,
          K=Mojo.getScaleFactor();
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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //use quadtree
    _Z.scene("quadtree",{
      setup(){
        _init(this);
        _G.qtree=QT.quadtree({x1:0,y1:0,
                              x2:_G.arena.width,
                              y2:_G.arena.height});
      },
      postUpdate(dt){
        let self=this,
          K=Mojo.getScaleFactor();
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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5({

    assetFiles: ["balls.png","click.mp3"],
    arena: {width:1860, height:1050},
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.run("Splash");
    }
  }));

})(this);



