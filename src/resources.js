var path = 'res/';

var res = {
    tiles_sheet : path + 'tiles.png',
    tiles_plist : path + 'tiles.plist',
    frame : path + 'frame.png',
    HP_bar_back : path + 'HP_bar_back.png',
    HP_bar_front : path + 'HP_bar_front.png',
};

var g_resources = [];

for (var key in res) {
    g_resources.push(res[key]);
}