var GridScanBar = cc.Node.extend({
	grid : null,
	onScan : null,
	barSprite : null,
	speed : 2,
	motion : null,
	cooldown : 1,

	ctor : function(grid, onScan) {
		this._super();

		this.grid = grid;
		this.onScan = onScan;

		this.init();
	},

	init : function() {
		this.barSprite = new cc.Sprite('#block_1.png');
		this.barSprite.setScale(7, 1);
		this.barSprite.setOpacity(100);
		this.addChild(this.barSprite);

		var spacing = this.grid[1][0].y - this.grid[0][0].y;
		var center = (GridManager.gridSize.x * spacing) / 2 - spacing / 2;
		var playableRows = GridManager.gridSize.y;
		// One row higher than the topmost, off-screen
		var startPos = cc.p(center, this.grid[playableRows - 1][0].y + spacing);
		this.setPosition(startPos);

		var actionList = [];
		var easing = cc.easeSineOut();
		var moveTo = null;

		// Scan bar will move from top to down, invoking the callback at every step
		for (var i = playableRows - 1; i >= 0; i--) {
			// Move to next row
			moveTo = cc.moveTo(1 / this.speed, cc.p(center, this.grid[i][0].y));
			moveTo.easing(easing);
			actionList.push(moveTo);
			// Invoke the match function for that row
			actionList.push(cc.callFunc(this.createCallFunc(i)));
		}

		// Have the scan bar move one step further, off-screen
		moveTo = cc.moveTo(1 / this.speed, cc.p(center, this.grid[0][0].y - spacing));
		moveTo.easing(easing);
		actionList.push(moveTo);
		// Put the scan bar back at its start position at the top
		actionList.push(cc.callFunc(() => this.setPosition(startPos)));

		this.motion = cc.repeatForever(cc.sequence(actionList));
	},

	onEnter : function() {
		this._super();

		this.runAction(this.motion);
	},

	// Ugly workaround to circumvent loop variable in a closure problem
	// More details at:
	// http://stackoverflow.com/questions/750486/javascript-closure-inside-loops-simple-practical-example
	createCallFunc : function(i) {
		return () => this.onScan(i);
	},

	doPause : function() {
		this.pause();
	},

	doResume : function() {
		this.resume();
	},

	// TODO Implement speed change

	onExit : function() {
		this._super();
	}
});