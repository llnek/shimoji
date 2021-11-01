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

;(function(global){

	"use strict";

	//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
	global["io/czlab/atgp/TSP"]=function(_,is){

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const NUM_CITIES = 20,
		      CITY_SIZE = 8,
	        POP_SIZE = 40,
		      MUTATION_RATE = 0.2,
	        CROSSOVER_RATE = 0.75;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		//const EPSILON = 0.000001;
		const PI2=Math.PI*2;
		const NUM_BEST_TO_ADD	= 2;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		class mapTSP{
			constructor(coords){
				this.bestPossibleRoute = 0;
				this.cityMap = coords;
				this.calcBestPossibleRoute();
			}
			calcA_to_B(c1, c2){
				let dx=c1.x-c2.x,
					  dy=c1.y-c2.y;
				return Math.sqrt(dx*dx + dy*dy);
			}
			calcBestPossibleRoute(){
				//sum up 0->second last, then add last->0
				let sum=0;
				for(let c,i=0;i< this.cityMap.length-1;++i){
					sum += this.calcA_to_B(this.cityMap[i], this.cityMap[i+1]);
					//this.bestPossibleRoute += EPSILON;
				}
				this.bestPossibleRoute = sum + this.calcA_to_B(this.cityMap[this.cityMap.length-1], this.cityMap[0]);
			}
			getBestPossibleRoute(){
				return this.bestPossibleRoute;;
			}
			getTourLength(route){
				let sum = 0;
				for(let i=0;i< route.length-1; ++i){
					sum += this.calcA_to_B(this.cityMap[route[i]], this.cityMap[route[i+1]]);
				}
				return sum + this.calcA_to_B(this.cityMap[route[route.length-1]], this.cityMap[route[0]]);
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function grabPermutation(limit){
			let perm = [];
			for(let n,i=0;i<limit;++i){
				n= _.randInt2(0, limit-1);
				while(perm.indexOf(n)>=0)
					n= _.randInt2(0, limit-1);
				perm.push(n);
			}
			return perm;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		class SGenome{
			constructor(arg){
				if(is.vec(arg)){
					this.cities = arg;
				}else{
					this.cities = grabPermutation(+arg);
				}
				this.fitness = 0;
			}
			clone(){
				let c= new SGenome(this.cities.slice());
				c.fitness=this.fitness;
				return c;
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function rouletteWheelSelection(self){
			let cfTotal = 0,
					selected=0,
					fSlice = _.rand() * self.totalFitness;

			for(let i=0;i<self.popSize;++i){
				cfTotal += self.population[i].fitness;
				if(cfTotal > fSlice){
					selected= i;
					break;
				}
			}
			return self.population[selected];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function mutateEM(geno,mRate){
			if(_.rand() > mRate){}else{
				let p1= _.randInt2(0, geno.cities.length-1);
				let t,p2 = p1
				while(p1 == p2)
					p2 = _.randInt2(0, geno.cities.length-1);
				//swap
				t=geno.cities[p1];
				geno.cities[p1]=geno.cities[p2];
				geno.cities[p2]=t;
			}
			return geno;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function crossOverPMX(mum, dad, cRate){
			let b1,b2;
			if(_.rand() > cRate || mum === dad){
				b1=mum.cities.slice();
				b2=dad.cities.slice();
			}else{
				let beg = _.randInt2(0, mum.cities.length-2);
				let end = _.randInt2(beg+1, mum.cities.length-1);
				b1 = mum.cities.slice();
				b2 = dad.cities.slice();
				for(let t,pos=beg; pos<=end;++pos){
					let gene1 = b1[pos];
					let gene2 = b2[pos];
					if(gene1 != gene2){
						let posGene1 = b1.indexOf(gene1);
						let posGene2 = b1.indexOf(gene2);
						t=b1[posGene1];
						b1[posGene1]=b1[posGene2];
						b1[posGene2]=t;

						posGene1 = b2.indexOf(gene1);
						posGene2 = b2.indexOf(gene2);
						t=b2[posGene1];
						b2[posGene1]= b2[posGene2];
						b2[posGene2]=t;
					}
				}
			}
			return [b1, b2];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function calcPopulationsFitness(self){
			let shortestRoute = Infinity;
			let longestRoute  = 0;
			let totalFitness  = 0;
			for(let t,i=0;i<self.popSize;++i){
				t= self.map.getTourLength(self.population[i].cities);
				self.population[i].fitness = t;
				if(t < shortestRoute){
					shortestRoute = t;
					self.fittestGenome = i;
				}
				if(t> longestRoute) longestRoute = t;
			}
			for(let i=0;i<self.popSize;++i){
				self.population[i].fitness = longestRoute - self.population[i].fitness;
				totalFitness += self.population[i].fitness;
			}

			return {shortestRoute, longestRoute, totalFitness  };
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function nextGen(self){
			let res,out= [];
			for(let i=0;i<NUM_BEST_TO_ADD;++i)
				out.push(self.population[self.fittestGenome].clone());
			while(out.length < self.popSize){
				res = crossOverPMX(rouletteWheelSelection(self),
													 rouletteWheelSelection(self), self.crossOverRate);
				out.push(mutateEM( new SGenome(res[0]), self.mutationRate));
				out.push(mutateEM( new SGenome(res[1]), self.mutationRate));
			}
			self.population = out;
			self.generation += 1;
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		class gaTSP{
			constructor(cities,popSize,crossRate,mutRate){
				this.crossOverRate = _.nor(crossRate,CROSSOVER_RATE);
				this.mutationRate = _.nor(mutRate,MUTATION_RATE);
				this.popSize = _.nor(popSize,POP_SIZE);
				this.chromoLength = cities.length;
				this.shortestRoute = Infinity;
				this.fittestGenome = 0;
				this.generation = 1;
				this.longestRoute = 0;
				this.active = true;
				this.totalFitness = 0;
				this.population = [];
				this.map = new mapTSP(cities);
				//////////////////////////
				for(let i=0;i<this.popSize;++i)
					this.population.push(new SGenome(this.chromoLength))
			}
			cycle(){
				let res= calcPopulationsFitness(this);
				this.shortestRoute = res.shortestRoute;
				this.longestRoute  = res.longestRoute;
				this.totalFitness  = res.totalFitness;
				if(this.shortestRoute <= this.map.getBestPossibleRoute()){
					this.active = false;
				}else{
					nextGen(this);
				}
				console.log(`shortest = ${res.shortestRoute}`);
				return this;
			}
			cycleCount(){
				return this.generation;
			}
			started(){
				return this.active
			}
			stop(){
				this.active=false;
			}
			getFittestRoute(){
				let r= this.population[this.fittestGenome].cities;
				if(!is.vec(r)){
					console.log("PPPPP");
				}
				return r;
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		return {
			NUM_CITIES,
			CITY_SIZE,
			POP_SIZE,
			MUTATION_RATE,
			CROSSOVER_RATE,
			gaTSP
		}
	}

})(this);


