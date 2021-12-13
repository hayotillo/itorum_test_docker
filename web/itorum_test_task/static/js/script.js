function initPublicOrderPage() {
    let weekSelect = document.getElementById('week-select');
    weekSelect.addEventListener('change', function () {
        loadPublicPageTable(this.value);
    })
    loadPublicPageTable(1);
    loadWeekSelect();
}

function initOrderPage() {
    loadPage(1)
    let pages = document.getElementsByClassName('page-item');
    if (pages.length > 0) {
        pages[0].classList.add('active');
    }
}

function getRow(data, isNew) {
    let row = document.createElement('tr');
    let id = document.createElement('td');
    let price = document.createElement('td');
    let client = document.createElement('td');
    let date = document.createElement('td');
    let actionButton = document.createElement('button');

    if (isNew) {
        // new price
        let newPrice = document.createElement('input');
        newPrice.setAttribute('type', 'text');
        newPrice.className = 'form-control';
        price.append(newPrice);

        // new client name
        let newClientName = document.createElement('select');
        for (let i=0; i<data.length; i++) {
            let option = document.createElement('option')
            option.append(data[i].name)
            option.setAttribute('value', data[i].id)
            newClientName.appendChild(option)
        }

        newClientName.className = 'form-control';
        client.append(newClientName);

        actionButton.innerText = 'Save';
        actionButton.className = 'btn btn-success';
        actionButton.addEventListener('click', function () {
            const cd = new Date();
            const currentDate = cd.getFullYear() + '-' + cd.getMonth() + '-' + String(cd.getDate()).padStart(2, '0')
            const inputData = {'price': newPrice.value, 'client': newClientName.value, 'date': currentDate}
            saveRow(0, inputData);
        });
    }
    else if(typeof data !== 'undefined') {
        id.append(data.id);
        price.append(data.price);
        client.append(data.client_name);
        date.append(data.created_at);
        actionButton.innerText = 'Delete';
        actionButton.className = 'btn btn-danger';

        actionButton.addEventListener('click', function (){
            deleteOrder(data.id);
        });
    }

    row.append(id);
    row.append(price);
    row.append(client);
    row.append(date);
    row.append(actionButton);

    return row;
}

function loadPage(page) {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        loadOrderTable(this.response);

        let pages = document.querySelectorAll('#pagination li');
        for(let i=0; i<pages.length; i++) {
            if ((i + 1) !== parseInt(page)) {
                pages[i].classList.remove('active');
            }
            else {
                pages[i].classList.add('active');
            }
        }
    }

    if (isNaN(parseInt(page))) {
        page = 1
    }
    xhttp.open("GET", `/order/page-data/?page=${page}`);
    xhttp.send();
}

function saveRow(id, data) {
    if (Object.keys(data).length > 0) {
        let formData = new FormData();
        for(let i=0; i<Object.keys(data).length; i++) {
            const key = Object.keys(data)[i];
            formData.append(key, data[key])
        }
        const xhttp = new XMLHttpRequest();
        xhttp.onload = function () {
            const activeItem = document.getElementsByClassName('active');
            loadPage(activeItem[0].firstElementChild.innerText)
        }
        xhttp.open('POST', '/order/save/'+id);
        xhttp.setRequestHeader('X-CSRFToken', getToken())
        xhttp.send(formData);
    }
}

function deleteOrder(id) {
    if (confirm('Are you sure?')) {
        const xhttp = new XMLHttpRequest();
        xhttp.onload = function () {
            const data = JSON.parse(this.response);
            console.log(data);
            if (data.result) {
                loadPage(1);
                let pages = document.getElementsByClassName('page-item');
                for (let i=0; i<pages.length; i++) {
                    if (i == 0) {
                        pages[i].classList.add('active')
                    }
                    else {
                        pages[i].classList.remove('active')
                    }
                }
            }
        }
        xhttp.open('POST', `/order/delete/${id}`);
        xhttp.setRequestHeader('Content-Type', 'false');
        xhttp.setRequestHeader('X-CSRFToken', getToken())
        xhttp.send();
    }
}

function getToken() {
    const csrf = document.getElementsByName('csrfmiddlewaretoken');
    return csrf[0].value;
}

function loadOrderTable(response, isAdd) {
    let tbody = document.getElementById("order-list");
    if (!isAdd) {
        tbody.innerHTML = null
    }
    const data = JSON.parse(response);
    if (typeof data === 'object' && data !== null) {
        const orders = data.orders;
        const pages = data.pages;

        let pagination = document.getElementById('pagination');
        pagination.innerHTML = null;
        for (let i=0; i<Object.keys(pages).length; i++) {
            let li = document.createElement('li');
            let a = document.createElement('a');

            a.innerText = pages[i];
            a.setAttribute('href', '!#');
            a.classList.add('page-link');

            li.classList.add('page-item');

            li.append(a);

            li.addEventListener('click', function (e){
                e.preventDefault();
                loadPage(a.innerText);
            });

            pagination.append(li);
        }

        for(let i=0; i<Object.keys(orders).length; i++) {
            tbody.append(getRow(orders[i]));
        }
        tbody.append(getRow(data.clients, true));
    }
}

// public page
function loadWeekSelect() {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        const data = JSON.parse(this.response);
        if (typeof data == 'object' && data !== null) {
            let weekSelect = document.getElementById('week-select');
            const weeks = data.weeks;
            for (let i=0; i<Object.keys(weeks).length; i++) {
                let option = document.createElement('option');
                option.value = (i + 1).toString();
                option.innerText = `${weeks[i].start} - ${weeks[i].end}`
                weekSelect.append(option)
            }
        }
    }
    xhttp.open('GET', '/order/week-select-data')
    xhttp.send()
}

function loadPublicPageTable(weekNumber) {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = function() {
        const data = JSON.parse(this.response);
        if (typeof data == 'object' && data !== null) {
            let tbody = document.getElementById('order-list')
            tbody.innerHTML = null
            let topSumPrice = 0;
            let topClientNames = [];
            for (let i=0; i<Object.keys(data.rows).length; i++) {
                const rowData = data.rows[i];
                let row = document.createElement('tr')
                let date = document.createElement('td')
                let clientNames = document.createElement('td')
                let sumPrice = document.createElement('td')

                date.append(rowData.date)
                clientNames.append(rowData.client_names)
                sumPrice.append(rowData.sum_price)
                // top names
                const namesSplit = rowData.client_names.split(';');
                Array.prototype.forEach.call(namesSplit, function (name) {
                    topClientNames.push(name.replace(/\s/g, ''));
                })
                // top sum
                const sum = parseFloat(rowData.sum_price);
                if (!isNaN(sum)) {
                    topSumPrice += sum;
                }

                row.append(date, clientNames, sumPrice)
                tbody.append(row)
            }
            let tfoot = document.getElementById('order-list-foot');
            let topRow = document.createElement('tr');
            let date = document.createElement('td');
            let clientNames = document.createElement('td');
            let sumPrice = document.createElement('td');
            const uniqueNames = [...new Set(topClientNames)];
            clientNames.append(uniqueNames.join('; '));
            sumPrice.append(topSumPrice.toString());
            topRow.append(date, clientNames, sumPrice);
            tfoot.innerHTML = topRow.innerHTML;
        }
    }
    xhttp.open('GET', `/order/public-page-data/${weekNumber ? weekNumber : 1}`)
    xhttp.send()
}
