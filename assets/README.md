# 卡牌素材

## 国风水墨

- `guofeng-atlas.webp` 用于卡面、图鉴与副本。九格依次为墨竹、云山、铁锅、茶器、丹顶鹤、笔墨卷轴、纸舟、双鱼、崖松。
- `guofeng-scroll.webp` 用于首页和战场。主体是宋画式山水长卷，右侧留有朱砂日轮。
- 两张图均由内置 imagegen 生成。

### 卡面图集提示词

Create one square 3×3 illustration atlas, exactly nine strictly equal square cells edge to edge with no frames or gutters, for a traditional Chinese ink-wash strategy game. Art direction: Chinese xieyi painting on warm ivory raw xuan paper, vigorous calligraphic dry brush and granulated black ink bleeding into pale washes, Song landscape composition and literati still life. Ink must read black at card size: strong distinct dark shapes, warm ivory paper, occasional iron-red cinnabar details, a little restrained mineral malachite, very little brown. Each subject centered within its own cell with landings and ink contained, no continuation between cells. Top row from left: wild black bamboo bending in wind, a high Chinese mountain ridge in mist with tiny cinnabar sun, an imposing dark iron wok over three stones with ink smoke. Middle row: a dark Zisha teapot and two small cups in steam, a white red-crowned crane with outstretched wings, a blank calligraphy handscroll with brush and stone ink slab. Bottom row: a small folded paper boat on sweeping black wash water, two black and carmine koi swimming in an ink circle, a windswept Chinese pine over a rocky bluff. Build around recognizable silhouettes, restrained and expressive high contrast ink, genuinely Chinese ink brushwork, strong variation in mark making. Absolutely no visible text, script, logos, artificial frames, or UI.

### 山水长卷提示词

A wide horizontal original traditional CHINESE ink-wash shanshui painting, conceived as a Northern Song style handscroll on pale warm raw xuan paper for the masthead of a Chinese card game. Layers of mountain silhouettes recede into empty mist, with dark ink precipices and windswept small pines along far right and lower right, distant ridges across the bottom third, a small cinnabar sun in the upper right, quiet open ivory white empty space across the LEFT HALF for headline text. Fine hand-placed ink strokes, velvety ink bleed, exposed paper grain, no strong color beyond gray black and cinnabar, detached brush edges and a poetic composition, authentic Chinese shanshui, broad untouched paper: the outer edges blend naturally into warm pale ivory paper. Wide panorama, 3:2 horizontal canvas, artwork only, no text, seals, lettering, or frames.

## 首版素材

- 最终文件：`ink-atlas.png`
- 生成方式：内置 `image_gen.imagegen`，未使用 CLI 或外部素材库。
- 用法：3 × 3 图集，由 CSS 背景定位取用，保留原始图像。依次为竹、山、锅、茶、鹤、卷轴、纸舟、锦鲤、松。
- 站点图标 `favicon.svg` 为项目内编写的矢量图标。

## 生成提示词

Use case: stylized-concept. Asset type: single square sprite atlas illustration for a Chinese ink-wash office strategy card game. Create a 2048x2048 square containing exactly a 3 by 3 grid of nine separate equally sized full-bleed illustrations, no gaps, no borders. Every cell must have the same warm ivory rice-paper background #eee8db, expressive authentic Chinese sumi-e ink-wash and dry-brush painting, strong black and soft gray ink, a very small vermilion accent, ample empty space around the subject, elegant collectible art. Individual cells in reading order: 1 a bamboo grove bending in wind; 2 an imposing craggy Chinese mountain peak in mist with a tiny red sun; 3 a black iron cooking wok balanced on rocks with dark smoke rising (office blame metaphor); 4 a traditional teapot with a cup and steam; 5 a long-feathered crane standing in reeds; 6 an unrolled rice-paper scroll and calligraphy brush; 7 a paper boat on flowing water; 8 a golden koi made with black and ochre ink circling in water; 9 a single bonsai pine tree rooted in rock. Keep each composition fully inside its cell so it can be cropped independently in CSS. No writing, no text, no letters, no stamps containing writing, no numbers, no UI. Rich brush texture, delicate washed edges and intentional negative space, mature sophisticated East Asian painting.
