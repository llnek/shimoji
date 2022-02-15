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

    const _M=window["io/czlab/mcfud/math"]();
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    const int=Math.floor;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initLevel(){
            _G.offsetX = -Mojo.width / 2;
            _G.offsetY = -Mojo.height / 2;
            _G.scaleX=1;
            _G.scaleY=1;
            _G.selectedCellX=0;
            _G.selectedCellY=0;
            _G.startPanX = 0;
            _G.startPanY = 0;

            Mojo.on(["mousedown"],"onMouseDown",self);
            Mojo.on(["mouseup"],"onMouseUp",self);
            Mojo.on(["mousemove"],"onMouseMove",self);
            Mojo.on(["single.tap"],"onLeftClick",self);
            this.gfx=self.insert(_S.graphics());
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
      },
      dispose(){
        Mojo.off(["mousedown"],"onMouseDown",this);
        Mojo.off(["mouseup"],"onMouseUp",this);
        Mojo.off(["mousemove"],"onMouseMove",this);
        Mojo.off(["single.tap"],"onLeftClick",this);
      },
      onLeftClick(){
        // Draw selected cell
        // We can easily determine where the mouse is in world space. In fact we already
        // have this frame so just reuse the values
        _G.selectedCellX = int(_G.mouseWorldXAfterZoom);
        _G.selectedCellY = int(_G.mouseWorldYAfterZoom);
      },
      onMouseMove(){
        if(_G.mdown){
          // ...as the mouse moves, the screen location changes. Convert this screen
          // coordinate change into world coordinates to implement the pan. Simples.
          _G.offsetX -= (Mojo.mouse.x- _G.startPanX) / _G.scaleX;
          _G.offsetY -= (Mojo.mouse.y- _G.startPanY) / _G.scaleY;

          // Start "new" pan for next epoch
          _G.startPanX = Mojo.mouse.x;
          _G.startPanY = Mojo.mouse.y;
        }
      },
      onMouseUp(){
        _G.mdown=false;
      },
      onMouseDown(){
        // need to capture the screen pos when the user starts to pan...
        _G.startPanX = Mojo.mouse.x;
        _G.startPanY = Mojo.mouse.y;
        _G.mdown=true;
      },
      worldToScreen(fWorldX, fWorldY){
        return [int((fWorldX - _G.offsetX) * _G.scaleX),
                int((fWorldY - _G.offsetY) * _G.scaleY)]
      },
      screenToWorld(nScreenX, nScreenY){
        return [nScreenX / _G.scaleX + _G.offsetX,
                nScreenY / _G.scaleY + _G.offsetY]
      },
      doDrawLine(x1,y1,x2,y2,c){
        this.g.gfx.lineStyle(1, _S.color(c));
        this.g.gfx.moveTo(x1,y1);
        this.g.gfx.lineTo(x2,y2);
      },
      postUpdate(dt){
        this.g.gfx.clear();

        let fMouseX = Mojo.mouse.x,
            fMouseY = Mojo.mouse.y;

        // For zoom, we need to extract the location of the cursor before and after the
        // scale is changed. Here we get the cursor and translate into world space...
        let [fMouseWorldX_BeforeZoom, fMouseWorldY_BeforeZoom]= this.screenToWorld(fMouseX, fMouseY);
        if(_I.keyDown(_I.Q)){
          _G.scaleX *= 1.1;//1.001;
          _G.scaleY *= 1.1;//1.001;
        }
        if(_I.keyDown(_I.A)){
          _G.scaleX *=0.9;// 0.999;
          _G.scaleY *= 0.9;//0.999;
        }
        // ...now get the location of the cursor in world space again - It will have changed
        // because the scale has changed, but we can offset our world now to fix the zoom
        // location in screen space, because we know how much it changed laterally between
        // the two spatial scales. Neat huh? ;-)
        let [fMouseWorldX_AfterZoom, fMouseWorldY_AfterZoom]= this.screenToWorld(fMouseX, fMouseY);
        _G.offsetX += (fMouseWorldX_BeforeZoom - fMouseWorldX_AfterZoom);
        _G.offsetY += (fMouseWorldY_BeforeZoom - fMouseWorldY_AfterZoom);

        _G.mouseWorldXAfterZoom= fMouseWorldX_AfterZoom;
        _G.mouseWorldYAfterZoom= fMouseWorldY_AfterZoom;

        // Clip
        let [fWorldLeft, fWorldTop]=this.screenToWorld(0, 0);
        let [fWorldRight, fWorldBottom]=this.screenToWorld(Mojo.width,Mojo.height);
        function sine(x){ return Math.sin(x) }
        // Draw Main Axes a 10x10 Unit Grid
        // Draw 10 horizontal lines
        let nLinesDrawn = 0;
        for(let y = 0; y <= 10; ++y){
          if(y >= fWorldTop && y <= fWorldBottom){
            let sx = 0, sy = y;
            let ex = 10, ey = y;
            let [pixel_sx, pixel_sy]=this.worldToScreen(sx, sy);
            let [pixel_ex, pixel_ey]=this.worldToScreen(ex, ey);
            this.doDrawLine(pixel_sx, pixel_sy, pixel_ex, pixel_ey, "white");
            ++nLinesDrawn;
          }
        }
        // Draw 10 vertical lines
        for(let x = 0; x <= 10; ++x){
          if(x >= fWorldLeft && x <= fWorldRight){
            let sx = x, sy = 0;
            let ex = x, ey = 10;
            let [pixel_sx, pixel_sy]=this.worldToScreen(sx, sy);
            let [pixel_ex, pixel_ey]=this.worldToScreen(ex, ey);
            this.doDrawLine(pixel_sx, pixel_sy, pixel_ex, pixel_ey, "white");
            ++nLinesDrawn;
          }
        }
        // Draw selected cell by filling with red circle. Convert cell coords
        // into screen space, also scale the radius
        let [cx,cy]= this.worldToScreen(_G.selectedCellX + 0.5, _G.selectedCellY + 0.5);
        let cr = 0.3 * _G.scaleX;
        this.g.gfx.beginFill(_S.color("red"));
        this.g.gfx.drawCircle(cx, cy, cr);
        //DrawString(2, 2, L"Lines Drawn: " + to_wstring(nLinesDrawn));

        // Draw Chart
        let fWorldPerScreenWidthPixel = (fWorldRight - fWorldLeft) / Mojo.width;
        let fWorldPerScreenHeightPixel = (fWorldBottom - fWorldTop) / Mojo.height;
        let [opx, opy]=this.worldToScreen(fWorldLeft-fWorldPerScreenWidthPixel,
          -sine((fWorldLeft - fWorldPerScreenWidthPixel) - 5) + 5);
        for(let x = fWorldLeft; x < fWorldRight; x+=fWorldPerScreenWidthPixel){
          let y = -sine(x - 5) + 5;
          let [px,py]= this.worldToScreen(x, y);
          this.doDrawLine(opx, opy, px, py, "green");
          opx = px;
          opy = py;
        }
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


