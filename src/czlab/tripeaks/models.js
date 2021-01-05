;(function(global){

  global["io.czlab.tripeaks.models"]=function(Mojo){
    const SYMBOLS = "?A23456789TJQK";
    const MAX_VALUE = 13;
    const MIN_VALUE = 1;
    const DIAMONDS=1;
    const CLUBS=2;
    const HEARTS=3;
    const SPADES=4;
    const JOKER=5;
    const _G=Mojo.Game;
    const _S=Mojo.Sprites;
    const _=Mojo.u;

    const CARD_SUITS=(function(obj){
      obj[DIAMONDS]="Diamonds";
      obj[CLUBS]="Clubs";
      obj[HEARTS]="Hearts";
      obj[SPADES]="Spades";
      return obj;
    })({});
    //const OrigCardSize=[140,190];
    //const CardSize=[48,64];
    //const CardScale=[48/140,64/190];

    class Card{
      static getSingleDeckSize(){ return 4 * MAX_VALUE }
      constructor(suit, value){
        _.assert(value >= MIN_VALUE && value <= MAX_VALUE, `Bad Value ${value}`);
        this._symbol = value===10?"10":SYMBOLS[value];
        this._value = value;
        this._suit = suit;
        this.toIcon();
      }
      toIcon(){
        let cs=CARD_SUITS[this._suit];
        if(cs){
          let s= _S.sprite(`card${cs}${this._symbol}.png`);
          let K=Mojo.contentScaleFactor();
          s.scale.x= s.scale.y=K.height;
          this._icon=s;
          _G.iconSize=[s.width,s.height];
        }
      }
      toString(){
        let s = "";
        switch(this._suit){
          case DIAMONDS:
          s = "♦";
          break;
          case CLUBS:
          s = "♣";
          break;
          case HEARTS:
          s = "♥";
          break;
          case SPADES:
          s = "♠";
          break;
          default:
          break;
        }
        return this._symbol + s;
      }
      get symbol(){return this._symbol}
      get suit(){ return this._suit}
      get value(){ return this._value }
      get icon(){return this._icon}
      hashCode(){
        return _.hashCode(`${this._suit}${this._symbol}${this._value}`);
      }
      equals(obj){
        return this===obj ||
               (obj instanceof Card) &&
               this._suit === obj.suit && this._symbol===obj.symbol && this._value === obj.value;
      }
    }
    Card.Joker=new Card(JOKER,MIN_VALUE);

    const SUITS = [DIAMONDS, CLUBS, HEARTS, SPADES];
    class PyramidSolitaire{
      constructor(scene,numPeaks){
        this.numPeaks=numPeaks;
        this.scene=scene;
        // for draw cards
        this.stockPile=[];
        this.drawer=[];
        // for the game board
        this.boardWidths=[];//ints
        this.board=[];//[][]
        // useful for debugging
        this.cardsDisplayed=0;
      }
      /**
       * Ensure cards in the deck are kosher.
       * @param input
       * @return
       */
      checkInputDeckIntegrity(deck){}
      /**
       * Initial internal data structures for the model.
       * @param deck
       * @param numRows
       */
      initBoard(deck, numRows){
        this.allocateModel(numRows, numRows* this.numPeaks);
        const overlap= _.floor(Math.ceil(numRows * 0.5));
        const shift= numRows-overlap;
        const lastPeak=this.numPeaks-1;
        let left= 0;
        //console.log("initBoard, overlap=" + overlap + ", delta="+ delta);
        for(let p=0; p < this.numPeaks; ++p){
          if(p>0){ left += shift }
          this.initPeak(left,numRows,deck,p===lastPeak);
        }
      }
      getCards(row){
        return this.validRow(row) ? this.board[row] : null;
      }
      checkDrawPos(drawIndex){
        return this.drawer && drawIndex >= 0 && drawIndex < this.drawer.length;
      }
      setDrawCard(i, c){ this.drawer[i]= c }
      getDrawCard(i){ return this.drawer[i] }
      delDrawAt(i){ this.drawer[i]=null }
      setRowWidth(row, w){
        this.boardWidths[row]=w;
        console.log("row [" + row + "]#width = " + w);
      }
      allocateModel(rows, cols){
        this.board=[];
        for(let r=0;r<rows;++r)
          this.board[r]=new Array(cols);
        this.boardWidths= _.fill(new Array(rows),0);
      }
      checkCoordinate(row, card){
        return this.validRow(row) && this.validCol(card);
      }
      validCol(c){
        return this.board && this.board[0]  && c >= 0 && c < this.board[0].length;
      }
      validRow(r){
        return this.board && r >= 0 && r < this.board.length;
      }
      lastRowIndex(){
        return this.board ? this.board.length-1 : -1;
      }
      getRowWidth(row){
        return (this.boardWidths && this.validRow(row)) ? this.boardWidths[row] : -1;
      }
      assertState(cond, msg){
        if(!cond)
          throw new Error(msg);
      }
      assertArg(cond, msg){
        if(!cond)
          throw new Error(msg);
      }
      getCardSet(){
        return new Set(getSingleDeck());
      }
      checkRule2(a, b){
        return a && b && (a.value + b.value) === MAX_VALUE;
      }
      checkRule1(a){
        return a && a.value === MAX_VALUE;
      }
      delCardAt(row, card){
        if(this.board)
          this.board[row][card] = null;
      }
      setCardAt(row, card, c){
        if(this.board){
          this.board[row][card] = c;
        }
      }
      getSingleDeck(){
        let deck = [];
        for(let k=0; k<SUITS.length; ++k){
          for(let i=MIN_VALUE; i<=MAX_VALUE; ++i){
            deck.push(new Card(SUITS[k], i));
          }
        }
        return deck;
      }
      initPeak(left, size, input, calcRowWidth){
        for(let rmost,i=0; i<size; ++i){
          rmost=left+i;
          for(let c,j=left; j<=rmost; ++j){
            c=this.getCardAt(i,j);
            if(c){ continue} // card overlapped
            c= input.length===0 ? null : input.shift();
            //TODO: check if we should throw illegalstate or illegalarg,
            //assignment is very vague on this.
            this.assertArg(c, "Invalid deck.");
            this.setCardAt(i,j, c);
          }
          if(calcRowWidth)
            this.setRowWidth(i, rmost+1);
        }
      }
      startGame(deck1, numRows, numDraw){
        // pre-conditions
        this.assertArg(numRows >= 0, "Rows in pyramid < 0.");
        this.assertArg(numDraw >= 0, "Draw cards < 0.");
        this.assertArg(deck1, "Deck is null.");
        let deck=_.shuffle(deck1);
        // numRows > 0 means we can possibly have a valid game, so
        // lets check the deck
        if(numRows>0)
          this.assertArg(this.checkInputDeckIntegrity(deck), "Incorrect deck");
        let origDeckSize= deck.length;
        this.initBoard(deck, numRows);

        // what remains goes to the stockPile
        this.drawer = new Array(numDraw);
        this.stockPile = deck;

        //keep track of how many cards actually displayed, for debugging
        this.cardsDisplayed=origDeckSize - deck.length;
        //console.log("we used " + cardsDisplayed + " for the pyramid(s).");

        // initialize draw cards
        for(let i=0; i<this.drawer.length; ++i){
          if(this.stockPile.length>0)
            this.setDrawCard(i, this.stockPile.shift());
        }
        //console.log("game started - ok.");
        // force a game over test
        //int sz=deck.size() - 2; for (int i=0; i < sz; ++i) { deck.remove(0); }
      }
      isPyramidEmpty(){
        for(let r,i=0; i<this.getNumRows(); ++i){
          r=this.getCards(i);
          for(let j=0; j<r.length; ++j){
            if(r[j])
              return false;
          }
        }
        return true;
      }
      remove2(row1, card1, row2, card2){
        this.assertArg(this.checkCoordinate(row1, card1), "Invalid card position.");
        this.assertArg(this.checkCoordinate(row2, card2), "Invalid card position.");
        this.assertArg(!(row1 == row2 && card1 == card2), "Can't choose same card.");
        //check if the cards are exposed
        if(this.isCardExposed(row1, card1) && this.isCardExposed(row2, card2)){
          let c1 = this.getCardAt(row1,card1);
          let c2 = this.getCardAt(row2,card2);
          if(this.checkRule(c1,c2)){
            //console.log("move ok");
            this.delCardAt(row1,card1);
            this.delCardAt(row2,card2);
            return;
          }
        }
        this.assertArg(false, "Bad move");
      }
      remove1(row, card){
        this.assertArg(checkCoordinate(row, card), "Invalid card position.");
        if(this.isCardExposed(row, card)){
          let c = this.getCardAt(row,card);
          if(this.checkRule(c)){
            //console.log("move ok");
            this.delCardAt(row,card);
            return;
          }
        }
        this.assertArg(false, "Bad move");
      }
      isCardExposed(row, card){
        if(this.checkCoordinate(row,card) && this.someCardAt(row,card)){
          let below = row + 1;
          let left = card;
          let right = card + 1;
          //last row is always exposed, quick exit
          return row === this.lastRowIndex() ||
                 (this.checkCoordinate(below,right) && this.noCardAt(below,left) && this.noCardAt(below,right));
        }
        return false;
      }
      removeUsingDraw(drawIndex, row, card){
        this.assertArg(this.checkCoordinate(row, card), "Invalid card position.");
        this.assertArg(this.checkDrawPos(drawIndex), "Invalid draw position.");
        let d = this.getDrawCard(drawIndex);
        this.assertArg(d, "Bad draw index " + drawIndex);
        if(this.isCardExposed(row, card)){
          let c = this.getCardAt(row,card);
          if(this.checkRule(c,d)){
            //console.log("move ok");
            this.delCardAt(row,card);
            this.discardDraw(drawIndex);
            return;
          }
        }
        this.assertArg(false, "Bad draw move");
      }
      discardDraw(drawIndex){
        this.assertArg(this.checkDrawPos(drawIndex), "Invalid draw position.");
        this.delDrawAt(drawIndex);
        if(this.stockPile.length>0)
          this.setDrawCard(drawIndex, this.stockPile.shift());
      }
      getNumRows(){
        // how many rows in the pyramid
        return !this.board ? -1 : this.board.length;
      }
      getNumDraw(){
        // how many draw cards
        return !this.drawer ? -1 : this.drawer.length;
      }
      isGameOver(){
        this.assertState(this.board, "Game is not running.");
        // game is over if all cards are gone in the pyramid, or
        // game can't continue - stuck
        return this.isPyramidEmpty() || this.isGameStuck();
      }
      getExposed(){
        let remains = [];
        for(let r,i=0; i<this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let j=0; j<r.length; ++j){
            if(this.isCardExposed(i, j))
              remains.push(r[j]);
          }
        }
        return remains;
      }
      isGameStuck(){
        // if stockPile is not empty, then game can always continue
        if(this.stockPile.length>0){ return false }
        // get all exposed cards and then check them
        let remains=this.getExposed();
        if(remains.length===0){
          // note: this should never happen actually
          // no cards to play with, can't continue
          return true;
        }
        // look for kings
        for(let c,i=0;i<remains.length;++i){
          c=remains[i];
          if(this.checkRule1(c)){
            // king exposed, so game can continue
            return false;
          }
        }
        // collect all cards and see any valid combos
        this.getDrawCards().forEach(c=>remains.push(c));
        // scan...
        let cards = remains;
        for(let ci,i=0; i<cards.length; ++i){
          ci = cards[i];
          for(let cj,j = i+1; j<cards.length; ++j){
            cj = cards[j];
            if(this.checkRule2(ci, cj)){
              // combo found, so not stuck
              return false;
            }
          }
        }
        return true;
      }
      getScore(){
        this.assertState(this.board, "Game is not running.");
        let score = 0;
        for(let r, i = 0; i < this.getNumRows(); ++i){
          r = this.getCards(i);
          for(let c, j = 0; j < r.length; ++j){
            c = r[j];
            if(c)
              score += c.value;
          }
        }
        return score;
      }
      someCardAt(row, card){
        return !!this.getCardAt(row, card);
      }
      noCardAt(row, card){
        return !this.someCardAt(row, card);
      }
      getCardAt(row, card){
        this.assertState(this.board, "Game is not running.");
        this.assertArg(this.checkCoordinate(row, card), "Invalid card position.");
        return this.board[row][card];
      }
      getDrawCards(){
        this.assertState(this.board, "Game is not running.");
        // the assignment is vague here. E.g.  if we have 3 draw cards defined,
        // but the
        // actual draw cards remaining is like =>  K Blank Q,
        // should we return K,Q or K,null,Q ??????
        // for now, we return what we see => K,null,Q
        let result = [];
        for(let c,i = 0; i < this.drawer.length; ++i){
          c = this.drawer[i];
          result.push(c);
        }
        return result;
      }
    }

    class BasicPyramidSolitaire extends PyramidSolitaire{
      constructor(scene) {
        super(scene,1);
      }
      checkInputDeckIntegrity(input){
        return true;
      }
      getDeck(){
        return this.getSingleDeck();
      }
    }

    class TriPeakPyramidSolitaire extends PyramidSolitaire{
      constructor(scene){
        super(scene,3);
      }
      checkInputDeckIntegrity(input){
        return true;
      }
      getDeck(){
        //want 2 decks
        return this.getSingleDeck().concat(this.getSingleDeck());
      }
    }

    _.inject(_G,{
      Card:Card,
      BasicPyramidSolitaire:BasicPyramidSolitaire,
      TriPeakPyramidSolitaire:TriPeakPyramidSolitaire
    });

  };

})(this);

