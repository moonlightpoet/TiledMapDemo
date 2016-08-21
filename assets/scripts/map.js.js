// 添加方向枚举类型
var MoveDirection = cc.Enum({
    NONE: 0,
    UP : 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
});

// 设置几个map边界相关的变量
var minTilesCount = 2; // 当player和屏幕距离达到2个瓦片的宽度（或高度）的时候就可以准备开始移动
var mapMoveStep = 1; // map一次移动的瓦片的宽度或高度
var minMoveValue = 50; // map单次最小移动距离mo

cc.Class({
    extends: cc.Component,

    properties: {
        _isMapLoaded: { // 用于瓦片地图第一次加载时（即运行start()函数时）
            default: false,
            serializable: false
        },
        floorLayerName: { // floor图层名称
            default: 'floor'
        },
        barrierLayerName: { // barrier图层名称
            default: 'barrier'
        },
        objectGroupName: { // players对象层名称
            default: 'players'
        },
        startObjectName: { // 开始节点对象
            default: 'SpawnPoint'
        },
        successObjectName: { // 借宿节点对象
            default: 'SuccessPoint'
        }
    },
    
    start: function (err) {
        if (err) return;
        
        // init the map position
        // 首先，我们需要初始化map的位置，另map的坐下点与视图的左下点对齐
        this._initMapPos();
        
        // init succeedLayer
        // succeedLayer一开始是隐藏的，只有到player到达终点的时候才会出现
        this._succeedLayer = this.node.getParent().getChildByName('succeedLayer');
        this._succeedLayer.active = false;
        
        // init the player position
        this._tiledMap = this.node.getComponent('cc.TiledMap');
        var objectGroup = this._tiledMap.getObjectGroup(this.objectGroupName);
        if (!objectGroup) return;
        
        var startObj = objectGroup.getObject(this.startObjectName);
        var endObj = objectGroup.getObject(this.successObjectName);
        if (!startObj || !endObj) return;
        
        var startPos = cc.p(startObj.x, startObj.y);
        var endPos = cc.p(endObj.x, endObj.y);
        
        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
        if (!this._layerFloor || !this._layerBarrier) retun;
        
        this._curTile = this._startTile = this._getTilePos(startPos);
        this._endTile = this._getTilePos(endPos);
        
        if (this._player) {
            // 这里需要设置player的位置
            this._updatePlayerPos();
            this._player.active = true;
        }
        
        this._isMapLoaded = true;
    },
    
    _getTilePos: function (posInPixel) {
        var mapSize = this.node.getContentSize();
        var tileSize = this._tiledMap.getTileSize();
        // 瓦片坐标是从左上角开始算的
        var x = Math.floor(posInPixel.x / tileSize.width);
        var y = Math.floor((mapSize.height - posInPixel.y) / tileSize.height);
        
        return cc.p(x, y);
    },
    
    _initMapPos: function () {
        this.node.setPosition(cc.visibleRect.bottomLeft);
    },
    
    _updatePlayerPos: function () {
        var pos = this._layerFloor.getPositionAt(this._curTile);
        this._player.setPosition(pos);
    },
    
    onLoad: function () {
        this._player = this.node.getChildByName('player');
        if (!this._isMapLoaded) {
            this._player.active = false;
        }
        
        // 为当前结点添加事件监听
        var self = this;
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function(keyCode, event) {
                // 响应函数
                self._onKeyPressed(keyCode, event);
            }
        }, self.node);
    },
    
    _onKeyPressed: function(keyCode, event) {
        if (!this._isMapLoaded || this._succeedLayer.active) return;
        
        var newTile = cc.p(this._curTile.x, this._curTile.y);
        var mapMoveDir = MoveDirection.NONE;
        switch (keyCode) {
            case cc.KEY.up:
                newTile.y -= 1;
                mapMoveDir = MoveDirection.DOWN;
                break;
            case cc.KEY.down:
                newTile.y += 1;
                mapMoveDir = MoveDirection.UP;
                break;
            case cc.KEY.left:
                newTile.x -= 1;
                mapMoveDir = MoveDirection.RIGHT;
                break;
            case cc.KEY.right:
                newTile.x += 1;
                mapMoveDir = MoveDirection.LEFT;
                break;
            default:
                break;
        }
        
        // 记录好newTile之后，写一个尝试移动的函数
        this._tryMoveToNewTile(newTile, mapMoveDir)
    },
    
    _tryMoveToNewTile: function(newTile, mapMoveDir) {
        var mapSize = this._tiledMap.getMapSize();
        if (newTile.x < 0 || newTile.x >= mapSize.width) return;
        if (newTile.y < 0 || newTile.y >= mapSize.height) return;
        
        if (this._layerBarrier.getTileGIDAt(newTile)) {
            cc.log('This way is blocked!');
            return false;
        }
        
        // update player position
        this._curTile = newTile;
        this._updatePlayerPos();
        
        // move the map if necessary
        this._tryMoveMap(mapMoveDir);
        
        // check the player is success or not 
        if (cc.pointEqualToPoint(this._curTile, this._endTile)) {
            cc.log('succeed');
            this._succeedLayer.active = true;
        }
    },
    
    _tryMoveMap: function (mapMoveDir) {
        // get necessary data 
        var mapContentSize = this.node.getContentSize();
        var mapPos = this.node.getPosition();
        var playerPos = this._player.getPosition();
        var viewSize = cc.size(cc.visibleRect.width, cc.visibleRect.height);
        var tileSize = this._tiledMap.getTileSize();
        var minDisX = minTilesCount * tileSize.width;
        var minDisY = minTilesCount * tileSize.height;
        
        // player节点相对于视图的x偏移量
        var disX = playerPos.x + mapPos.x;
        // player节点相对于视图的y偏移量
        var disY = playerPos.y + mapPos.y;
        var newPos;
        switch (mapMoveDir) {
            case MoveDirection.UP:
                if (disY < minDisY) {
                    newPos = cc.p(mapPos.x, mapPos.y + tileSize.height * mapMoveStep);
                }
                break;
            case MoveDirection.DOWN:
                if (viewSize.height - disY - tileSize.height < minDisY) {
                    newPos = cc.p(mapPos.x, mapPos.y -tileSize.height * mapMoveStep);
                }
                break;
            case MoveDirection.LEFT:
                if (viewSize.width - disX - tileSize.width < minDisX) {
                    newPos= cc.p(mapPos.x -tileSize.width * mapMoveStep, mapPos.y);
                }
                break;
            case MoveDirection.RIGHT:
                if (disX < minDisX) {
                    newPos= cc.p(mapPos.x + tileSize.width * mapMoveStep, mapPos.y);
                }
                break;
            default:
                return;
        }
        
        if (newPos) {
            // calculate the position range of map
            // 也就是说，如果移动到的区域将会超过边界，那么我只移动到边界
            var minX = (viewSize.width - mapContentSize.width) - cc.visibleRect.left.x;
            var maxX = cc.visibleRect.left.x;
            var minY = (viewSize.height - mapContentSize.height) - cc.visibleRect.bottom.y;
            var maxY = cc.visibleRect.bottom.y;
            
            if (newPos.x < minX) newPos.x = minX;
            if (newPos.x > maxX) newPos.x = maxX;
            if (newPos.y < minY) newPos.y = minY;
            if (newPos.y > maxY) newPos.y = maxY;
            
            if (!cc.pointEqualToPoint(newPos, mapPos)) {
                cc.log('Move the map to new position: ', newPos);
                this.node.setPosition(newPos);
            }
        }
    },
    
    rastartGame: function () {
        this._succeedLayer.active = false;
        this._initMapPos();
        this._curTile = this._startTile;
        this._updatePlayerPos();
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
