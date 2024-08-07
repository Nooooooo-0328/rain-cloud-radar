let autoZoomEnabled = true;

document.getElementById('toggleAutoZoom').addEventListener('click', () => {
    autoZoomEnabled = !autoZoomEnabled;
    document.getElementById('toggleAutoZoom').innerText = autoZoomEnabled ? '自動ズーム オフ' : '自動ズーム オン';
});

function displayCurrentTime() {
    const now = new Date();
    const JSTYear = now.getFullYear();
    const JSTMonth = String(now.getMonth() + 1).padStart(2, '0');
    const JSTDay = String(now.getDate()).padStart(2, '0');
    const JSTHour = String(now.getHours()).padStart(2, '0');
    const JSTMinute = String(now.getMinutes()).padStart(2, '0');
    const JSTSecond = String(now.getSeconds()).padStart(2, '0');

    return `${JSTYear}年${JSTMonth}月${JSTDay}日 ${JSTHour}時${JSTMinute}分${JSTSecond}秒`;
}

async function call_api(url) {
    const response = await fetch(url);
    return response.json();
}

function formatDateTime(datetime) {
    const year = datetime.slice(0, 4);
    const month = datetime.slice(4, 6);
    const day = datetime.slice(6, 8);
    const hour = datetime.slice(8, 10);
    const minute = datetime.slice(10, 12);
    const second = datetime.slice(12, 14);

    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    date.setUTCHours(date.getUTCHours() + 9);

    const JSTYear = date.getUTCFullYear();
    const JSTMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const JSTDay = String(date.getUTCDate()).padStart(2, '0');
    const JSTHour = String(date.getUTCHours()).padStart(2, '0');
    const JSTMinute = String(date.getUTCMinutes()).padStart(2, '0');
    const JSTSecond = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${JSTYear}年${JSTMonth}月${JSTDay}日 ${JSTHour}時${JSTMinute}分${JSTSecond}秒`;
}

const url = "https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_jp.json";
const fetchInterval = 3 * 60 * 1000;

let validTime = "";
let currentLocationName = "";

async function fetchData() {
    const time = await call_api(url);
    const latestData = time[time.length - 1];
    const baseTime = latestData["basetime"];
    validTime = latestData["validtime"];

    const map = new maplibregl.Map({
        container: 'map',
        zoom: 5,
        center: [138, 37],
        minZoom: 1,
        maxZoom: 22,
        style: {
            version: 8,
            sources: {
                osm: {
                    type: 'raster',
                    tiles: [
                        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    ],
                    tileSize: 256,
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                },
            },
            layers: [
                {
                    id: 'osm-layer',
                    source: 'osm',
                    type: 'raster',
                    minZoom: 0,
                    maxZoom: 18,
                }
            ]
        }
    });

    map.on('load', function () {
        map.addSource('rain_map', {
            type: 'raster',
            tiles: [
                `https://www.jma.go.jp/bosai/jmatile/data/nowc/${baseTime}/none/${validTime}/surf/hrpns/{z}/{x}/{y}.png`,
            ],
            minzoom: 1,
            maxzoom: 16,
            tileSize: 256,
            attribution: "<a href='https://www.jma.go.jp/bosai/nowc/' target='_blank'>雨雲の動き</a>"
        });

        map.addLayer({
            id: 'rain_map_layer',
            source: 'rain_map',
            type: 'raster',
            paint: {
                'raster-opacity': 0.7
            },
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-left');
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 200, unit: 'metric' }));

        document.getElementById('info').innerHTML = "情報を取得中...";

        const locations = [
            { coords: [126.0, 21.4], zoom: 5.0, name: '台風がよく発生するところ' },
            { coords: [126.8, 25.5], zoom: 6.0, name: '沖縄' },
            { coords: [129.9, 32.0], zoom: 6.5, name: '熊本' },
            { coords: [130.5, 35.7], zoom: 6.0, name: '韓国' },
            { coords: [136.7, 35.5], zoom: 6.5, name: '岐阜' },
            { coords: [140.3, 38.0], zoom: 7.0, name: '福島' },
            { coords: [141.4, 42.7], zoom: 6.0, name: '北海道' },
            { coords: [139.1, 36.3], zoom: 4.0, name: '中心' }
        ];

        function animateMap(index) {
            if (index >= locations.length) {
                index = 0;
            }

            if (autoZoomEnabled) {
                currentLocationName = locations[index].name;

                map.flyTo({
                    center: locations[index].coords,
                    zoom: locations[index].zoom,
                    essential: true,
                    speed: 0.5,
                    curve: 1.2
                });

                setTimeout(() => animateMap(index + 1), 8000);
            }
        }

        animateMap(0);
    });
}

fetchData();
setInterval(fetchData, fetchInterval);

setInterval(() => {
    document.getElementById('info').innerHTML = `Version: β0.0.1<br>
                                                 雲のデータ: ${formatDateTime(validTime)}<br>
                                                 現在時刻: ${displayCurrentTime()}<br>
                                                 現在表示している位置はおおよそ ${currentLocationName} です。`;
}, 1000);
