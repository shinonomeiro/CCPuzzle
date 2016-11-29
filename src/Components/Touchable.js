// TOUCHABLE.JS //
// Touch-enabled Node //

var Touchable = cc.Component.extend({

	ctor: function(onTouchBegan, onTouchMoved, onTouchEnded) {
		this.setName('Touchable');

		this.onTouchBegan = onTouchBegan;
		this.onTouchMoved = onTouchMoved;
		this.onTouchEnded = onTouchEnded;
	},

	onEnter: function() {
		var self = this;
		var owner = this.getOwner();

		var listener = cc.EventListener.create({
			event: cc.EventListener.TOUCH_ONE_BY_ONE,
			swallowTouches: true,

			onTouchBegan: function(touch, e) {
				var p = owner.convertToNodeSpace(touch.getLocation());
				var bbox = owner.getBoundingBox();

				if (cc.rectContainsPoint(bbox, p)) {
					if (self.onTouchBegan) {
						self.onTouchBegan(touch, e);
					}
		  
					// Swallow
					return true;
				};

				// Passthru
				return false;
			},
			onTouchMoved: function(touch, e) {
				if (self.onTouchMoved) {
					self.onTouchMoved(touch, e);
				}
			},
			onTouchEnded: function(touch, e) {
				if (self.onTouchEnded) {
					self.onTouchEnded(touch, e);
				}
			}
		});

		cc.eventManager.addListener(listener, owner);
		self.touchListener = listener;
	},

	onExit: function() {
		if (this.onTouchBegan) {
			delete this.onTouchBegan;
		}
		
		if (this.onTouchMoved) {
			delete this.onTouchMoved;
		}
		
		if (this.onTouchEnded) {
			delete this.onTouchEnded;
		}
		
		if (this.touchListener) {
			cc.eventManager.removeListener(this.touchListener);
			delete this.touchListener;
		}
	}
});