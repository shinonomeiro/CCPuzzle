var Player = cc.Node.extend({
	HP : 100,
	fever : 0,
	blockColor : 2,

	ctor : function() {
		this._super();

		this.init();
	},

	init : function() {
		cc.eventManager.addListener({
			event : cc.EventListener.CUSTOM,
			eventName : 'swap',
			callback : this.handleSwap.bind(this)
		}, this);

		this.blockHasChanged();
	},

	onEnter : function() {
		this._super();
	},

	handleSwap : function(e) {
		var swap = e.getUserData();
		this.blockColor = swap(this.blockColor);
		this.blockHasChanged();
	},

	blockHasChanged : function() {
		cc.eventManager.dispatchCustomEvent(
			'playerBlock',
			this.blockColor
		);
	},

	onHeal : function() {
		this.HP += 10;

		if (this.HP > 100) {
			this.HP = 100;
		}

		cc.eventManager.dispatchCustomEvent(
			'playerHP',
			this.HP
		);
	},

	onEnemyAttack : function() {
		this.HP -= 10;

		cc.eventManager.dispatchCustomEvent(
			'playerHP',
			this.HP
		);

		if (this.HP < 0) {
			this.HP = 0;

			cc.eventManager.dispatchCustomEvent(
				'playerDead',
				null
			);
		}
	},

	onExit : function() {
		this._super();
	}
});