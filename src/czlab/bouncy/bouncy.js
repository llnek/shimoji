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
  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Input:_I,
           "2d":_2d,
           FX:_F,
           v2:_V,
           Game:_G,
           ute:_,is}=Mojo;
    const QT= window["io/czlab/mcfud/qtree"]();
    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const CLICK_DELAY=343;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function playClick(){ Mojo.sound("click.mp3").play() }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function doBackDrop(scene){return 1;
      if(!_G.backDropSprite)
        _G.backDropSprite=_S.fillMax(_S.sprite("bg.png"));
      return scene.insert(_S.opacity(_G.backDropSprite,0.148));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        let self=this,
            W2=Mojo.width/2,
            K=Mojo.getScaleFactor(),
            verb=Mojo.touchDevice?"Tap":"Click";
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doTitle=(s)=>{
          s=_S.bmpText("Bouncy Balls",{fontName:TITLE_FONT,fontSize:120*K});
          _S.tint(s,C_TITLE);
          _V.set(s,W2,Mojo.height*0.3);
          return self.insert(_S.centerAnchor(s));
        }
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.doNext=(s,t)=>{
          s=_S.bmpText(`${verb} to PLAY!`,{fontName:UI_FONT,fontSize:64*K});
          t=_F.throb(s,0.747,0.747);
          function cb(){
            Mojo.off(["single.tap"],cb);
            _F.remove(t);
            _S.tint(s,C_ORANGE);
            playClick();
            _.delay(CLICK_DELAY,()=> _Z.runSceneEx("PlayGame"));
          }
          Mojo.on(["single.tap"],cb);
          _V.set(s,W2,Mojo.height*0.7);
          return self.insert(_S.centerAnchor(s));
        }
        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.doTitle() && this.g.doNext();
      }
    });




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

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    //use default spatial grid
    _Z.defScene("PlayGame",{
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
                _S.centerAnchor(m);
                _V.set(m,int((g.x1+g.x2)/2),
                         int((g.y1+g.y2)/2));
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
            //Create the "sling", a line that will connect the mouse to the marbles
            _G.sling= _S.line("Yellow",4*K, [0,0],[32,32]);
            _G.sling.visible = false;
            self.insert(_G.sling);
            self.insert(_S.drawGridBox(pbox));
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        doBackDrop(this) && this.g.initLevel();
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
        _G.qtree=QT.quadtree({left:0,top:0,
                              right:_G.arena.width,
                              bottom:_G.arena.height});
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

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    assetFiles: ["balls.png","click.mp3"],
    arena: {width:1860, height:1050},
    scaleToWindow:"max",
    start(Mojo){
      scenes(Mojo);
      Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load & run
  window.addEventListener("load",()=> MojoH5(_$) );

})(this);



