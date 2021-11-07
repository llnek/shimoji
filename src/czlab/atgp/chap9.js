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
  const int=Math.floor;

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  function scenes(Mojo){
    const {Sprites:_S,
           Scenes:_Z,
           FX:_F,
           Input:_I,
           Game:_G,
           "2d":_2d,
           v2:_V,
           ute:_,is}=Mojo;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const { CData,NeuralNet }= window["io/czlab/atgp/NNetGA"](_,is);
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const NOT_READY  = 0,
          TRAINING = 1,
          ACTIVE   = 2,
          LEARNING = 3,
          NUM_INPUTS=12,
          NUM_OUTPUTS=11,
          NEURONS_PER_HIDDEN=6;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const TITLE_FONT="Big Shout Bob";
    const UI_FONT="Doki Lowercase";
    const C_TITLE=_S.color("#e4ea1c");//"#e8eb21";//"#fff20f";//yelloe
    //const C_TITLE=_S.color("#ea2152");//red
    //const C_TITLE=_S.color("#1eb7e6");//blue
    //const C_BG=_S.color("#169706");
    const C_TEXT=_S.color("#fff20f");
    const C_GREEN=_S.color("#7da633");
    const C_ORANGE=_S.color("#f4d52b");
    const C_BG=_S.color("#1e1e1e");

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _Z.defScene("Splash",{
      setup(){
        const self=this,
              K=Mojo.getScaleFactor();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        _.inject(this.g,{
          initHUD(){
            let cfg={fontName:UI_FONT, fontSize: K*64};
            let b,s= _S.bmpText("Train",cfg);
            s.m5.press=()=>{
              self.g.trainNetwork();
              self.g.gfx.clear();
              self.g.msgText.text="Training...";
            };
            b=_Z.layoutY([_I.mkBtn(s)],{bg:"#cccccc"});
            _V.set(b,0,0);
            self.insert(b);
            ////////////
            s=_S.bmpText("Press to train",cfg);
            _S.pinRight(b,s,10,1);
            self.insert(s);
            this.msgText=s;
          },
          initLevel(){
            this.data = CData();
            this.nnet = NeuralNet(2*NUM_INPUTS, NUM_OUTPUTS, NEURONS_PER_HIDDEN, 0.5);
            this.numSmoothPoints = NUM_INPUTS+1;//TODO

            this.mode = NOT_READY;
            this.highestOutput = 0;
            this.bestMatch = 0;
            this.match = -1;
            this.drawing = false;

            this.clear();
            this.gfx= self.insert(_S.graphics());
          },
          clear(){
            this.vectors = [];
            this.path = [];
            this.smoothPath = [];
          },
          trainNetwork(){
            if(this.mode==TRAINING){return}
            let cb;
            this.nnet.train(this.data,{ run(c){ cb=c } });
            this.trainingFunc=cb;
            this.mode = TRAINING;
          },
          testForMatch(){
            let outputs = this.nnet.update(this.vectors);
            if(outputs.length == 0){
              console.log("Error in with ANN output");
              return false;
            }
            this.highestOutput = 0;
            this.bestMatch = 0;
            this.match = -1;
            for(let i=0;i<outputs.length;++i){
              if(outputs[i] > this.highestOutput){
                this.highestOutput = outputs[i];
                this.bestMatch = i;
                if(this.highestOutput > 0.96)// MATCH_TOLERANCE
                  this.match = this.bestMatch;
              }
            }
            console.log(`highest=${this.highestOutput}, best=${this.bestMatch}, match= ${this.match}`);
            return true;
          },
          createVectors(){
            for(let i=1;i<this.smoothPath.length;++i){
              let x = this.smoothPath[i][0] - this.smoothPath[i-1][0];
              let y = this.smoothPath[i][1] - this.smoothPath[i-1][1];
              let v2 = [x,y];
              _V.unit$(v2);
              this.vectors.push(v2[0]);
              this.vectors.push(v2[1]);
            }
          },
          smooth(){
            if(this.path.length < this.numSmoothPoints){
              console.log(`Length of Path not correct: ${this.path.length}, expected: ${this.numSmoothPoints}`);
              return false;
            }

            this.smoothPath = this.path.slice();

            while(this.smoothPath.length > this.numSmoothPoints){
              let shortestSoFar = Infinity;
              let pointMarker = 0;
              for(let spanFront=2; spanFront<this.smoothPath.length-1; ++spanFront){
                let xTmp = this.smoothPath[spanFront-1][0] - this.smoothPath[spanFront][0];
                let yTmp = this.smoothPath[spanFront-1][1] - this.smoothPath[spanFront][1];
                let length = Math.sqrt(xTmp*xTmp + yTmp*yTmp);
                if(length < shortestSoFar){
                  shortestSoFar = length;
                  pointMarker = spanFront;
                }
              }

              let newPoint = [(this.smoothPath[pointMarker-1][0] + this.smoothPath[pointMarker][0])/2,
                              (this.smoothPath[pointMarker-1][1] + this.smoothPath[pointMarker][1])/2];

              this.smoothPath[pointMarker-1] = newPoint;
              this.smoothPath = this.smoothPath.slice(0,pointMarker).concat( this.smoothPath.slice(pointMarker+1));
            }
            return true;
          },
          addPoint(point){
            this.path.push(point)
          },
          isDrawing(){
            return this.drawing;
          },
          setDrawing(val){
            console.log(`setdraw called = ${val}, mode=${this.mode}`);
            if(val === true){
              this.clear();
              this.drawing = true;
              this.msgText.text="";
            }else{
              this.drawing=false;
              try{
                if(this.smooth()){
                  this.createVectors();
                  if(!this.testForMatch())
                    console.log( "Error when test for match");
                }else{
                  console.log(`NOT SMOOTH???????`);
                }
              }catch(e){
                console.log(e.toString());
              }
            }
          },
          paint(){
            if(!this.isDrawing()){
              if(this.highestOutput > 0){
                if(this.smoothPath.length > 1 && this.mode != LEARNING){
                  if(this.highestOutput < 0.96){ //#MATCH_TOLERANCE
                    this.msgText.text=`Gesture = ${this.data.patternName(this.bestMatch)}?`;
                  }else{
                    this.msgText.text= `Gesture = ${this.data.patternName(this.match)}`;
                  }
                }else if(this.mode != LEARNING){
                  console.log(`Not enough points drawn - plz try again`);
                }
              }
            }
            if(this.path.length < 2){return}
            this.gfx.clear();
            this.gfx.lineStyle(1,_S.color("white"));
            for(let p,i=0,z=this.path.length; i<z;++i){
              p=this.path[i];
              this.gfx.moveTo(p[0],p[1]);
              if((i+1)<z){
                p=this.path[i+1];
              }
              this.gfx.lineTo(p[0],p[1]);
            }
            if(!this.isDrawing() && this.smoothPath.length>0){
              for(let p,i=0;i<this.smoothPath.length;++i){
                p=this.smoothPath[i];
                this.gfx.drawCircle(p[0],p[1],5);
              }
            }
          },
          onMouseDown(){
            if(self.g.mode==ACTIVE) self.g.setDrawing(true);
          },
          onMouseUp(){
            if(self.g.mode==ACTIVE) self.g.setDrawing(false);
          },
          onMouseMove(){
            if(self.g.mode==ACTIVE &&
               self.g.isDrawing()){
              self.g.addPoint([ Mojo.mouse.x, Mojo.mouse.y])
            }
          }
        });
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        this.g.initLevel();
        this.g.initHUD();
        //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
        Mojo.on(["mousedown"], "onMouseDown", this.g);
        Mojo.on(["mouseup"], "onMouseUp", this.g);
        Mojo.on(["mousemove"], "onMouseMove", this.g);
      },
      dispose(){
        Mojo.off(["mousedown"], "onMouseDown", this.g);
        Mojo.off(["mouseup"], "onMouseUp", this.g);
        Mojo.off(["mousemove"], "onMouseMove", this.g);
      },
      postUpdate(dt){
        if(this.g.trainingFunc){
          console.log("Training in progress.......................");
          if(this.g.trainingFunc()){
            this.g.trainingFunc=null;
            this.g.mode=ACTIVE;
            this.g.msgText.text="Ready!";
          }
        }
        if(this.g.mode == ACTIVE){
          this.g.paint();
        }
      }
    });

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    //assetFiles: ["wall.png","ground.png","green.png","water.png"],
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


