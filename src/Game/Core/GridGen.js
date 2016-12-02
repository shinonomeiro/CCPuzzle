function GridGen() {
	
}

GridGen.prototype.make = function(y, x) {
	var grid = [];

	for (var j = 0; j < y; j++) {
		grid[j] = [];

		for (var i = 0; i < x; i++) {
			var slot = new cc.Node();
			var block = this.getRandomBlock();
			slot.block = block;
			grid[j][i] = slot;
		}
	}

	return grid;
}

GridGen.prototype.fill = function(grid) {
	var updatedSlots = [];

	for (var y = 0; y < grid.length; y++) {
		for (var x = 0; x < grid[y].length; x++) {
			var slot = grid[y][x];
			if (!slot.block) {
				var block = this.getRandomBlock();
				slot.block = block;
				updatedSlots.push(slot);
			}
		}
	}

	return updatedSlots;
}

GridGen.prototype.getRandomBlock = function() {
	var rand = Math.random();

	if (rand < 0.94)
		return Block.createColorBlock(Math.floor(Math.random() * 5));
	else if (rand < 0.97)
		return Block.createBombBlock(1, 2);
	else if (rand < 1)
		return Block.createRainbowBlock();
}