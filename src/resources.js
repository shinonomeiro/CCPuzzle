var path = 'res/';

var res = {
    tiles_sheet : path + 'tiles.png',
    tiles_plist : path + 'tiles.plist',
    frame : path + 'frame.png',
};

var g_resources = [];

for (var key in res) {
    g_resources.push(res[key]);
}