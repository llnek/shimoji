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
  window["io/czlab/sudoku/model"]=function(Mojo){

		const {Game:_G,is,ute:_}=Mojo;
		const int=Math.floor;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const DIM=9, D3=3, DIMCNT=81;
    const NUMSTR= "123456789",
          NUMS= NUMSTR.split(/(\d{1})/).filter(s=>s.length), NUMINTS=NUMS.map(n=> +n);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function randBlock(){
			return _.shuffle(_.shuffle(_.shuffle(NUMINTS.slice())))
    }
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function isInRow(game,y,value){
			for(let x=0,r= game[y]; x<r.length;++x) if(r[x]==value) return true;
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function isInCol(game,col,value){
			for(let y=0,z= game.length; y<z;++y) if(game[y][col]==value) return true;
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function isInBlock(game,y,x,value){
			let r= int(y/D3) *D3;
			let c= int(x/D3) *D3;
			for(let i=r;i<(r+D3);++i)
				for(let j=c;j<(c+D3);++j)
					if(game[i][j] == value) return true;
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function checkCell(game,y,x,value){
			return isInCol(game,x,value) ||
			       isInRow(game, y,value) || isInBlock(game,y,x,value)?false:true
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function findEmpty(game){
			for(let y=0;y<DIM;++y)
      for(let x=0;x<DIM;++x) if(game[y][x]==0) return true
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function gen(game){
			let x,y,nums=NUMINTS.slice();
			for(let i=0;i<DIMCNT;++i){
				y=int(i/DIM);
				x= i % DIM;
				if(game[y][x]==0){
					_.shuffle(_.shuffle(_.shuffle(nums)));
					for(let j=0;j<nums.length;++j){
						if(checkCell(game,y,x,nums[j])){
							game[y][x]=nums[j];
							if(!findEmpty(game) || gen(game)) return game;
						}
					}
					break;
				}
			}
			return game[y][x]=0;
    }

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function mkUnique(game){
			let nonEmpty= (function(out){
				for(let y=0;y<DIM;++y)
				for(let x=0;x<DIM;++x)
					if(game[y][x] != 0) out.push([y,x]);
				return out.length>2 ? _.shuffle(out) : out;
			})([]);
			let nonEmptyCnt = nonEmpty.length;
			let rounds = 3;
			while(rounds > 0 && nonEmptyCnt >= 17){
				//there should be at least 17 clues
				let res,removed,copy,
					  [y,x] = nonEmpty.pop();
				nonEmptyCnt -= 1;
				//might need to put the square value back if there is more than one solution
				removed = game[y][x];
				game[y][x]=0;
				//make a copy of the grid to solve
				copy = _.deepCopyArray(game);
				resolve(copy,res=solverCtx());
				//if there is more than one solution, put the last removed cell back into the grid
				if(res.solutions != 1){
					nonEmptyCnt += 1;
					rounds -=1;
					game[y][x]=removed;
				}
			}
			//console.log("===> " + JSON.stringify(game))
			return game;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function resolve(game,ctx){
			let x,y;
			for(let i=0;i<DIMCNT;++i){
				y= int(i/DIM);
				x= i%DIM;
				if(game[y][x]==0){
					for(let n,j=0;j<DIM;++j){
						n=NUMINTS[j];
						//check that the number hasn't been used in the row/col/subgrid
						if(checkCell(game,y,x,n)){
							game[y][x]=n;
							if(!findEmpty(game)){
								ctx.solutions+=1;
								break;
							}
							if(resolve(game,ctx)) return game;
						}
					}
					break;
				}
			}
			return game[y][x]=0;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function solverCtx(){ return {solutions: 0} }

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function blankGame(){
			return _.fill(DIM,()=> _.fill(DIM,0))
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		//can prefill diagonal blocks since no dependencies in rows or cols
		function seedBlock(game,block,seed){
			let c= (block%D3) * D3,
			    k=0, r= int(block/D3) * D3;
			for(let y=r; y<(r+3); ++y)
				for(let x=c; x<(c+3); ++x)
					game[y][x]=seed[k++];
		}
		function seedGame(){
			let s= [randBlock(), randBlock(), randBlock()];
			let d= _.randSign()>0?[0,4,8]:[2,4,6]; d=[2,4,6];
			let g= blankGame();
			d.forEach((b,i) => seedBlock(g,b,s[i]));
			return g;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function Sudoku(){
			return{
				generate(){
					return mkUnique(gen(seedGame()));
				},
				solve(game){
					return resolve(game, solverCtx()) && game;
				}
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
      sudoku(){
				return Sudoku().generate()
      }
    })

  }

})(this);


