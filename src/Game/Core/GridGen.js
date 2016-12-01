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
	return Math.random() < 0.9
		? Block.createColorBlock(Math.floor(Math.random() * 5))
		: Block.createBombBlock(1, 2);
}