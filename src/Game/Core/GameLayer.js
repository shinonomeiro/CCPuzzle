var GameLayer = cc.Layer.extend({
	spritesheet : null,
	player : null,
	gridManager : null,

	comboCount : -1,
	collectCount : 0,
	score : 0,

	ctor : function(space) {
		this._super();

		this.init();
	},

	init : function() {
		this.gridManager = new GridManager();
		this.addChild(this.gridManager);

		this.player = new Player();
		this.addChild(this.player);
	},

	addCombo : function(collected) {
		this.comboCount++;
		this.collectCount += collected.length;
		this.score += this.comboCount * 100;
		collected.forEach(block => this.score += block.value);

		cc.eventManager.dispatchCustomEvent(
			'score',
			this.score
		);

		if (this.comboCount > 0) {
			cc.eventManager.dispatchCustomEvent(
				'combo',
				{ 
					comboCount : this.comboCount,
					collectCount : this.collectCount,
				}
			);
		}
	},

	resetCombo : function() {
		this.comboCount = -1;
		this.collectCount = 0;
	},

	onEnter : function() {
		this._super();
	},

	onExit : function() {
		this._super();
	}
});