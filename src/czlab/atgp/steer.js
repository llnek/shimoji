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
            _G.nOutputHeight = 100;//Mojo.height;
            _G.nOutputWidth = 240;//Mojo.width;
            _G.nOutputSize = 240;//Mojo.width;
            _G.nOutputHeight = Mojo.height;
            _G.nOutputWidth = Mojo.width;
            _G.nOutputSize = Mojo.width;

            _G.fNoiseSeed2D = _.fill(_G.nOutputWidth * _G.nOutputHeight, ()=> _.rand());
            _G.fPerlinNoise2D = _G.fNoiseSeed2D.slice();

            _G.fNoiseSeed1D = _.fill(_G.nOutputWidth, ()=> _.rand());
            _G.fPerlinNoise1D = _G.fNoiseSeed1D.slice();

            _G.nOctaveCount = 2;
            _G.fScalingBias = 2;
            _G.nMode = 2;

            this.gfx=self.insert(_S.graphics());
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        //function cb(){ } Mojo.on(["single.tap"],cb);
      },
      mode1(){
        let h2=Mojo.height/2;
        _M.perlin1D(_G.nOutputSize, _G.fNoiseSeed1D, _G.nOctaveCount, _G.fScalingBias, _G.fPerlinNoise1D);
        for(let y,x=0; x< _G.nOutputSize; ++x){
          y = -(_G.fPerlinNoise1D[x] * h2) + h2;
          if(y < h2){
            this.doDraw(x, y, h2,"green");
          }else{
            this.doDraw(x, h2,y, "red");
          }
        }
      },
      mode2(){
        _M.perlin2D(_G.nOutputWidth, _G.nOutputHeight, _G.fNoiseSeed2D, _G.nOctaveCount, _G.fScalingBias, _G.fPerlinNoise2D);
        for(let x=0; x< _G.nOutputWidth; ++x){
          for(let y=0; y < _G.nOutputHeight; ++y){
            let c,a,p = int(_G.fPerlinNoise2D[int(y * _G.nOutputWidth + x)] * 12);
            if(p==0){
              c="black";
              a=1;
            }else if(p>=1&&p<=4){
              c="#63666A";
              a= p*0.25;
            }else if(p>=5&&p<=8){
              c="#BEC3C6";
              a=(p-4)*0.25;
            }else if(p>=9&&p<=12){
              c="#D9D9D6";
              a=(p-8)*0.25;
            }else{
              console.log("sfdsfds");
            }
            this.doDraw2(x, y, c,a);
          }
        }
      },
      doDraw2(x,y,color,a){
        this.g.gfx.beginFill(_S.color(color),a);
        this.g.gfx.drawRect(x,y,2,2)
      },
      doDraw(x,y1,y2,color){
        this.g.gfx.lineStyle(1,_S.color(color));
        this.g.gfx.moveTo(x,y1);
        this.g.gfx.lineTo(x,y2);
      },
      postUpdate(dt){
        this.g.gfx.clear();
        if(_I.keyDown(_I.Z)){//0..1
          _G.fNoiseSeed1D.forEach((v,i)=> _G.fNoiseSeed1D[i]= _.rand());
          _G.fNoiseSeed2D.forEach((v,i)=> _G.fNoiseSeed2D[i]= _.rand());
        }
        if(_I.keyDown(_I.X))//-1..1
          _G.fNoiseSeed1D.forEach((v,i)=> _G.fNoiseSeed1D[i]= _.randMinus1To1());
        if(_I.keyDown(_I.SPACE)) _G.nOctaveCount++;
        if(_I.keyDown(_I.ONE)) _G.nMode = 1;
        if(_I.keyDown(_I.TWO)) _G.nMode = 2;
        if(_I.keyDown(_I.Q)) _G.fScalingBias += 0.2;
        if(_I.keyDown(_I.A)) _G.fScalingBias -= 0.2;
        if(_G.fScalingBias < 0.2) _G.fScalingBias = 0.2;
        if(_G.nOctaveCount == 9) _G.nOctaveCount = 1;
        if(_G.nMode==1) this.mode1();
        if(_G.nMode==2) this.mode2();

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


