var GridManager = cc.Node.extend({
	gridGen : null,
	grid : null,
	scanBar : null,
	scanBarCooldown : 1,
	spacing : null,
	shiftTime : 0,

	zOff: {
		blocks : 1,
		scanBar : 2
	},

	comboCount : -1,
	collectCount : 0,

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

		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'explosion',
			callback : this.processExplosion.bind(this)
		}, this);
	},

	onEnter : function() {
		this._super();

		this.scheduleUpdate();
	},

	initialRender : function() {
		for (var y = 0; y < this.grid.length; y++) {
			for (var x = 0; x < this.grid[y].length; x++) {
				var pos = cc.p(x * this.spacing, y * this.spacing);

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
		var arr = [].concat(this.grid[y]);

		arr.sort((s1, s2) => {
			if (s1.block.priority < s2.block.priority) return 1;
			else if (s1.block.priority > s2.block.priority) return -1;
			else return 0
		});

		if (arr[0].block.priority > 0) {
			this.opQueue.push(() => arr[0].block.onScan());
		} else {
			this.opQueue.push(() => this.processMatches(y));
		}
	},

	getMatches : function(y) {
		var matches = [];

		// Babel & ES6 FTW !
		for (var match of this.match(y)) {
			matches = matches.concat(match);
			this.comboCount++;
			this.collectCount += matches.length;
		}

		return matches;
	},

	processMatches : function(y) {
		this.isBusy = true;
		this.scanBar.doPause();

		var matches = this.getMatches(y);

		if (matches.length > 0) {

			if (this.comboCount > 0) {
				cc.eventManager.dispatchCustomEvent(
					'combo',
					{ 
						comboCount : this.comboCount,
						collectCount : this.collectCount
					}
				);
			}

			var effectDuration = 0;

			matches.forEach(slot => {
				var block = slot.block;
				slot.block = null;

				var effects = [];
				effects.push(cc.scaleTo(0.3, 0.1, 0.1));
				var del = cc.callFunc(() => this.removeChild(block));

				var spawn = cc.spawn(effects);
				effectDuration = spawn.getDuration();
				block.runAction(cc.sequence([spawn, del]));
			});

			var seq = [];
			seq.push(cc.delayTime(effectDuration));
			seq.push(cc.callFunc(() => this.shiftBlocks(y + 1)));
			seq.push(cc.delayTime(this.shiftTime));
			seq.push(cc.delayTime(this.scanBarCooldown));
			seq.push(cc.callFunc(() => {
				this.fillGrid();
				this.isBusy = false;
				this.opQueue.push(() => this.processRow(y));
			}));

			this.runAction(cc.sequence(seq));

		} else {
			// End of item / match cycle, resume bar progression
			this.isBusy = false;
			this.scanBar.doResume();

			this.comboCount = -1;
			this.collectCount = 0;
		}
	},

	match : function*(y) {
		// Horizontal
		var match = [this.grid[y][0]];
		var slot = null;

		for (var x = 1; x < GridManager.gridSize.x; x++) {
			slot = this.grid[y][x];

			if (slot.block.isMatchable &&
				slot.block.typeId === match[match.length - 1].block.typeId) {
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

				if (slot.block.isMatchable &&
					slot.block.typeId === match[match.length - 1].block.typeId) {
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

	processExplosion : function(e) { // TODO Add combo
		this.isBusy = true;
		this.scanBar.doPause();

		var data = e.getUserData();
		var explosive = data.sourceBlock;
		var slot = null;

		for (var y = 0; y < GridManager.gridSize.y; y++) {
			for (var x = 0; x < GridManager.gridSize.x; x++) {
				if (this.grid[y][x].block === explosive) {
					slot = this.grid[y][x];
					break;
				}
			}
		}

		var targets = new Set();
		targets.add(slot);
		var explosives = [];
		var power = data.power;
		var gridPos = slot.gridPos;

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

			// TODO Refactor
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

		var effectDuration = 0;

		targets.forEach(slot => {
			var block = slot.block;
			slot.block = null;

			var effects = [];
			effects.push(cc.rotateBy(0.5, Math.random() * 90, 0));
			effects.push(cc.moveBy(0.5, 0, -50));
			effects.push(cc.fadeTo(0.5, 0));
			var del = cc.callFunc(() => this.removeChild(block));

			var spawn = cc.spawn(effects).easing(cc.easeSineOut());
			effectDuration = spawn.getDuration();
			block.runAction(cc.sequence([spawn, del]));
		});

		var seq = [];
		seq.push(cc.delayTime(effectDuration));
		seq.push(cc.callFunc(() => this.shiftBlocks(1)));
		seq.push(cc.delayTime(this.shiftTime));
		seq.push(cc.delayTime(this.scanBarCooldown));
		seq.push(cc.callFunc(() => {
			this.fillGrid();
			this.isBusy = false;
			this.opQueue.push(() => this.processRow(slot.gridPos.y));
		}));

		this.runAction(cc.sequence(seq));
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