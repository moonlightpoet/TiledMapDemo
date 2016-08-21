Cocos Creator——Tiled Map示例
作者：月光诗人

新建一个项目：TiledmapTest
将预先准备好的资源文件res放入assets/目录下。
在res/目录下编辑生成一个瓦片地图文件map.tmx。
100x100的瓦片地图有点大了，所以我还是考虑35x35差不多了：）
瓦片地图文件——map.tmx生成完毕。
生成map
生成成功时显示的Layer
创建map.js脚本，绑定到map。
开始编写start()函数。
关于start()函数：http://www.cocos.com/docs/creator/api/classes/TiledMap.html
开始编写onLoad()函数。
关于cc.TiledMap的getMapSize()函数：http://www.cocos.com/docs/creator/api/classes/TiledMap.html
getMapSize()返回的瓦片的大小。
设置精灵移动的事件后，精灵可以移动，遇到barrier Layer上面的图块也会显示，
但是精灵到达超出屏幕的区域时就看不到了，
所以我们需要改进代码使得精灵在快要超出屏幕的时候map的方向也相对移动。
具体来说：精灵快要超出右边边界的时候屏幕朝左移，快要超出左边边界的时候屏幕朝右移……
以为刚才机器卡了管的时候没有保存场景，再重新生成一下场景。
所以：设置好了精灵移动+碰到barrier不移动，设置好了map在必要情况下移动。
编写重新开始游戏的函数,并将其绑定到succeedLayer的button上监听。
END.

项目Github地址：https://github.com/moonlightpoet/TiledMapDemo

