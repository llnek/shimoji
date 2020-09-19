(function(window,undefined){
  "use strict";
  MojoH5=window.MojoH5;
  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_2d=Mojo["2d"],_I=Mojo.Input;

    _Z.defScene("level1",{
      setup:function(){
        let alien = this.alien= _S.sprite("alien.png");
        this.insert(alien);
        _S.putCenter(this,alien, -Mojo.canvas.width / 4);
        let monster = this.monster= _S.sprite([ "images/monsterNormal.png", "images/monsterAngry.png" ]);
        this.insert(monster);
        //Define the monster's two states: `normal` and `scared`
        //`0` and `1` refer to the monster's two animation frames
        monster.states = { normal: 0, angry: 1 };
        _S.putCenter(this,monster, Mojo.canvas.width / 4);
        //Create the boxes
        let boxes = this.boxes= [];
        let numberOfboxes = 4;
        for (let s,i = 0; i < numberOfboxes; ++i){
          boxes.push(s=_S.sprite("box.png"));
          this.insert(s);
        }
        _S.putCenter(this,boxes[0], -32, -64);
        _S.putCenter(this,boxes[1], 32, -64);
        _S.putCenter(this,boxes[2], -32)
        _S.putCenter(this,boxes[3], 32);
        //Switch on drag-and-drop for all the sprites
        _I.makeDraggable(alien);
        _I.makeDraggable(monster);
        boxes.forEach(b => {
          _I.makeDraggable(b);
        });
        //Create a `line` sprite.
        //`line` arguments:
        //strokeStyle, lineWidth, ax, ay, bx, by
        //`ax` and `ay` define the line's start x/y point,
        //`bx`, `by` define the line's end x/y point.
        let line = this.line= _S.line("red", 4,_S.centerXY(monster),_S.centerXY(alien));
        this.insert(line);
        //Set the line's alpha to 0.3
        line.alpha = 0.3
        let message = this.message= _S.text("Drag and drop the sprites",
          {fontFamily: "Futura", fontSize:16, fill:"black"}, 30,10);
        this.insert(message);
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        let m= _S.centerXY(this.monster);
        let a= _S.centerXY(this.alien);
        //Update the position of the line
        this.line.mojoh5.ptA(m.x, m.y);
        this.line.mojoh5.ptB(a.x, a.y);
        //Check whether the monster can see the alien by setting its
        //`lineOfSight` property. `lineOfSight` will be `true` if there
        //are no boxes obscuring the view, and `false` if there are
        let lineOfSight = _S.lineOfSight( this.monster, this.alien, this.boxes, 16);
        //If the monster has line of sight, set its state to "angry" and
        if(lineOfSight){
          this.monster.mojoh5.show(this.monster.states.angry);
          this.line.alpha = 1;
        }else{
          this.monster.mojoh5.show(this.monster.states.normal);
          this.line.alpha = 0.3;
        }
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    assetFiles: [ "box.png","alien.png", "monsterNormal.png", "monsterAngry.png" ],
    arena: {width:704, height:512},
    scaleToWindow:true,
    start: setup
  };
})(this);



