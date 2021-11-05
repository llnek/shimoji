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
		const MAX_PERTURBATION = 0.3,
		      NUM_ELITE = 4,
			    BIAS= -1,
			    ACTIVATION_RESPONSE = 1,
		      NUM_COPIES_ELITE  = 1;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SNeuron(numInputs){
			return {
				numInputs,
				weights: _.fill(numInputs, ()=> _.randMinus1To1())
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SNeuronLayer(numNeurons, numInputsPerNeuron){
			return {
				numNeurons,
				neurons: _.fill(numNeurons,()=> SNeuron(numInputsPerNeuron))
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function NeuralNet(numInputs, numOutputs, numHidden, neuronsPerHidden){
			function createNet(out){
				//make the first layer
				out.push(SNeuronLayer(numHidden>0?neuronsPerHidden:numOutputs,numInputs));
				if(numHidden>0){
					for(let i=0;i<numHidden-1;++i)
						out.push(SNeuronLayer(neuronsPerHidden, neuronsPerHidden));
					out.push(SNeuronLayer(numOutputs, neuronsPerHidden));
				}
				return [out, countWeights(out)];
			}
			function countWeights(l){
				let sum = 0
				_.doseq(l, y=>
					_.doseq(y.neurons, u=> {sum += u.weights.length}));
				return sum;
			}
			let [layers, numOfWeights]=createNet([]);
			return{
				numOfWeights,
				numOutputs,
				numInputs,
				numHidden,
				neuronsPerHidden,
				layers,
				//getWeights(){ return this.layers.map(y=> y.neurons.map(u=> u.weights.map(v=>v)).flat()).flat(); },
				putWeights(weights){
					let pos=0;
					_.doseq(this.layers, y=>
						_.doseq(y.neurons, u=>
							_.doseq(u.weights, (v,i)=> u.weights[i]= weights[pos++])));
				},
				getNumberOfWeights(){
					return this.numOfWeights;//countWeights(this.layers)
				},
				update(inputs){
					let sumInput,numInputs,idx = 0, out=[];
					if(inputs.length == this.numInputs)
						_.doseq(this.layers, (y,i)=>{
							if(i>0)
								inputs = out;
							idx  = 0;
							out= [];
							y.neurons.forEach(u=>{
								idx = 0;
								sumInput = 0;
								numInputs = u.numInputs;
								for(let k=0;k<numInputs-1;++k){
									sumInput += (u.weights[k] * inputs[idx]);
									++idx;
								}
								sumInput += (u.weights[numInputs-1] * BIAS);
								out.push(this.sigmoid(sumInput, ACTIVATION_RESPONSE));
							});
						});
					_.assert(out.length== this.numOutputs, "out length incorrect");
					return out;
				},
				sigmoid(input, response){
					return (1 / (1 + Math.exp(-input / response)))
				},
				calcSplitPoints(){
					let pts= [],
					    pos = 0;
					this.layers.forEach(y=> y.neurons.forEach(u=>{
						pos += u.numInputs;
						pts.push(pos-1);
					}));
					return pts;
				}
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SGenome(w, f=0){
			return {
				fitness: f,
				weights: w,
				clone(){
					return SGenome(this.weights.slice(),this.fitness)
				}
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function gaNNet(popSize, mutationRate, crossOverRate, numWeights, splitPoints){
			return {
				popSize,
				mutationRate,
				crossOverRate,
				splitPoints,
				chromoLength: numWeights,
				totalFitness: 0,
				generation: 0,
				fittestGenome: 0,
				bestFitness: 0,
				worstFitness: Infinity,
				averageFitness: 0,
				vecPop: _.fill(popSize, ()=> SGenome(_.fill(numWeights, ()=> _.randMinus1To1()))),
				mutate(c){
					c.weights.forEach((w,i)=>{
						if(_.rand() < this.mutationRate)
							c.weights[i] =  w + _.randMinus1To1() * MAX_PERTURBATION;
					});
					return c;
				},
				getChromos(){
					return this.vecPop
				},
				getChromoRoulette(){
					let theChosenOne,
						  fitnessSoFar = 0,
					    slice = _.rand() * this.totalFitness;
					for(let p,i=0;i<this.popSize;++i){
						p=this.vecPop[i];
						fitnessSoFar += p.fitness;
						if(fitnessSoFar >= slice){
							theChosenOne = p.clone();
							break;
						}
					}
					return theChosenOne;
				},
				crossOver(mum, dad){
					let b1,b2;
					if(_.rand() > this.crossOverRate || mum === dad){
						b1 = mum.weights.slice();
						b2 = dad.weights.slice();
					}else{
						let cp = _.randInt2(0, this.chromoLength-1);
						b1=mum.weights.slice(0,cp).concat(dad.weights.slice(cp));
						b2=dad.weights.slice(0,cp).concat(mum.weights.slice(cp));
					}
					return [b1,b2];
				},
				crossOverAtSplits(mum, dad){
					let b1,b2;
					if(_.rand() > this.crossOverRate || mum === dad){
						b1 = mum.weights.slice();
						b2 = dad.weights.slice();
					}else{
						let cp = _.randInt2(0, this.splitPoints.length-2);
						let cp1 = this.splitPoints[cp];
						let cp2 = this.splitPoints[_.randInt2(cp1, this.splitPoints.length-1)];
						b1= mum.weights.slice(0,cp1).concat(dad.weights.slice(cp1,cp2)).concat(mum.weights.slice(cp2));
						b2= dad.weights.slice(0,cp1).concat(mum.weights.slice(cp1,cp2)).concat(dad.weights.slice(cp2));
					}
					return [b1,b2];
				},
				calcBestWorstAvTotal(){
					let highestSoFar = 0,
							lowestSoFar  = Infinity;
					this.totalFitness = 0;
					this.vecPop.forEach((c,i)=>{
						if(c.fitness > highestSoFar){
							highestSoFar = c.fitness;
							this.fittestGenome = i;
							this.bestFitness = highestSoFar;
						}
						if(c.fitness < lowestSoFar){
							lowestSoFar = c.fitness;
							this.worstFitness = lowestSoFar;
						}
						this.totalFitness += c.fitness;
					});
					this.averageFitness = this.totalFitness / this.popSize;
				},
				fitnessScaleRank(){
					let fitnessMultiplier = 1;
					this.vecPop.forEach((c,i)=>{
						c.fitness = i * fitnessMultiplier
					});
					this.calcBestWorstAvTotal();
				},
				reset(){
					this.totalFitness = 0;
					this.bestFitness  = 0;
					this.averageFitness = 0;
					this.worstFitness = Infinity;
				},
				grabNBest(nBest, numCopies){
					let p,pop = [];
					while(nBest != 0){
						_.dotimes(numCopies,()=>{
							p=this.vecPop[(this.popSize-1) - nBest];
							if(p) pop.push(p);
						});
						nBest -= 1;
					}
					return pop;
				},
				cycle(old){
					this.vecPop = old;
					this.reset();
					this.vecPop.sort((a,b)=>{
						return a.fitness<b.fitness?-1:(a.fitness>b.fitness?1:0)
					});
					this.calcBestWorstAvTotal();
					let vecNewPop = [];
					if(_.isEven(NUM_COPIES_ELITE * NUM_ELITE))
						vecNewPop = this.grabNBest(NUM_ELITE, NUM_COPIES_ELITE);

					while(vecNewPop.length < this.popSize){
						let mum = this.getChromoRoulette();
						let dad = this.getChromoRoulette();
						let res= this.crossOverAtSplits(mum, dad);
						vecNewPop.push( this.mutate(SGenome(res[0])));
						vecNewPop.push( this.mutate(SGenome(res[1])));
					}

					return this.vecPop = vecNewPop;
				},
				averageFitness(){
					return this.totalFitness/this.popSize
				},
				bestFitness(){
					return this.bestFitness
				}
			}
		}

		return{
			MAX_PERTURBATION,
			NUM_ELITE,
			NUM_COPIES_ELITE,
			gaNNet,
			NeuralNet
		}

	}



})(this)


