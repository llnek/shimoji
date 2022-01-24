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
    const Core= window["io/czlab/mcfud/core"]();
    const GA= window["io/czlab/mcfud/algo/NNetGA"](Core);
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
		function CData(){
			const vecPatterns= [[1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0],
											[-1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0],
											[0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0, 0,1.0],
											[0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0, 0,-1.0],
											[1.0,0, 1.0,0, 1.0,0, 0,1.0, 0,1.0, 0,1.0, -1.0,0, -1.0,0, -1.0,0, 0,-1.0, 0,-1.0, 0,-1.0],
											[-1.0,0, -1.0,0, -1.0,0, 0,1.0, 0,1.0, 0,1.0, 1.0,0, 1.0,0, 1.0,0, 0,-1.0, 0,-1.0, 0,-1.0],
											[1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0, -0.45,0.9, -0.9, 0.45, -0.9,0.45],
											[-1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, -1.0,0, 0.45,0.9, 0.9, 0.45, 0.9,0.45],
											[-0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7, -0.7,0.7],
											[0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7, 0.7,0.7],
											[1.0,0, 1.0,0, 1.0,0, 1.0,0, -0.72,0.69,-0.7,0.72,0.59,0.81, 1.0,0, 1.0,0, 1.0,0, 1.0,0, 1.0,0]];
			const setIn=vecPatterns.slice(),
				    numPatterns= vecPatterns.length,
				    setOut=_.fill(numPatterns,(i,o)=>{
							o=_.fill(numPatterns,0); o[i] = 1; return o; });
			return{
				setIn, //11x12,
				setOut,//11x11
				numPatterns,
				vecNames: ["Right", "Left", "Down", "Up",
					         "Clockwise Square", "Anti-Clockwise Square",
								   "Right Arrow", "Left Arrow", "South West", "Sout East", "Zorro"],
				patternName(i){
					try{
						return this.vecNames[i]
					}catch(e){
						return "Unknown pattern"
					}
				}
			};
		}

    function networkTrainingCycle(nnet, learnRate, setIn, setOut){
      nnet.errorSum = 0;
      for(let err,outputs,vec=0;vec<setIn.length;++vec){
        outputs = nnet.update(setIn[vec]);
        if(outputs.length==0) return false;
        for(let u,ws,op=0;op<nnet.numOutputs;++op){
          err = (setOut[vec][op] - outputs[op]) * outputs[op] * (1 - outputs[op]);
          u=nnet.layers[1].neurons[op];
          ws=u.weights;
          u.error = err;
          nnet.errorSum += (setOut[vec][op] - outputs[op]) * (setOut[vec][op] - outputs[op]);

          for(let i=0;i<ws.length-1;++i)
            ws[i] += err*learnRate*nnet.layers[0].neurons[i].activation;

          ws[ws.length-1] += err * learnRate * _G.params.BIAS;
        }

        for(let i=0;i<nnet.layers[0].neurons.length;++i){
          err = 0;
          for(let j=0;j<nnet.layers[1].neurons.length;++j){
            err += nnet.layers[1].neurons[j].error * nnet.layers[1].neurons[j].weights[i];
          }
          err *= nnet.layers[0].neurons[i].activation * (1-nnet.layers[0].neurons[i].activation);

          for(let w=0;w<nnet.numInputs;++w)
            nnet.layers[0].neurons[i].weights[w] += err * learnRate * setIn[vec][w];

          nnet.layers[0].neurons[i].weights[nnet.numInputs] += err * _G.params.BIAS;
        }
      }
      return true;
    }

    function train(nnet,learnRate,data,async){
      let {setIn,setOut} = data;
      _.assert(setIn.length == setOut.length &&
               setIn[0].length == nnet.numInputs &&
               setOut[0].length == nnet.numOutputs, "Inputs/Outputs length is invalid.");
      //initNetwork()
      nnet.errorSum = 9999.9;
      nnet.trainCycles = 0;
      nnet.trained=false;
      nnet.layers.forEach(y=> y.neurons.forEach(u=>{
        u.weights=_.fill(u.numInputs, ()=> _.randMinus1To1())
      }));
      //
      async.run((count=100)=>{
        for(let i=0;i<count && !nnet.trained; ++i){
          let ok= networkTrainingCycle(nnet, learnRate,setIn, setOut);
          if(!ok){
            console.log(`Ooopss..... bad training`);
          }
          nnet.trainCycles += 1;
          console.log(`Epoch: ${nnet.trainCycles}, ErrorSum: ${nnet.errorSum}`);
          if(nnet.errorSum>0.003){}else{
            console.log(`trained-ok`);
            nnet.trained=true;
          }
        }
        return nnet.trained;
      });
      if(false){
        while(nnet.errorSum>0.003){
          if(!networkTrainingCycle(nnet,learnRate,setIn, setOut)) return false;
          nnet.trainCycles += 1;
        }
        return nnet.trained = true;
      }
    }

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
            this.nnet = new GA.NeuralNet(2*NUM_INPUTS, NUM_OUTPUTS, 1,NEURONS_PER_HIDDEN);
            this.numSmoothPoints = NUM_INPUTS+1;

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
            train(this.nnet, 0.5, this.data,{ run(c){ cb=c } });
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
        _G.params= GA.config({});
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


