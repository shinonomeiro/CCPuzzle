var GridManager = cc.Node.extend({
	gridGen : null,
	grid : null,
	scanBar : null,
	spacing : null,
	shiftTime : 0,

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
		var sprite = new cc.Sprite('#block_0.png');
		this.spacing = sprite.getContentSize().width;
		sprite = null;

		var winSize = cc.director.getWinSize();
		var gridSize = GridManager.gridSize;
		var marginLR = winSize.width - (gridSize.x * this.spacing);
		// Align the grid to the center of the view
		// Memo: Grid anchor is located at the center of the left-bottom-most block
		this.setPosition((marginLR / 2) + (this.spacing / 2), 100);

		this.gridGen = new GridGen();

		this.grid = this.gridGen.make(
			gridSize.y + gridSize.y_hidden,
			gridSize.x
		);

		this.initialRender();

		this.scanBar = new GridScanBar(this.grid, this.processRow.bind(this));
		this.addChild(this.scanBar, this.zOff.scanBar);

		// BLOCK EVENTS

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'explosion',
			callback : (e) => {
				var data = e.getUserData();
				this.processExplosion(data.sourceBlock, data.power);
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
	},

	onEnter : function() {
		this._super();

		this.scheduleUpdate();
	},

	initialRender : function() {
		var offset = 16;

		for (var y = 0; y < GridManager.gridSize.y + GridManager.gridSize.y_hidden; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {

				// Create a small gap between uppermost playable and stock rows
				var pos = y >= GridManager.gridSize.y 
					? cc.p(x * this.spacing, (y * this.spacing) + offset)
					: cc.p(x * this.spacing, y * this.spacing);

				var slot = this.grid[y][x];
				slot.setPosition(pos.x, pos.y);
				slot.gridPos = { y : y, x : x };

				// Align block with slot
				var block = slot.block;
				block.setPosition(pos.x, pos.y);
				this.addChild(block, this.zOff.blocks);
			}
		}
	},

	processRow : function(y) {
		var arr = []
			.concat(this.grid[y])
			.map(slot => slot.block)
			.filter(block => block.priority > 0);

		if (arr.length > 0) {
			var item = arr.reduce((a, b) => a.priority > b.priority ? b : a);
			this.opQueue.push(() => item.onScan());
		} else {
			this.opQueue.push(() => this.processMatches(y));
			this.opQueue.push(() => this.finalize(y));
		}
	},

	getMatches : function(y) {
		var matches = [];

		// Babel & ES6 FTW !
		for (var match of this.match(y)) {
			matches = matches.concat(match);
		}

		// Discard duplicates in case of T-shaped matches
		matches = new Set(matches);

		return matches;
	},

	processMatches : function(y) {
		this.isBusy = true;
		this.scanBar.doPause();

		var matches = this.getMatches(y);

		if (matches.size > 0) {
			var effects = [];
			var effectDuration = 0;
			var collected = [];

			matches.forEach(slot => {
				var block = slot.block;
				slot.block = null;
				collected.push(block);

				// TODO Refactor effects to ColorBlock
				effects.push(cc.scaleTo(0.3, 0.1, 0.1));
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
			// End of item / match cycle, resume bar progression
			this.isBusy = false;
			this.scanBar.doResume();
			this.parent.resetCombo();
		}
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

	processExplosion : function(sourceBlock, power) { // TODO Add combo
		this.isBusy = true;
		this.scanBar.doPause();

		var sourceSlot = null;

		for (var y = 0; y < GridManager.gridSize.y; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {
				if (this.grid[y][x].block === sourceBlock) {
					sourceSlot = this.grid[y][x];
					break;
				}
			}
		}

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

			if (currentSlot.block.hasScanComponent('Explode') &&
				!explosives.includes(currentSlot.block)) {

				explosives.push(currentSlot.block);

				recursive(y, x + 1);
				recursive(y - 1, x);
				recursive(y, x - 1);
				recursive(y + 1, x);
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

			// TODO Refactor effects to BombBlock
			var source = sourceSlot.getPosition();
			var here = slot.getPosition();
			var blowX = (here.x - source.x) != 0 ? 4096 / (here.x - source.x) : 0;
			var blowY = (here.y - source.y) != 0 ? 4096 / (here.y - source.y) : 0;

			effects.push(cc.rotateBy(0.5, Math.random() * 180, 0));
			effects.push(cc.moveBy(0.5, blowX, blowY));
			effects.push(cc.fadeTo(0.5, 0));
			var del = cc.callFunc(() => this.removeChild(block));

			var spawn = cc.spawn(effects).easing(cc.easeSineOut());
			effectDuration = spawn.getDuration();
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

		var sourceSlot = null;

		for (var y = 0; y < GridManager.gridSize.y; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {
				if (this.grid[y][x].block === sourceBlock) {
					sourceSlot = this.grid[y][x];
					break;
				}
			}
		}

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

			// TODO Refactor effects to RainbowBlock
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
			this.addChild(slot.block, this.zOff.blocks);
			var pos = slot.getPosition();
			slot.block.setPosition(pos.x, pos.y);
		}
	},

	finalize : function(y) {
		// TODO Any logic to be done on row y after item/match cycle is over
	},

	update : function(dt) {
		if (this.isBusy) {
			return;
		}

		if (this.opQueue.length > 0) {
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