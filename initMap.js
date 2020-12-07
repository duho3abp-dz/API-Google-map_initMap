async function initMap(props) {
    const state = {
        data: {}, 
        url: 'https://jsonplaceholder.typicode.com/todos/1', // сюда пишется урл сервера (сейчас указан тестовый)
        storesNode: document.querySelector('#stores-map'),
        infoBlock: document.querySelector('.b-stores--map--info'),
        filterBlock: document.querySelector('.b-stores--filters--collection'),
        titleBlock: document.querySelector('.b-stores--location-button--text'),
        iconMarkerDefault: '/assets/i/icons/marker-default.svg',
        iconMarkerActive: '/assets/i/icons/marker-active.svg',
        activeClassInfoBlock: 'b-stores--map--info---active',
        allMarkers: [], // сюда добавляются все маркеры
        allFillterQuantity: 0, // количество всех магазинов для фильтра все
        allFillters: [], // сюда добавляются все фильтры (кнопки)
        activeFilterClass: 'b-stores--filters--collection--clause---active'
    }

    if ( // проверка необходимых элементов на странице
        !state.storesNode || 
        !state.infoBlock || 
        !state.iconMarkerDefault ||
        !state.filterBlock ||
        !state.titleBlock
    ) return;

    if (props) {
        state.data = props;
    } else {
        await getData(state.url).then(props => {
            // state.data = props; // сюда передается массив с даннми по городу (ниже пример) !!! РАСКОММЕНТИРОВАТЬ !!!
            state.data = {country: 'Россия', city: 'Москва', brands: { // тестовый дефолтный пропс !!! УДАЛИТЬ !!!
                'Ашан' : [
                    {name: 'ТЦ Европейский', address: 'пл. Киевского Вокзала, 2', coordinates: {lat: 55.744959, lng: 37.566289}},
                    {name: 'ТЦ Атриум', address: 'улица Земляной Вал, 33', coordinates: {lat: 55.757569, lng: 37.659185}},
                    {name: 'ТЦ Метрополис', address: 'Ленинградское шоссе, 16А', coordinates: {lat: 55.823722, lng: 37.497141}}
                ],
                'Рив-Гош' : [
                    {name: 'ТЦ Мега', address: '21-й км Калужского ш., Москва, 117574', coordinates: {lat: 55.603867, lng: 37.489613}},
                    {name: 'ТЦ Вегас', address: 'МКАД 24 км (внешн.)', coordinates: {lat: 55.585599, lng: 37.724046}}
                ]
            }};
        });
    }

    const { // деструктуризация объекта state
        data,
        storesNode, 
        infoBlock, 
        iconMarkerDefault, 
        iconMarkerActive,
        activeClassInfoBlock,
        filterBlock,
        activeFilterClass,
        titleBlock
    } = state;

    // функция которая устанавливает дефолтные иконки для маркеров
    function setAllMarkersDefaultIcon() {
        state.allMarkers.forEach(marker => marker.setIcon(iconMarkerDefault));
    }

    // функция которая добавляет во внутрь блока информации актуальную информацию
    function createInfo(prop) { 
        const {name, address} = prop;

        infoBlock.innerHTML = `
            <div class="b-stores--map--info--title">${name}</div>
            <div class="b-stores--map--info--address">${address}</div>
        `;
        infoBlock.classList.add(activeClassInfoBlock);
    }
    
    // функция которая создает маркер исходя из поступивших данных
    function addAndCreateMarker(prop) {
        const marker = new google.maps.Marker({
            position: prop.coordinates,
            map: map,
            icon: iconMarkerDefault
        });

        state.allMarkers = [...state.allMarkers, marker]; // все маркеры складываются в стате

        marker.addListener('click', e => { // на маркер навешивается клик по которому
            setAllMarkersDefaultIcon(); // сначала всем маркерам назначается дефолтные иконки
            marker.setIcon(iconMarkerActive); // а конкретно нужному маркеру устанавливается иконка активного маркера
            createInfo(prop) // и добавляется информация по данному маркеру в блок с информацией
        });
    }

    // функция которая устанавливает фильтр 'Все'
    function setAllFillters() {
        for (let key in data.brands) { // перебирается объект с данными
            data.brands[key].forEach(store => { // внутри объекта перебирается массив с магазинами
                state.allFillterQuantity = state.allFillterQuantity + 1; // в стате добавляется общее количество магазинов
                bounds.extend(store.coordinates); // запускается функция по центрированияю по маркерам
                addAndCreateMarker(store); // запускается функция по созданию и добавленияю маркера
            });
        }
    }

    // функция которая создает кнопку фильтра
    function createElementFilter(name, quantity, active) {
        const filter = document.createElement('div');
        filter.classList.add(`b-stores--filters--collection--clause`);
        if (active) filter.classList.add(active);
        filter.innerHTML = `
            <div class="b-filters-button" name="${name}">
                <label class="b-filters-button--label" name="${name}">
                    <span class="b-filters-button--label--text" name="${name}">${name}</span>
                    <span class="b-filters-button--label--count" name="${name}">${quantity}</span>
                </label>
            </div>
        `;
        filterBlock.append(filter);
    }

    // функция создает элементы в блоке фильтр
    function createFilterElements() {
        filterBlock.innerHTML = ''; // очищаем блок с фильтрами
        setAllFillters(); // запуск функции коорая считает и устанавливает количество всех пинов в стате и добавляет пины на карту
        createElementFilter('Все', state.allFillterQuantity, activeFilterClass); // запуск функции которая создает первый фильтр 'Все'

        for (let key in data.brands) { // перебираем данные
            createElementFilter(key, data.brands[key].length); // запуск функции которая создает фильтры
        }

        state.allFillters = document.querySelectorAll(`.b-stores--filters--collection--clause`); // находим фильтры и устанавливаем в стате
    }

    // функция фильтрации маркеров
    function filterMarkers(name) {
        state.allMarkers.forEach(marker => marker.setMap(null)); // сначала удаляет все маркеры с карты
        infoBlock.classList.remove(activeClassInfoBlock); // закрывает попап с информацией

        if (name === 'Все') setAllFillters(); // проверка на ВСЕ, в случае тру запускается функция которая устанавливает все маркеры в данном городе

        for (let key in data.brands) {
            if (key === name) { // проверка на соответствие атрибута наме с ключами объекта с данными
                data.brands[key].forEach(store => { // перебо массива внутри нужного ключа
                    addAndCreateMarker(store); // создание и добавление маркера магазина
                });
            }
        }
    }

    // функция которая добавляет событие клика на блок с фильтрами
    function addEventToFilterBlock() {
        let change = true;
        filterBlock.addEventListener('click', e => {
            if (e.target === e.currentTarget) return;

            const nameAttribute = e.target.attributes.name.value;
            state.allFillters.forEach(elem => { 
                if (nameAttribute === elem.children[0].getAttribute('name')) {
                    if (elem.classList.contains(activeFilterClass)) {
                        change = false;      
                    } else {
                        change = true;   
                        elem.classList.add(activeFilterClass);
                    }
                } else {
                    elem.classList.remove(activeFilterClass);
                }
            });
            if (change) filterMarkers(nameAttribute);
        });
    }

    function createTitle() {
        const {country, city} = data;
        titleBlock.textContent = `${country}, ${city}`;
    }

    createTitle();

    const map = new google.maps.Map(storesNode, {
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
        },
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false
    });

    const bounds = new google.maps.LatLngBounds();

    createFilterElements();
    addEventToFilterBlock();

    map.fitBounds(bounds);
}

export default initMap;