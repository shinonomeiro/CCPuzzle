var GridManager = cc.Node.extend({
	gridGen : null,
	grid : null,
	scanBar : null,
	spacing : null,
	shiftTime : 0,

	marginTop : 0,
	marginBottom : 0,

	zOff: {
		blocks : 1,
		scanBar : 2
	},

	opQueue : [],
	isBusy : false,

	ctor : function() {
		this._super();

		this.init();
	},

	init : function() {
		var frame = cc.spriteFrameCache.getSpriteFrame('block_0.png');
		this.spacing = frame.getOriginalSize().width;
		frame = null;

		var winSize = cc.director.getWinSize();
		var gridSize = GridManager.gridSize;
		var marginLR = winSize.width - (gridSize.x * this.spacing);
		// Align the grid to the center of the view
		// Memo: Grid anchor is located at the center of the left-bottom-most block
		this.setPosition((marginLR / 2) + (this.spacing / 2), 0);

		this.gridGen = new GridGen();

		this.grid = this.gridGen.make(
			gridSize.y + gridSize.y_hidden,
			gridSize.x
		);

		// TEMP
		this.marginTop = this.spacing / 4;
		this.marginBottom = winSize.height / 8.5;

		this.initialRender();

		this.scanBar = new GridScanBar(this.grid, this.processRow.bind(this));
		this.addChild(this.scanBar, this.zOff.scanBar);

		// BLOCK EVENTS

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'bomb',
			callback : (e) => {
				var sourceBlock = e.getUserData();
				this.processBomb(sourceBlock);
			}
		}, this);

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'rainbow',
			callback : (e) => {
				var data = e.getUserData();
				this.processRainbow(data.sourceBlock, data.colorId);
			}
		}, this);

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'heal',
			callback : (e) => {
				var sourceBlock = e.getUserData();
				this.processHeal(sourceBlock);
			}
		}, this);
	},

	onEnter : function() {
		this._super();

		this.scheduleUpdate();
	},

	// Render the grid on screen
	initialRender : function() {
		for (var y = 0; y < GridManager.gridSize.y + GridManager.gridSize.y_hidden; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {

				// Create a small gap between uppermost playable and stock rows
				var pos = y >= GridManager.gridSize.y 
					? cc.p(x * this.spacing, (y * this.spacing) + this.marginTop)
					: cc.p(x * this.spacing, y * this.spacing);

				var slot = this.grid[y][x];
				slot.setPosition(pos.x, this.marginBottom + pos.y);
				slot.gridPos = { y : y, x : x };

				// Align block with slot
				var block = slot.block;
				block.setPosition(pos.x, this.marginBottom + pos.y);
				this.addChild(block, this.zOff.blocks);
			}
		}
	},

	// Start item/match cycle
	processRow : function(y) {
		var arr = []
			.concat(this.grid[y])
			.map(slot => slot.block)
			.filter(block => block.priority > 0 && Block.isItem(block.typeId));

		if (arr.length > 0) {
			var item = arr.reduce((a, b) => a.priority > b.priority ? b : a);
			// A new processRow will be scheduled until no more items
			this.opQueue.push(() => item.onScan());

		} else {
			// A new processRow will be scheduled until no more matches
			this.opQueue.push(() => 
				this.parent.isFeverMode ? this.processFeverMode(y) : this.processMatches(y)
			);
		}
	},

	// Process the matches, adding effects etc.
	processMatches : function(y) {
		this.isBusy = true;
		this.scanBar.doPause();

		var matches = this.getMatches(y);
		// Discard duplicates (from T-shaped matches)
		matches = new Set(matches);

		if (matches.size > 0) {
			var effects = [];
			var effectDuration = 0;
			var collected = [];

			matches.forEach(slot => {
				var block = slot.block;
				slot.block = null;
				collected.push(block);

				block.onMatch(effects);
				var del = cc.callFunc(() => this.removeChild(block));

				var spawn = cc.spawn(effects);
				effectDuration = spawn.getDuration();
				block.runAction(cc.sequence([spawn, del]));

				effects.length = 0;
			});

			this.parent.addCombo(collected);

			var seq = this.createProcessSequence(effectDuration, y + 1, y);
			this.runAction(seq);

		} else {
			this.postProcessRow(y);
		}
	},

	// Like processMatches, but cooler!
	processFeverMode : function(y) {
		this.isBusy = true;
		this.scanBar.doPause();

		var _matches = this.getMatches(y);
		// Discard duplicates (from T-shaped matches)
		var matches = new Set(matches);

		var getSlot = (y, x) => {
			if (y < 0 ||
				y >= GridManager.gridSize.y ||
				x < 0 ||
				x >= GridManager.gridSize.x) {

				// Out of bounds
				return;
			}

			matches.add(this.grid[y][x]);
		}

		for (var i = 0; i < _matches.length; i++) {
			var coord = _matches[i].gridPos;

			getSlot(coord.y, coord.x + 1); // L
			getSlot(coord.y - 1, coord.x); // D
			getSlot(coord.y, coord.x - 1); // R
			getSlot(coord.y + 1, coord.x); // U
		}

		if (matches.size > 0) {
			var effects = [];
			var effectDuration = 0;
			var collected = [];

			matches.forEach(slot => {
				var block = slot.block;
				slot.block = null;
				collected.push(block);

				block.onMatch(effects);
				var del = cc.callFunc(() => this.removeChild(block));

				var spawn = cc.spawn(effects);
				effectDuration = spawn.getDuration();
				block.runAction(cc.sequence([spawn, del]));

				effects.length = 0;
			});

			this.parent.addCombo(collected);

			var seq = this.createProcessSequence(effectDuration, y + 1, y);
			this.runAction(seq);

		} else {
			this.postProcessRow(y);
		}
	},

	// Grab all the blocks that are part of a match with the current row
	getMatches : function(y) {
		var matches = [];

		// Babel & ES6 FTW !
		for (var match of this.match(y)) {
			matches = matches.concat(match);
		}

		return matches;
	},

	match : function*(y) {
		// Horizontal
		var match = [this.grid[y][0]];
		var slot = null;

		for (var x = 1; x < GridManager.gridSize.x; x++) {
			slot = this.grid[y][x];

			if (slot.block.isMatchable && slot.block.typeId === match[match.length - 1].block.typeId) {
				match.push(slot);
			} else {
				if (match.length >= 3) {
					yield match;
				}

				match = [slot];
			}
		}

		// Return match in case the last block was also part of one
		if (match.length >= 3) {
			yield match;
		}

		// Vertical
		for (var x = 0; x < GridManager.gridSize.x; x++) {
			slot = this.grid[y][x];

			match = [slot];

			var recursive = (ry) => {
				if (ry > GridManager.gridSize.y - 1 || ry < 0) {
					return;
				}

				slot = this.grid[ry][x];

				if (slot.block.isMatchable && slot.block.typeId === match[match.length - 1].block.typeId) {
					match.push(slot);
				} else {
					return;
				}

				var dir = ry - y > 0 ? 1 : -1;
				recursive(ry + dir);
			}

			recursive(y + 1);
			recursive(y - 1);

			if (match.length >= 3) {
				yield match;
			}
		}
	},

	// Process enemies, repeat match cycle if necessary, or end it
	postProcessRow : function(y) {
		var arr = []
			.concat(this.grid[y])
			.map(slot => slot.block)
			.filter(block => Block.isEnemy(block.typeId));

		arr.forEach(enemy => enemy.priority === 0 ? enemy.onScan() : null);

		var attackers = arr.filter(enemy => enemy.priority > 0)

		if (attackers.length > 0) {
			var attacker = attackers.reduce((a, b) => a.priority > b.priority ? b : a);
			this.processEnemy(attacker);

		} else {
			arr.forEach(enemy => enemy.active = false);

			this.isBusy = false;
			this.scanBar.doResume();
			this.parent.resetCombo();
		}
	},

	processBomb : function(sourceBlock) {
		this.isBusy = true;
		this.scanBar.doPause();

		var sourceSlot = this.getSlotOfBlock(sourceBlock);
		var targets = new Set();
		targets.add(sourceSlot);
		var explosives = [];
		var gridPos = sourceSlot.gridPos;

		var recursive = (y, x) => {
			if (y < 0 ||
				y >= GridManager.gridSize.y ||
				x < 0 ||
				x >= GridManager.gridSize.x) {

				// Out of bounds
				return;
			}

			var currentSlot = this.grid[y][x];
			targets.add(currentSlot);

			if (currentSlot.block.canExplode &&
				!explosives.includes(currentSlot.block)) {

				explosives.push(currentSlot.block);

				recursive(y, x + 1);
				recursive(y - 1, x);
				recursive(y, x - 1);
				recursive(y + 1, x);

				recursive(y + 1, x + 1);
				recursive(y - 1, x - 1);
				recursive(y + 1, x - 1);
				recursive(y - 1, x + 1);
			}
		}

		recursive(gridPos.y, gridPos.x + 1); // L
		recursive(gridPos.y - 1, gridPos.x); // D
		recursive(gridPos.y, gridPos.x - 1); // R
		recursive(gridPos.y + 1, gridPos.x); // U

		recursive(gridPos.y - 1, gridPos.x - 1);
		recursive(gridPos.y + 1, gridPos.x + 1);
		recursive(gridPos.y - 1, gridPos.x + 1);
		recursive(gridPos.y + 1, gridPos.x - 1);

		var effects = [];
		var effectDuration = 0;
		var collected = [];

		targets.forEach(slot => {
			var block = slot.block;
			slot.block = null;
			collected.push(block);

			var source = sourceSlot.getPosition();
			var here = slot.getPosition();
			var blowX = (here.x - source.x) != 0 ? this.spacing * 64 / (here.x - source.x) : 0;
			var blowY = (here.y - source.y) != 0 ? this.spacing * 64 / (here.y - source.y) : 0;

			effects.push(cc.rotateBy(0.5, Math.random() * 180, 0));
			effects.push(cc.moveBy(0.5, blowX, blowY));
			effects.push(cc.fadeTo(0.5, 0));
			var del = cc.callFunc(() => this.removeChild(block));

			var spawn = cc.spawn(effects).easing(cc.easeSineOut());
			effectDuration = spawn.getDuration() / 1.5;
			block.runAction(cc.sequence([spawn, del]));

			effects.length = 0;
		});

		this.parent.addCombo(collected);

		var seq = this.createProcessSequence(effectDuration, 1, gridPos.y);
		this.runAction(seq);
	},

	processRainbow : function(sourceBlock, colorId) {
		this.isBusy = true;
		this.scanBar.doPause();

		var sourceSlot = this.getSlotOfBlock(sourceBlock);
		var row = sourceSlot.gridPos.y;
		var targets = [sourceSlot];

		for (var y = 0; y < GridManager.gridSize.y; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {
				var slot = this.grid[y][x];

				if (slot.block.typeId === colorId) {
					targets.push(slot);
				}
			}
		}

		var effects = [];
		var effectDuration = 0;
		var collected = [sourceBlock];

		targets.forEach(slot => {
			var block = slot.block;
			slot.block = null;
			collected.push(block);

			effects.push(cc.scaleTo(0.5, 1.2, 1.2));
			effects.push(cc.fadeTo(0.5, 0));
			var del = cc.callFunc(() => this.removeChild(block));

			var spawn = cc.spawn(effects);
			effectDuration = spawn.getDuration();
			block.runAction(cc.sequence([spawn, del]));

			effects.length = 0;
		});

		this.parent.addCombo(collected);

		var seq = this.createProcessSequence(effectDuration, 1, row);
		this.runAction(seq);
	},

	processHeal : function(sourceBlock) {
		this.isBusy = true;
		this.scanBar.doPause();

		var sourceSlot = this.getSlotOfBlock(sourceBlock);
		var row = sourceSlot.gridPos.y;
		sourceSlot.block = null;

		var effects = [];
		var effectDuration = 0;
		effects.push(cc.scaleTo(1, 1.5, 1.5));
		effects.push(cc.fadeTo(1, 0));
		var del = cc.callFunc(() => this.removeChild(sourceBlock));
		var spawn = cc.spawn(effects);
		effectDuration = spawn.getDuration();
		sourceBlock.runAction(cc.sequence([spawn, del]));

		this.parent.addCombo([sourceBlock]);

		var seq = this.createProcessSequence(effectDuration, row + 1, row);
		this.runAction(seq);
	},

	processEnemy : function(sourceBlock) {
		this.isBusy = true;
		this.scanBar.doPause();

		var sourceSlot = this.getSlotOfBlock(sourceBlock);
		var gridPos = sourceSlot.gridPos;
		var targets = [sourceSlot];

		var getSlot = (y, x) => {
			if (y < 0 ||
				y >= GridManager.gridSize.y ||
				x < 0 ||
				x >= GridManager.gridSize.x) {

				// Out of bounds
				return;
			}

			targets.push(this.grid[y][x]);
		}

		getSlot(gridPos.y, gridPos.x + 1); // L
		getSlot(gridPos.y - 1, gridPos.x); // D
		getSlot(gridPos.y, gridPos.x - 1); // R
		getSlot(gridPos.y + 1, gridPos.x); // U

		getSlot(gridPos.y - 1, gridPos.x - 1);
		getSlot(gridPos.y + 1, gridPos.x + 1);
		getSlot(gridPos.y - 1, gridPos.x + 1);
		getSlot(gridPos.y + 1, gridPos.x - 1);

		var effects = [];
		var effectDuration = 0;

		targets.forEach(slot => {
			var block = slot.block;
			slot.block = null;

			effects.push(cc.moveTo(1, sourceSlot.getPosition().x, sourceSlot.getPosition().y));
			effects.push(cc.rotateBy(1, (Math.random() - 0.5) * 90, 0));
			effects.push(cc.tintTo(1, 0, 0, 0));
			effects.push(cc.scaleTo(1, 0, 0));
			var del = cc.callFunc(() => this.removeChild(block));

			var spawn = cc.spawn(effects).easing(cc.easeSineIn());
			effectDuration = spawn.getDuration() / 1.5;
			block.runAction(cc.sequence([spawn, del]));

			effects.length = 0;
		});

		var seq = this.createProcessSequence(effectDuration, gridPos.y + 1, gridPos.y);
		this.runAction(seq);
	},

	getSlotOfBlock : function(block) {
		for (var x = 0; x < GridManager.gridSize.x; x++) {
			if (this.grid[this.scanBar.currentRow][x].block === block) {
				return this.grid[this.scanBar.currentRow][x];
			}
		}
	},

	// Creates a sequence to run the actions in order
	createProcessSequence : function(effectDuration, shiftFrom, resumeFrom) {
		var seq = [];
		seq.push(cc.delayTime(effectDuration));
		seq.push(cc.callFunc(() => this.shiftBlocks(shiftFrom)));
		seq.push(cc.delayTime(this.shiftTime));
		seq.push(cc.delayTime(this.scanBar.cooldown));
		seq.push(cc.callFunc(() => {
			this.fillGrid();
			this.isBusy = false;
			this.opQueue.push(() => this.processRow(resumeFrom));
		}));

		return cc.sequence(seq);
	},

	shiftBlocks : function(y) {
		var maxDuration = 0;

		for (var j = y; j < GridManager.gridSize.y + GridManager.gridSize.y_hidden; j++) {
			for (var i = 0; i < GridManager.gridSize.x; i++) {
				if (!this.grid[j][i].block) {
					continue;
				}

				var recursive = (ry) => {
					if (ry - 1 < 0 || this.grid[ry - 1][i].block) {
						return ry;
					}

					return recursive(ry - 1);
				}

				var targetY = recursive(j);

				if (j !== targetY) {
					var oldSlot = this.grid[j][i];
					var newSlot = this.grid[targetY][i];
					var block = oldSlot.block;
					oldSlot.block = null;
					newSlot.block = block;
					var oldPos = oldSlot.getPosition();
					var newPos = newSlot.getPosition();

					var distance = utils.clamp(oldPos.y - newPos.y, 128, 512);
					var duration = distance / 512;
					var moveTo = cc.moveTo(duration, newPos);
					moveTo.easing(cc.easeSineIn());
					block.runAction(moveTo);

					if (duration > maxDuration) {
						maxDuration = duration;
					}
				}
			}
		}

		this.shiftTime = maxDuration;
	},

	fillGrid : function() {
		var updatedSlots = this.gridGen.fill(this.grid);

		for (var i = 0; i < updatedSlots.length; i++) {
			var slot = updatedSlots[i];
			var pos = slot.getPosition();
			slot.block.setPosition(pos.x, pos.y);

			this.addChild(slot.block, this.zOff.blocks);
		}
	},

	update : function(dt) {
		// Process operation queue
		if (!this.isBusy && this.opQueue.length > 0) {
			var op = this.opQueue.shift();
			op();
		}
	},

	onExit : function() {
		this._super();
	}
});

GridManager.gridSize = {
	y : 7,
	y_hidden : 7,
	x : 7
}