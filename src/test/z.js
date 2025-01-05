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
 * Copyright © 2025, Kenneth Leung. All rights reserved. */


;(function(window,UNDEF){

  "use strict";

  const Application=PIXI.Application;
  const Sprite=PIXI.Sprite;
  const Assets=PIXI.Assets;
/*
  let renderer;
  (async()=>{
    renderer = await PIXI.autoDetectRenderer({
      width: 800,
      height: 600,
      webgpu:{
        antialias: true,
        backgroundColor: 'red'
      },
      webgl:{
        antialias: true,
        backgroundColor: 'green'
      }
    });

    document.body.appendChild(renderer.canvas);
      const texture = await Assets.load('bunny.png');
    const bunny = new Sprite(texture);
    const stage=new PIXI.Container();
    bunny.x = renderer.width / 2;
    bunny.y = renderer.height / 2;
    bunny.anchor.x = 0.5;
    bunny.anchor.y = 0.5;
    stage.addChild(bunny);
    const ticker=PIXI.Ticker.shared;

    const runit = (time) => {
      ticker.update(time);
      bunny.rotation += 0.01;
      renderer.render(stage);
      requestAnimationFrame(runit);
    };
    runit(performance.now());
  })();

*/

  function scenes(Mojo){

  }

  window.addEventListener("load",()=>{
    MojoH5({
      assetFiles: [//"bounce.mp3","click.mp3", "boot/doki.fnt","boot/doki.png",
        {family:"Big Shout Bob", url:"boot/Big Shout Bob.ttf"},
        "tropical-sunrise.webp",
          "maze.png","maze.json","man_up.png","man_down.png","man_right.png", "man_left.png"],
      arena: {width:640, height:640},
      scaleToWindow:"max",
      start(Mojo){ scenes(Mojo) }

    })
  });



})(this);


