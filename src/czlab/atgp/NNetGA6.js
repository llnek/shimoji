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
		const ROTATE_LEFT=0,
          ROTATE_RIGHT=1,
			    THRUST_UP=2,
          NONE=3;
		const MAX_ACTION_DURATION= 5;
		const MAX_MUTATION_DURATION=3;
		const DIST_TOLERANCE= 4;
	  const SPEED_TOLERANCE= 4;
	  const ROTATION_TOLERANCE= 0.1;
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SGene(){
			return{
				action: _.randInt2(0,3),
				duration: _.randInt2(1, MAX_ACTION_DURATION),
				equals(other){
					return this.action==other.action && this.duration==other.duration
				}
			}
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function SGenome(numActions){
			return{
				fitness:0,
				vecActions: _.fill(numActions,()=> SGene())
			}
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function mutate(actions,mRate){
			for(let m2=mRate/2, g,i=0;i<actions.length;++i){
				g=actions[i];
				if(_.rand()<mRate){
					g.action= _.randInt2(0,3);
				}
				if(_.rand()<m2){
					g.duration += _.randMinus1To1()*MAX_MUTATION_DURATION;
					if(g.duration<0){
						g.duration=0;
					}else if(g.duration>MAX_ACTION_DURATION){
						g.duration= MAX_ACTION_DURATION;
					}
				}
			}
			return actions;
		}
		//;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
		function calcFitness(generation){
			let distFromPad = Math.abs(_G.pad.x - _G.player.x);
			let distFit = Mojo.width -distFromPad;
			let speed = Math.sqrt(_G.player.m5.vel[0]* _G.player.m5.vel[0],
                            _G.player.m5.vel[1]* _G.player.m5.vel[1]);
			let rotFit = 1/(Math.abs(_G.player.rotation)+1);
			//fitness due to time in air
			let fitAirTime = _G.tickCount/(speed+1);
			let fitness= distFit + Mojo.width*rotFit + (Mojo.width/100)*fitAirTime;
			//check if we have a successful landing
			if(distFromPad < DIST_TOLERANCE &&
			   speed < SPEED_TOLERANCE &&
				 Math.abs(_G.player.rotation) < ROTATION_TOLERANCE){
				fitness=Infinity;
			}
			return fitness;
		}



		return{
			ROTATE_LEFT,
			ROTATE_RIGHT,
			THRUST_UP,
			NONE
		}

	}



})(this)


