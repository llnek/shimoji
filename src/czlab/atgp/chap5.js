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
    const MUTATION_RATE = 0.2;

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function ChooseSection(maxSpan, minSpan){
      return [ _.randInt2(0, maxSpan-minSpan),
               _.randInt2(minSpan + beg, maxSpan)]
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function MutateSM(chromo){
      let minSpanSize = 3,
          [beg, end] = ChooseSection(chromo.length - 1, minSpanSize);
      let span = end - beg,
          p1,p2,numberOfSwapsRqd = span - 1;
      while(numberOfSwapsRqd != 0){
        p1 = beg + _.randInt(span);
        p2 = beg + _.randInt(span);
        [chromo[p1], chromo[p2]] = [chromo[p2], chromo[p1]];
        numberOfSwapsRqd -= 1;
      }
      return chromo;
    }

    function MutateDM(chromo){
      let minSpanSize = 3
          [beg, end]= ChooseSection(chromo.length - 1, minSpanSize);
      let theSection = chromo.slice(beg,end),
          theLeft = chromo.slice(0,beg) + chromo.slice(end),
          randPos = _.randInt(theLeft.length - 1);
      return theLeft.slice(0,randPos).concat(theSection).concat(theLeft.slice(randPos))
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function MutateIM(chromo){
      let selectedPos = _.randInt(chromo.length - 1),
          selectedGen = [chromo[selectedPos]],
          newChromo = chromo.slice(0,selectedPos).concat( chromo.slice(selectedPos + 1)),
          newPos = _.randInt(newChromo.length);
      return newChromo.slice(0,newPos).concat(selectedGen).concat( newChromo.slice(newPos));
    }

    function MutateRM(chromo){
      let minSpanSize = 3,
          [beg, end] = ChooseSection(chromo.length - 1, minSpanSize),
          theSection = chromo.slice(beg,end).reverse();
      return chromo.slice(0,beg).concat(theSection).concat(chromo.slice(end));
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function MutateRDM(chromo){
      let minSpanSize = 3,
          [beg, end] = ChooseSection(chromo.length - 1, minSpanSize),
          theSection = chromo.slice(beg,end).reverse(),
          theLeft = chromo.slice(0,beg).concat( chromo.slice(end)),
          randPos = _.randInt(theLeft.length - 1);

      return theLeft.slice(0,randPos).concat(theSection).concat(theLeft.slice(randPos));
    }

    //#print MutateRDM([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])
    //#for i in xrange(100000):
	      //#MutateRDM([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15])

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CrossoverOBX(mum, dad){
      let baby1 = mum.slice();
      let baby2 = dad.slice();
      let tempGens  = [];
      let positions = [];
      let pos = _.randInt(mum.length - 2);
      ////////
      while(pos < mum.length){
        positions.push(pos);
        tempGens.push(mum[pos]);
        pos += _.randInt2(1, mum.length-pos);
      }
      //print "Pos :", Positions
      //print "City:", tempGens
      let cpos = 0;
      for(let i=0;i<baby2.length;++i)
        for(let i2=0;i2<tempGens.length;++i2){
          if(baby2[i]== tempGens[i2]){
            //#print "idx: ", idx, "city before:", baby2[idx], "city after:", tempGens[cPos]
            baby2[i] = tempGens[cpos];
            cpos += 1;
            break;
          }
        }
      tempGens = [];
      for(let i=0;i<positions.length;++i){
        tempGens.push(dad[positions[i]])
      }
      cpos = 0;
      for(let i=0;i<baby1.length;++i)
        for(let i2=0;i2<tempGens.length;++i2){
          if(baby1[i]== tempGens[i2]){
            baby1[i] = tempGens[cpos];
            cpos += 1;
            break;
          }
        }

      return [baby1, baby2];
    }

    //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    function CrossoverPBX(mum, dad){
      let positions = [],
          tempGens  = [],
          pos = _.randInt(mum.length - 2);
      //
      while(pos < mum.length){
        positions.push(pos);
        tempGens.push(mum[pos]);
        pos += _.randInt2(1, mum.length-pos);
      }
      //#print Positions, tempGens
      let baby1 = [];
      for(let i=0;i<dad.length;++i){
        if(positions.indexOf(i)>=0)
          baby1.push(mum[i]);
        if(tempGens.indexOf(dad[i])<0)
          baby1.push(dad[i]);
      }
      let baby2 = [];
      tempGens = [];
      for(let i=0;i<positions.length;++i)
        tempGens.push(dad[positions[i]]);

      for(let i=0;i<mum.length;++i){
        if(positions.indexOf(i)>=0)
          baby2.push(dad[i]);
        if(tempGens.indexOf(mum[i])<0)
          baby2.push(mum[i]);
      }

      return [baby1, baby2];
    }

  }

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //game config
  const _$={
    //assetFiles: ["wall.png","ground.png","green.png","water.png"],
    arena: {width: 1680, height: 1050},
    scaleToWindow:"max",
    scaleFit:"y",
    start(Mojo){
      //scenes(Mojo);
      //Mojo.Scenes.runScene("Splash");
    }
  };

  //;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
  //load and run
  window.addEventListener("load",()=> MojoH5(_$));

})(this);


