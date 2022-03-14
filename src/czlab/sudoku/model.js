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

;(function(window,UNDEF){

  "use strict";

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  window["io/czlab/sudoku/model"]=function(Mojo){

		const {math:_M,Game:_G,is,ute:_}=Mojo;
		const int=Math.floor;

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    const DIM=9, D3=3, DIMCNT=81;
    const NUMSTR= "123456789",
			NUMS= NUMSTR.split(/(\d{1})/).filter(s=>s.length), NUMINTS=NUMS.map(n=> +n);

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const randBlock=()=> _.shuffle(_.shuffle(_.shuffle(NUMINTS.slice())));

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
			let r= _M.ndiv(y,D3) *D3;
			let c= _M.ndiv(x,D3) *D3;
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
		function countEmpty(game){
			let sum=0;
			for(let y=0;y<DIM;++y)
      for(let x=0;x<DIM;++x) if(game[y][x]==0) ++sum;
			return sum;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function gen(game){
			let x,y,nums=NUMINTS.slice();
			for(let i=0;i<DIMCNT;++i){
				y=_M.ndiv(i,DIM);
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
		function reduction(game, rounds=3){
			//Mojo.CON.log("reduction rounds = "+rounds);
			let nonEmpty= (function(out){
				for(let y=0;y<DIM;++y)
				for(let x=0;x<DIM;++x)
					if(game[y][x] != 0) out.push([y,x]);
				return out.length>2 ? _.shuffle(out) : out;
			})([]);
			let res,nonEmptyCnt = nonEmpty.length;
			while(rounds > 0 && nonEmptyCnt >= 17){
				//there should be at least 17 clues
				let removed,copy,
						[y,x] = nonEmpty.pop();
				nonEmptyCnt -= 1;
				//might need to put the square value back if there is more than one solution
				removed = game[y][x];
				game[y][x]=0;
				//make a copy of the grid to solve
				copy = _.deepCopyArray(game);
				resolve(copy,res=solverCtx());
				//console.log(`orund=${rounds}, solns=${res.solutions}, cnt=${nonEmptyCnt}`);
				//if there is more than one solution, put the last removed cell back into the grid
				if(res.solutions != 1){
					nonEmptyCnt += 1;
					rounds -=1;
					game[y][x]=removed;
				}
			}
			//Mojo.CON.log(`rounds= ${rounds}, nonEmptyCnt=${nonEmptyCnt}, soln= ${res.solutions}`);
			return game;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function resolve(game,ctx){
			//Mojo.CON.log("resolve: holes= " +countEmpty(game));
			let x,y;
			for(let i=0;i<DIMCNT;++i){
				y= _M.ndiv(i,DIM);
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
		const blankGame=()=> _.fill(DIM,()=> _.fill(DIM,0));

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		const solverCtx=()=> ({solutions: 0});

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		//can prefill diagonal blocks since no dependencies in rows or cols
		function seedBlock(game,block,seed){
			let c= (block%D3) * D3,
				k=0, r= _M.ndiv(block,D3) * D3;
			for(let y=r; y<(r+3); ++y)
				for(let x=c; x<(c+3); ++x)
					game[y][x]=seed[k++];
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function seedGame(){
			let s= [randBlock(), randBlock(), randBlock()];
			let d= _.randSign()>0?[0,4,8]:[2,4,6]; d=[2,4,6];
			let g= blankGame();
			d.forEach((b,i) => seedBlock(g,b,s[i]));
			return g;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function validateBlock(game,block){
			let r= _M.ndiv(block,D3) * D3;
			let c= block%D3 * D3;
			let out=[];
			for(let i=r;i<(r+D3);++i)
				for(let j=c;j<(c+D3);++j) out.push(game[i][j]);
			return out.sort().join("")==NUMSTR;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function checkDone(game){
			_.assert(game.length==DIM,"Bad game");
			_.assert(game[0].length==DIM, "Bad game");
			for(let y=0;y<DIM;++y){
				if(game[y].slice().sort().join("") != NUMSTR) return false;
			}
			for(let out=[],x=0;x<DIM;++x){
				out.length=0;
				for(let y=0;y<DIM;++y) out.push(game[y][x]);
				if(out.sort().join("") != NUMSTR) return false;
			}
			for(let i=0;i<DIM;++i){
				if(!validateBlock(game,i)) return false;
			}
			return true;
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function Sudoku(){
			return{
				generate(level){
					return reduction(gen(seedGame()), level<0?1:(level>0?6:3))
				},
				solve(game){
					return resolve(game, solverCtx()) && game
				},
				validate(game){
					return checkDone(game)
				},
				validateCell(game,y,x,value){
					return checkCell(game,y,x,value)
				}
			}
		}

		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    _.inject(_G,{
			Sudoku:Sudoku()
    })

  }

})(this);


