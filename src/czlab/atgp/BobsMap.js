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
	global["io/czlab/atgp/bob"]=function(_,is){

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const abs=Math.abs,
		      int=Math.floor;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const LEVEL=[
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			[1, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
			[8, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1],
			[1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1],
			[1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
			[1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1],
			[1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1],
			[1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 5],
			[1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
			[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
		];

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const DIRS=["North","South","East","West"];
		const StartPos= [7,14];
		const EndPos= [2,0];

		const CROSSOVER_RATE= 0.7,
				  MUTATION_RATE= 0.015,
					POP_SIZE= 140,
				  CHROMO_LENGTH= 70,
					GENE_LENGTH= 2,
					ROWS= LEVEL.length,
					COLS= LEVEL[0].length;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		//path="01230123"
		function testRoute(geno){
			let [endY,endX] = EndPos,
			    [posY,posX] = StartPos;
			decode(geno).forEach(d=>{
				switch(d){
					case 0://north
						if(posY-1 >= 0 && LEVEL[posY-1][posX] != 1) posY -= 1;
						break;
					case 1://south
						if(posY+1 < ROWS && LEVEL[posY+1][posX] != 1) posY += 1;
						break;
					case 2://east
						if(posX+1 < COLS && LEVEL[posY][posX+1] != 1) posX += 1;
						break;
					case 3://west
						if(posX-1 >= 0 && LEVEL[posY][posX-1] != 1) posX -= 1;
						break;
					default:
						_.assert(false, `Bad direction: ${d}`);
				}
			});

			let dx = abs(posX - endX);
			let dy = abs(posY - endY);
			return 1/(dx+dy+1);
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		class Genome{
			constructor(numBits){
				if(is.vec(numBits)){
					this.bits=numBits;
				}else{
					this.bits = [];
					for(let i=0;i<numBits;++i)
						this.bits.push(_.randSign()>0?1:0);
				}
				this.fitness = 0;
			}
			show(){
				console.log(`bits=${this.bits.toString()}, fitness= ${this.fitness}`)
			}
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		Genome.width=2;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function rouletteWheelSelection(genomes, totalFScore){
			let cfTotal = 0,
					selected= 0,
					fSlice  = _.rand() * totalFScore;

			for(let i=0; i< genomes.length; ++i){
				cfTotal += genomes[i].fitness;
				if(cfTotal > fSlice){
					selected= i;
					break;
				}
			}

			return genomes[selected];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function mutate(geno,mRate){
			for(let i=0; i<geno.bits.length; ++i){
				if(_.rand() < mRate){
					if(geno.bits[i] == 0) geno.bits[i] = 1;
					if(geno.bits[i] == 1) geno.bits[i] = 0;
				}
			}
			return geno;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function crossOver(mum, dad, cRate){
			let i,cp,b1,b2;
			if(_.rand() > cRate || mum === dad){
				b1=mum.bits.slice();
				b2=dad.bits.slice();
			}else{
				cp = _.randInt2(0, mum.bits.length-1);
				b1=[];b2=[];
				for(i=0; i<cp; ++i){
					b1.push(mum.bits[i]);
					b2.push(dad.bits[i]);
				}
				for(i=cp; i<mum.bits.length; ++i){
					b1.push(dad.bits[i]);
					b2.push(mum.bits[i]);
				}
			}
			return [b1,b2]
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function binToInt(bins){
			let val = 0,
					multiplier = 1;
			for(let i=bins.length-1;i>=0;--i){
				val += bins[i] * multiplier;
				multiplier *= 2;
			}
			return val;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function decode(geno){
			let dirs = [],
				  g = _.fill(Genome.width,null);
			for(let i=0;i<geno.bits.length;){
				for(let j=0;j< g.length; ++j){
					g[j]= geno.bits[i+j]
				}
				i += g.length;
				dirs.push(binToInt(g));
			}
			return dirs;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function updateFitnessScores(genomes){
			let fittestGenome     = 0;
			let bestFitnessScore  = 0;
			let totalFitnessScore = 0;
			for(let fv=0,i=0;i<genomes.length && fv != 1; ++i){
				fv= testRoute(genomes[i]);
				genomes[i].fitness = fv;
				totalFitnessScore += fv;
				if(fv > bestFitnessScore){
					fittestGenome = i;
					bestFitnessScore = fv;
				}
			}
			return { fittestGenome, bestFitnessScore, totalFitnessScore }
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function nextGen(genomes,cRate,mRate,totalFScore){
			let out=[];
			for(let i=0;i<genomes.length; i += 2){
				let mum = rouletteWheelSelection(genomes, totalFScore),
						dad = rouletteWheelSelection(genomes, totalFScore);
				let babies = crossOver(mum, dad, cRate);
				let b1= new Genome(babies[0]);
				let b2 = new Genome(babies[1]);
				mutate(b1,mRate);
				mutate(b2,mRate);
				out.push(b1);
				out.push(b2);
			}
			out.forEach((o,i) => genomes[i]=o);
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		class GaBob{
			constructor(cross_rate, mut_rate, pop_size, num_bits, gene_len){
				this.crossOverRate = _.nor(cross_rate,CROSSOVER_RATE);
				this.mutationRate = _.nor(mut_rate,MUTATION_RATE);
				this.chromoLength = _.nor(num_bits,CHROMO_LENGTH);
				//this.geneLength = _.nor(gene_len,GENE_LENGTH);
				this.popSize = _.nor(pop_size,POP_SIZE);
				this.fittestGenome = 0;
				this.bestFitnessScore = 0;
				this.totalFitnessScore = 0;
				this.generation= 1;
				this.active = true;
				//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
				Genome.width= _.nor(gene_len,GENE_LENGTH);
				this.genomes = _.fill(this.popSize,null);
				for(let i=0; i<this.popSize; ++i)
					this.genomes[i]= new Genome(this.chromoLength);
			}
			showPopulation(){
				for(let i=0; i<this.popSize; ++i)
					console.log(`${this.genomes[i].bits.toString()}`);
			}
			cycle(){
				if(this.active){
					let out=updateFitnessScores(this.genomes);
					this.fittestGenome = out.fittestGenome;
					this.bestFitnessScore = out.bestFitnessScore;
					this.totalFitnessScore = out.totalFitnessScore;
					if(this.bestFitnessScore==1){
						//found!
						this.active=false;
					}else{
						nextGen(this.genomes,
										this.crossOverRate,
										this.mutationRate,this.totalFitnessScore);
						this.generation += 1;
					}
				}
				return this;
			}
			cycleCount(){
				return this.generation;
			}
			showPath(path){
				return path.map(p=> `${DIRS[p]}`).join("-");
			}
			started(){
				return this.active
			}
			stop(){
				this.active=false
			}
			getFittestDirection(){
				return decode(this.genomes[this.fittestGenome])
			}
		}

		return {
			LEVEL,
			COLS,
			ROWS,
			GaBob,
			CROSSOVER_RATE,
			MUTATION_RATE,
			POP_SIZE,
			CHROMO_LENGTH,
			GENE_LENGTH
		}
	}

})(this);


