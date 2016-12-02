var ColorBlock = Block.extend({
	ctor : function(typeId) {
		this._super(Block.COLOR_RANGE + typeId);

		this.isMatchable = true;
		this.blockTouched = [ new Block.Attributes.Swappable(this) ];

		this.value = 50;
	},

	onEnter : function() {
		this._super();
	},

	onTouch : function(touch, e) {
		this.blockTouched[0].handle();
	},

	onMatch : function() {
		
	},

	onExit : function() {
		this._super();
	}
});