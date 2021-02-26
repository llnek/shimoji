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

  function defScenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_2d=Mojo["2d"],_I=Mojo.Input;

    _Z.defScene("level1",{
      setup(){
        //make a blue rect
        let blue = this.blue= _S.rectangle(48, 64, "blue");
        _S.centerAnchor(blue);
        blue.x=100;
        blue.y=100;
        blue.angle=42;
        blue.m5.step=function(dt){
          _S.move(blue,dt);
        }
        this.insert(blue);
        //make a red square
        let red = this.red= _S.rectangle(64, 64, "red");
        _S.centerAnchor(red);
        red.x=500;
        red.y=500;
        red.angle=76;
        red.m5.step=function(dt){
          _S.move(red,dt);
        }
        this.insert(red);
        //make a green circle
        let green = this.green= _S.circle(32, "green");
        _S.centerAnchor(green);
        green.m5.step=function(dt){
          _S.move(green,dt);
        };
        this.insert(green);

        //make a orange circle
        let orange = this.orange= _S.circle(48, "orange");
        _S.centerAnchor(orange);
        orange.m5.step=function(dt){
          _S.move(orange,dt);
        };
        this.insert(orange);

        red.m5.vel[0]=red.m5.vel[1]=150;
        blue.m5.vel[0]=blue.m5.vel[1]=-150;
        green.m5.vel[0]=180;green.m5.vel[1]=-180;
        orange.m5.vel[0]=-180;orange.m5.vel[1]=180;

        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate(){

        this.blue.rotation += 0.05;
        this.red.rotation += 0.07;

        _2d.collide(this.red,this.blue,true);
        _2d.collide(this.red,this.green,true);
        _2d.collide(this.blue,this.green,true);
        _2d.collide(this.red,this.orange,true);
        _2d.collide(this.blue,this.orange,true);
        _2d.collide(this.orange,this.green,true);

        _2d.contain(this.blue,this,true);
        _2d.contain(this.red,this,true);
        _2d.contain(this.green,this,true);
        _2d.contain(this.orange,this,true);
      }
    });
  }

  window.addEventListener("load",()=>{
    MojoH5({
      arena: {width:640, height:640},
      scaleToWindow: true,
      start(Mojo){
        defScenes(Mojo);
        Mojo.Scenes.runScene("level1");
      }
    })
  });

})(this);


