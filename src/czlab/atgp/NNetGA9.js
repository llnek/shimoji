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
 * Copyright © 2013-2021, Kenneth Leung. All rights reserved. */

;(function(global){

	"use strict";

	global["io/czlab/atgp/NNetGA"]=function(_,is){

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const BIAS= -1,
			    ACTIVATION_RESPONSE = 1;
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
				setOut,//l1x11
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

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SNeuron(_numInputs){
			let numInputs= 1+_numInputs;
			return{
				activation: 0,
				error:0,
				numInputs,
				weights: _.fill(numInputs,()=> _.randMinus1To1())
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SNeuronLayer(numNeurons, numInputsPerNeuron){
			return{
				numNeurons,
				neurons: _.fill(numNeurons,()=> SNeuron(numInputsPerNeuron))
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function NeuralNet(numInputs, numOutputs, neuronsPerHidden,learnRate,numHiddenLayers=1){//12,11,6,...
			function createNet(out){
				if(numHiddenLayers > 0){
					out.push(SNeuronLayer(neuronsPerHidden, numInputs));
					for(let i=0;i<numHiddenLayers-1;++i)
						out.push(SNeuronLayer(neuronsPerHidden, neuronsPerHidden));
					out.push(SNeuronLayer(numOutputs, neuronsPerHidden));
				}else{
					out.push(SNeuronLayer(numOutputs, numInputs))
				}
				return out;
			}
			return{
				numInputs,
				numOutputs,
		    neuronsPerHidden,
				learnRate,
				numHiddenLayers,
				errorSum: 9999.9,
				trained:false,
				trainCycles:0,
				layers: createNet([]),
				initNetwork(){
					this.errorSum = 9999.9;
					this.trainCycles = 0;
					this.trained=false;
					this.layers.forEach(y=> y.neurons.forEach(u=>{
						u.weights=_.fill(u.numInputs, ()=> _.randMinus1To1())
					}));
				},
				update(inputs){
					_.assert(inputs.length == this.numInputs,"incorrect input size");
					let sum,ins,weight = 0, outputs = [];
					for(let i=0;i<this.numHiddenLayers+1;++i){
						if(i>0)
							inputs = outputs;
						outputs = []
						weight = 0;
						this.layers[i].neurons.forEach(u=>{
							sum = 0;
							ins = u.numInputs;
							for(let k=0;k<ins-1;++k){
								sum += u.weights[k] * inputs[weight];
								weight += 1;
							}
							sum += u.weights[ins-1] * BIAS;
							u.activation = this.sigmoid(sum, 1); //ACTIVATION_RESPONSE = 1.0
							outputs.push(u.activation);
							weight = 0;
						});
					}
					return outputs
				},
				sigmoid(netinput, response){
					return (1 / (1 + Math.exp(-netinput / response)))
				},
				networkTrainingCycle(setIn, setOut){
					this.errorSum = 0;
					for(let err,outputs,vec=0;vec<setIn.length;++vec){
						outputs = this.update(setIn[vec]);
						if(outputs.length==0) return false;

						for(let u,ws,op=0;op<this.numOutputs;++op){
							err = (setOut[vec][op] - outputs[op]) * outputs[op] * (1 - outputs[op]);
							u=this.layers[1].neurons[op];
							ws=u.weights;
							u.error = err;
							this.errorSum += (setOut[vec][op] - outputs[op]) * (setOut[vec][op] - outputs[op]);

							for(let i=0;i<ws.length-1;++i)
								ws[i] += err*this.learnRate*this.layers[0].neurons[i].activation;

							ws[ws.length-1] += err * this.learnRate * BIAS;
						}

						for(let i=0;i<this.layers[0].neurons.length;++i){
							err = 0;
							for(let j=0;j<this.layers[1].neurons.length;++j){
								err += this.layers[1].neurons[j].error * this.layers[1].neurons[j].weights[i];
							}
							err *= this.layers[0].neurons[i].activation * (1-this.layers[0].neurons[i].activation);

							for(let w=0;w<this.numInputs;++w)
								this.layers[0].neurons[i].weights[w] += err * this.learnRate * setIn[vec][w];

							this.layers[0].neurons[i].weights[this.numInputs] += err * BIAS;
						}
					}
					return true;
				},
				train(data,async){
					let self=this,
						  {setIn,setOut} = data;

					_.assert(setIn.length == setOut.length &&
						       setIn[0].length == this.numInputs &&
						       setOut[0].length == this.numOutputs, "Inputs/Outputs length is invalid.");

					this.initNetwork();
					async.run((count=100)=>{
						for(let i=0;i<count && !self.trained; ++i){
							let ok= self.networkTrainingCycle(setIn, setOut);
							if(!ok){
								console.log(`Ooopss..... bad training`);
							}
							self.trainCycles += 1;
							console.log(`Epoch: ${self.trainCycles}, ErrorSum: ${self.errorSum}`);
							if(self.errorSum>0.003){}else{
								console.log(`trained-ok`);
								self.trained=true;
							}
						}
						return self.trained;
					});
					if(false){
						while(this.errorSum>0.003){
							if(!this.networkTrainingCycle(setIn, setOut)) return false;
							this.trainCycles += 1;
						}
						return this.trained = true;
					}
				}
			}
		}

		return{
			CData,NeuralNet
		}

	}



})(this)


