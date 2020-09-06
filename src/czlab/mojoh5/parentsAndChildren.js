(function(window,undefined){
  "use strict";
  const MojoH5=window.MojoH5;
  function scenes(Mojo){
    const _Z=Mojo.Scenes,_S=Mojo.Sprites,_I=Mojo.Input,_2d=Mojo["2d"];

    _Z.defScene("level1",{
      setup:function(){
        //Make a square and position it
        let square = this.square =_S.rectangle(256, 256, "lightblue", "black", 1);
        //Set the square's pivot point to its center, so that it will rotate
        //around its center.
        //IMPORTANT: Shifting the pivot point doesn't move the position of
        //the sprite, but it does shift its x/y origin point. The x/y point of the
        //square will now be at its center.
        square.anchor.set(0.5, 0.5);
        this.insert(square);
        //Use the stage's `putCenter` method to put the square
        //in the center of the stage. You can also use `putTop`,
        //`putRight`, `putBottom` and `putLeft`. If you want to offset
        //the position, use x and y offset values as the second and third
        //arguments: `sprite.putTop(anySprite, -10, -5)`
        _S.putCenter(this,square);
        //Add a drop shadow filter to the square
        let shadow = new Mojo.p.Filters.DropShadowFilter();
        shadow.alpha = 0.4;
        shadow.blur = 6;
        shadow.distance = 8;

        square.filters = [shadow];

        //Make the cat sprite
        let cat = this.cat= _S.sprite("cat.png");
        this.insert(cat);

        //Control the cat with the keyboard
        _I.arrowControl(cat, 5);

        //Make a star sprite and add it as a child of the cat.
        //Set the star's pivot point to 0.5 so that it will rotate around
        //its center
        let star = this.star= _S.sprite("star.png");
        star.anchor.set(0.5, 0.5);
        this.insert(star);

        //Add the star to the cat and position it to the right of the cat
        cat.addChild(star);
        _S.putRight(cat,star);

        //Add the cat as a child of the square, and put it at the bottom of
        //the square
        square.addChild(cat);
        _S.putBottom(square,cat, 0, -cat.height);

        //Create some text that we'll use to display the cat's local position
        let localMessage =
          this.localMessage=
          _S.text("Test", {fontFamily: "Futura",fontSize:14,fill:"black"});

        this.insert(localMessage);
        //Add the text as a child of the square
        square.addChild(localMessage);

        //Use the text's local `x` and local `y` values to set its top left
        //corner position relative to the square's top left corner. Because
        //the square's pivot point was set to its center, its x/y origin
        //point has also been moved to it's center. That means if you want
        //to position something at the square's top left corner you need to
        //subtract half the square's width and height.
        let sz=_S.halfSize(square);
        localMessage.x = -sz.x + 6;
        localMessage.y = -sz.y + 2;

        //Add an `angle` property to the star that we'll use to
        //help make the star rotate around the cat
        star.angle = 0;

        //Create some text that will display the cat's global position
        let globalMessage =
          this.globalMessage=
          _S.text("This is some text to start",
            {fontSize:14, fontFamily:"Futura", fill:"black"});
        this.insert(globalMessage);
        globalMessage.x = 6;
        globalMessage.y = Mojo.canvas.height - globalMessage.height - 4;


        //Add some text to display the side on which
        //the cat is colliding with the edges of the square
        let collisionMessage =
          this.collisionMessage=
          _S.text("Use the arrow keys to move...",
            {fontSize:16,fontFamily:"Futura",fill:"black"}, 4);
        this.insert(collisionMessage);

        //If you change the square's `alpha`, the child sprites inside it will
        //be similarly affected
        //square.alpha = 0.2;
        Mojo.EventBus.sub(["post.update",this],"postUpdate");
      },
      postUpdate:function(){
        //Move the cat
        _S.move(this.cat);
        //You can also move a sprite the good old-fashioned way
        //cat.x += cat.vx;
        //cat.y += cat.vy;
        //Rotate the square
        this.square.rotation += 0.0005;

        //Display the cat's local `x` and local `y` coordinates. These are
        //relative to the square's center point. (The square is the cat's
        //parent.) If we hadn't changed the square's pivot point, the cat's
        //x and y values would have been relative to the square's top left corner
        this.localMessage.mojoh5.content(
          `Local position: cat.x: ${Math.round(this.cat.x)}, cat.y: ${Math.round(this.cat.y)}`);

        //Display the cat's global `gx` and global `gy` coordinates. These are
        //relative to the `stage`, which is the root container for all the
        //sprites and groups.
        let cg=_S.gposXY(this.cat);
        this.globalMessage.mojoh5.content(
          `Global position: cat.gx: ${Math.round(cg.x)}, cat.gy: ${Math.round(cg.y)}`);

        //Contain the cat inside the square's boundary
        let catHitsEdges = _2d.contain(this.cat, this.square);

        //Display the edge of the canvas that the cat hit
        if(catHitsEdges){
          //Find the collision side
          let collisionSide = "";
          if(catHitsEdges.has(Mojo.LEFT)) collisionSide = "left";
          if(catHitsEdges.has(Mojo.RIGHT)) collisionSide = "right";
          if(catHitsEdges.has(Mojo.TOP)) collisionSide = "top";
          if(catHitsEdges.has(Mojo.BOTTOM)) collisionSide = "bottom";

          //Display it
          collisionMessage.mojoh5.content(
            `The cat hit the ${collisionSide} of the square`);
        }
        //Make the star rotate
        this.star.rotation += 0.2;

        //Update the star's angle
        this.star.angle += 0.05;

        //The `rotateAroundSprite` method lets you rotate a sprite around
        //another sprite. The first argument is the sprite you want to
        //rotate, and the second argument is the sprite around which it
        //should rotate. The third argument is the distance
        _S.rotateAroundSprite(this.star, this.cat, 64, this.star.angle);

        //if you want the rotation to happen around a point that's offset
        //from the center of the sprite, change the center sprite's x and y pivot values
        //to point that you need
      }
    });
  }
  function setup(Mojo){
    scenes(Mojo);
    Mojo.Scenes.runScene("level1");
  }
  MojoH5.Config={
    assetFiles: [ "cat.png", "star.png" ],
    arena: {width:512, height:512},
    start: setup,
    scaleToWindow:true
  };
})(this);



