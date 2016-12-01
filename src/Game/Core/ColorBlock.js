var ColorBlock = Block.extend({
	ctor : function(typeId) {
		this._super(typeId);

		this.isMatchable = true;
		this.blockTouched = [ new Block.Attributes.Swappable(this) ];
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