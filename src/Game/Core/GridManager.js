var GridManager = cc.Node.extend({
	gridGen : null,
	grid : null,
	scanBar : null,
	scanBarCooldown : 1,
	spacing : null,

	zOff: {
		blocks : 1,
		scanBar : 2
	},

	comboCount : -1,
	collectCount : 0,

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

		this.scanBar = new GridScanBar(this.grid, this.processMatches.bind(this));
		this.addChild(this.scanBar, this.zOff.scanBar);
	},

	onEnter : function() {
		this._super();
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

	getMatches : function(y) {
		var matches = [];

		// Babel polyfill & ES6 FTW !
		for (var match of this.match(y)) {
			matches = matches.concat(match);
			this.comboCount++;
			this.collectCount += matches.length;
		}

		return matches;
	},

	processMatches : function(y) {
		this.scanBar.doPause();

		var matches = this.getMatches(y);

		if (matches.length > 0) {

			matches.forEach(slot => {
				var block = slot.block;
				slot.block = null;
				// TODO Play quick effect before unparenting
				this.removeChild(block);
			});

			var waitTime = this.shiftBlocks(y);

			/*
			(callback, target, interval, repeat, delay, paused, key)
			*/
			cc.director.getScheduler().schedule(
				() => {
					this.fillGrid();
					this.processMatches(y);
				}, 
				this, waitTime + this.scanBarCooldown, 0, 0, false, ''
			);

			if (this.comboCount > 0) {
				cc.eventManager.dispatchCustomEvent(
					'combo',
					{ 
						comboCount : this.comboCount,
						collectCount : this.collectCount
					}
				);
			}
		} else {
			this.comboCount = -1;
			this.collectCount = 0;
			this.scanBar.doResume();
		}
	},

	match : function*(y) {
		// Horizontal
		var match = [this.grid[y][0]];
		var slot = null;

		for (var x = 1; x < GridManager.gridSize.x; x++) {
			slot = this.grid[y][x];

			if (!slot.block.isMatchable) {
				continue;
			}

			if (slot.block.typeId === match[match.length - 1].block.typeId) {
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

			if (!slot.block.isMatchable) {
				continue;
			}

			match = [slot];

			var recursive = (ry) => {
				if (ry > GridManager.gridSize.y - 1 || ry < 0) {
					return;
				}

				slot = this.grid[ry][x];

				if (slot.block.typeId === match[match.length - 1].block.typeId) {
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

	processExplosion : function(e) {
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
				y > GridManager.gridSize.y ||
				x < 0 ||
				x > GridManager.gridSize.x) {

				// Out of bounds
				return;
			}

			var currentSlot = this.grid[y][x];
			targets.add(currentSlot);

			// TODO Refactor
			if (currentSlot.block.typeId === 100 &&
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

		targets.forEach(slot => {
			var block = slot.block;
			slot.block = null;
			// TODO Play quick effect before unparenting
			this.removeChild(block);
		});

		var waitTime = this.shiftBlocks(1);

		/*
		(callback, target, interval, repeat, delay, paused, key)
		*/
		cc.director.getScheduler().schedule(
			() => { 
				this.fillGrid();
				this.scanBar.doResume();
			}, 
			this, waitTime + this.scanBarCooldown, 0, 0, false, ''
		);
	},

	shiftBlocks : function(y) {
		var duration = 0;

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
					var _duration = distance / 512;
					var moveTo = cc.moveTo(_duration, newPos);
					moveTo.easing(cc.easeSineIn());
					block.runAction(moveTo);

					if (_duration > duration) {
						duration = _duration;
					}
				}
			}
		}

		return duration;
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

	onExit : function() {
		this._super();
	}
});

GridManager.gridSize = {
	y : 7,
	y_hidden : 7,
	x : 7
}