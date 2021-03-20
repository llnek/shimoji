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
           "2d":_2d,
           Input:_I,
           Game:G,
           ute:_,is,EventBus}=Mojo;

    const E_GEO=1;

    _Z.defScene("level1",{
      setup(){
        let out={x:0,y:0};
        _S.gridXY([1,1],0.5,0.95,out);
        _S.setXY(this,out.x,out.y);
        G.arena=Mojo.mockStage(out);

        //make a blue rect
        let blue = G.blue= _S.rectangle(48, 64, "blue");
        _S.centerAnchor(blue);
        _S.setXY(blue,100,100);
        blue.angle=42;
        blue.m5.tick=(dt)=>{
          _S.move(blue,dt)
        }
        this.insert(blue,true);
        //make a red square
        let red = G.red= _S.rectangle(64, 64, "red");
        _S.centerAnchor(red);
        _S.setXY(red,500,500);
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
        _S.velXY(red,150*K,150*K);
        _S.velXY(blue,-150*K,-150*K);
        _S.velXY(green,180*K,-180*K);
        _S.velXY(orange,-180*K, 180*K);

        G.objects=[red,blue,green,orange];
        G.objects.forEach(o=>{
          o.m5.type=E_GEO;
          o.m5.cmask=E_GEO;
        });

        _S.setXY(G.arena,0,0);

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
              _2d.collide(o,s)
          })
        });

        G.objects.forEach(o=>_2d.contain(o,G.arena,true));
      }
    },{centerStage:true});
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:640, height:640},
      scaleToWindow:"max",
      start(Mojo){
        scenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


