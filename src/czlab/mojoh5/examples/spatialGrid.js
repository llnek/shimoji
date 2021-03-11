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
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"],_T=Mojo.Tiles;
    const _G=Mojo.Game;
    const MFL=Math.floor;
    const {ute:_,is,EventBus}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();

    function _init(self){
      let K=Mojo.contentScaleFactor();
      let SIZES = [8, 12, 16, 20, 24, 28, 32].map(x=> x*K.height);
      let grid=_S.gridSQ(5,0.8,self);
      let pbox=_S.gridBBox(0,0,grid);
      for(let r,y=0;y<grid.length;++y){
        r=grid[y];
        for(let m,g,x=0;x<r.length;++x){
          g=r[x];
          m= _S.animation("marbles.png", 32, 32);
          m.m5.showFrame(_.randInt2(0,5));
          m.m5.circular=true;
          m.anchor.set(0.5);
          m.x=MFL((g.x1+g.x2)/2);
          m.y=MFL((g.y1+g.y2)/2);
          _S.setSize(m, SIZES[_.randInt2(0, 6)]);
          m.m5.vel[0] = _.randInt2(-400, 400);
          m.m5.vel[1] = _.randInt2(-400, 400);
          m.m5.friction[0] = 0.99;
          m.m5.friction[1] = 0.99;
          m.m5.mass = 0.75 + m.width/2/32;
          self.insert(m);
        }
      }
      _G.capturedMarble = null;
      _G.arena=Mojo.mockStage(self.x,self.y,pbox.x2-pbox.x1,pbox.y2-pbox.y1);
      //Create the "sling", a line that will connect the mouse to the marbles
      _G.sling= _S.line("Yellow",4*K.height, [0,0],[32,32]);
      _G.sling.visible = false;
      self.addChild(_G.sling);
      self.addChild(_S.drawGridBox(pbox));
      EventBus.sub(["post.update",self],"postUpdate");
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
    function _offCaptured(self){
      if(Mojo.mouse.isUp){
        let K=Mojo.contentScaleFactor();
        //Shoot the marble when the pointer is released
        _G.sling.visible = false;
        if(_G.capturedMarble){
          _G.sling.m5.length = _S.distance(_G.capturedMarble, Mojo.mouse);
          //Get the angle between the center of the marble and the pointer
          _G.sling.angle = _S.angle(Mojo.mouse, _G.capturedMarble);
          //Shoot the marble away from the pointer with a velocity
          //proportional to the sling's length
          _G.capturedMarble.m5.vel[0] = K.height*64 * Math.cos(_G.sling.angle) * _G.sling.m5.length / 5;
          _G.capturedMarble.m5.vel[1] = K.height*64 * Math.sin(_G.sling.angle) * _G.sling.m5.length / 5;
          _G.capturedMarble = null;
        }
      }
    }

    function _moveCircle(self,m,dt){
      if(m.m5 && m.m5.circular){
        if(Mojo.mouse.isDown && !_G.capturedMarble){
          if(Mojo.mouse.hitTest(m)){
            m.m5.vel[0] = 0;
            m.m5.vel[1] = 0;
            _G.capturedMarble = m;
          }
        }
        m.m5.vel[0] *= m.m5.friction[0];
        m.m5.vel[1] *= m.m5.friction[1];
        _S.move(m,dt);
        _2d.contain(m,_G.arena,true);
      }
    }

    function _hitCircles(s,objs){
      objs.forEach(o=>{
        if(o !== s){
          _2d.collide(s, o);
          //_2d.contain(s, _G.arena,true);
          //_2d.contain(o, _G.arena,true);
        }
      })
    }

    //use default spatial grid
    _Z.defScene("spatial",{
      setup(){
        _init(this);
      },
      postUpdate(dt){
        let K=Mojo.contentScaleFactor();
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
            _hitCircles(s, this.m5.sgrid.search(s))
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
        let K=Mojo.contentScaleFactor();
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



