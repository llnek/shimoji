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

;(function(window,UNDEF){

  "use strict";

  function scenes(Mojo){
    const {Scenes:_Z,
           Sprites:_S,
           Ute2D:_U,
           Input:_I,
           Game:G,
           v2:_V,
           ute:_,is}=Mojo;

    const E_GEO=1;

    _Z.scene("level1",{
      setup(){
        let out={x:0,y:0};
        _S.gridXY([2,2],0.5,0.95,out);
        _V.copy(this,out);
        G.arena=Mojo.mockStage(out);

        //make a blue rect
        let blue = G.blue= _S.rect(48, 64, "blue");
        _S.centerAnchor(blue);
        _V.set(blue,100,100);
        blue.angle=42;
        blue.m5.tick=(dt)=>{
          _S.move(blue,dt)
        }
        this.insert(blue,true);
        //make a red square
        let red = G.red= _S.rect(64, 64, "red");
        _S.centerAnchor(red);
        _V.set(red,500,500);
        red.angle=76;
        red.m5.tick=(dt)=>{
          _S.move(red,dt)
        }
        this.insert(red,true);
        //make a green circle
        let green = G.green= _S.circle(32, "green");
        _S.centerAnchor(green);
        green.m5.tick=(dt)=>{
          _S.move(green,dt)
        };
        this.insert(green,true);

        //make a orange circle
        let orange = G.orange= _S.circle(48, "orange");
        _S.centerAnchor(orange);
        orange.m5.tick=(dt)=>{
          _S.move(orange,dt)
        };
        this.insert(orange,true);

        let K=Mojo.getScaleFactor();
        _V.set(red.m5.vel,150*K,150*K);
        _V.set(blue.m5.vel,-150*K,-150*K);
        _V.set(green.m5.vel,180*K,-180*K);
        _V.set(orange.m5.vel,-180*K, 180*K);

        G.objects=[red,blue,green,orange];
        G.objects.forEach(o=>{
          o.m5.type=E_GEO;
          o.m5.cmask=E_GEO;
        });

        _V.set(G.arena,0,0);

        let ctx=_S.drawGridBox({x1:G.arena.x,
          y1:G.arena.y,
          x2:G.arena.x+G.arena.width,
          y2:G.arena.y+G.arena.height});
        this.insert(ctx);
      },
      postUpdate(dt){
        G.blue.rotation += 0.05;
        G.red.rotation += 0.07;

        G.objects.forEach(o=>{
          this.searchSGrid(o).forEach(s=>{
            if(s!==o)
              _S.collide(o,s)
          })
        });

        G.objects.forEach(o=>_S.clamp(o,G.arena,true));
      }
    },{centerStage:true});

    Mojo.Scenes.run("level1");
  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: ["man_up.png","man_down.png","man_right.png", "man_left.png"],
      arena: {width:640, height:640},
      scaleToWindow:"max",
      start(Mojo){ scenes(Mojo) }

    })
  });

})(this);


