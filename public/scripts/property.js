const dateField = document.querySelector('.month-indicator > div');
const calendar = document.querySelector('.date-grid');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const propertyId = document.getElementById('propertyId');
const reservationId = document.getElementById('reservationId');
const reserve = document.getElementById('reserve');
const comments = document.getElementById('comments');
const checkin = document.getElementById('checkin');
const checkout = document.getElementById('checkout');
const csrf = document.getElementById('_csrf');
const errorBox = document.getElementById('errorBox');


let date = new Date();


function showError(msg) {
  errorBox.innerHTML = msg;
  errorBox.classList.remove('no-display');
}

function checkResponse(status, json) {
  if (status >= 200 && status < 300) {
    window.location = '/reservation/';
  } else if (status === 401) { //unauthorized
    showError('Unauthorized attempt to modify an existing reservation');  
  } else if(status === 409) { //no availability    
    showError('The dates you selected are unavailable.');
  } else if(status === 422) { //input error    
    let msg = json.errors.errors.map(x => {
      if (x.param === 'endDate') {
        checkout.classList.add('error');
      }
      if (x.param === 'startDate') {
        checkin.classList.add('error');
      }
      return x.msg;
    }).join('<br>');
    showError(msg);
  } else {
    showError("An error occurred on our end. We're sorry for the inconvenience.")
  }
}

function toggleWait() {
  document.getElementById('body').classList.toggle("wait");
}

function validate() {
  valid = true;
  if(!checkin.value) {
    valid = false;
    checkin.classList.add("error");
  }
  if(!checkout.value) {
    valid = false;
    checkout.classList.add("error");
  }
  return valid;
}

function postReservation() {    
  toggleWait();  
  errorBox.innerText = "";
  errorBox.classList.add('no-display');
  try {
    if (!validate()) {
      return;
    }
    let status;    
    let inDate = new Date(checkin.value);
    let outDate = new Date(checkout.value);    
    let method = (reservationId.value === '' ? 'POST' : 'PATCH');
    let url = `/reservation/${propertyId.value}/${reservationId.value}`;
    let body = {
      startDate: inDate.toISOString(),
      endDate: outDate.toISOString(),
      comments: comments.value
    };            
    postData(url, body, csrf.value, method)
    .then(res => {
      status = res.status;
      return res.json();
    })
    .then(res => {
      checkResponse(status, res);
    });
  } catch(err) {    
    showError("An error occurred on our end. We're sorry for the inconvenience.");
  } finally {
    toggleWait();
  }  
}

function parseISODate(timeStamp) {
  let parts = timeStamp.split(/[-T]+/);
  //subtract one from month, because they're zero based?
  return new Date(Date.UTC(parts[0], parseInt(parts[1]) - 1, parts[2]));
}

function paintTheDay(id, style) {
  let day = document.getElementById(id);
  if (day) {
    if (day.classList.contains('lower-right') || day.classList.contains('upper-left')) {
      day.classList.remove('lower-right');
      day.classList.remove('upper-left');
      style = 'unavailable';
    }
    day.classList.add(style);
  }
}

function loadReservation(startDate, endDate) {      
  const d1 = parseISODate(startDate);
  const d2 = parseISODate(endDate);  
  const monthStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));     
  const diff = d1 - monthStart;  
  const start = Math.ceil((d1 - monthStart) / 86400000) + 1;   
  const end = start + Math.ceil((d2 - d1) / 86400000);
  
  //do the two ends first
  paintTheDay(start.toString(), 'lower-right');
  paintTheDay(end.toString(), 'upper-left');  
  //now do in between
  for (let i = start + 1; i < end; i++) {
    paintTheDay(i.toString(), "unavailable")
  }
}

//loads the reservations
function loadReservations() {
  //get reservations from the server
  let yr = date.getFullYear();
  let mnth = date.getMonth();
  let start = new Date(Date.UTC(yr, mnth, 1));
  let end = new Date(Date.UTC(yr, mnth + 1, 0)); 
  let url = `/reservation/${propertyId.value}?`;
  url += new URLSearchParams( { 
    startDate: start.toISOString(),
    endDate: end.toISOString()
  }).toString();
  getData(url)
  .then(response => {
    if (response.status < 200 || response.status > 299) {
      throw new Error("We failed to find the reservations for this property. We're sorry for the inconvenience.")
    }
    return response.json();      
  })
  .then(res => {      
      res.reservations.forEach(x => loadReservation(x.startDate, x.endDate));      
  })
  .catch(err => {    
    showError(err);
  });  
}

//loads the calendar dates
function loadCalendar() {
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const firstDay = new Date(year, date.getMonth(), 1).getDay();
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();  
  
  let myHtml = "";
  //first load empty divs until we get to the first day of month  
  for(let day = 0; day < firstDay; day++) {
    myHtml += "<div></div>"
  }

  //now start loading buttons
  for(let day = 0; day < lastDay; day++) {
    myHtml += `<button id="${day + 1}">${day + 1}</button>`;
  }
  
  calendar.innerHTML = myHtml;

  //set the month and year text
  dateField.innerHTML = `${month} ${year}`;

  const today = new Date();
  let remove = (year === today.getFullYear() && date.getMonth() === today.getMonth());  
  prev.classList.toggle('hidden', remove);
  
  loadReservations();  
}

prev.addEventListener('click', () => {
  date = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  loadCalendar();
});

next.addEventListener('click', () => {
  date = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  loadCalendar();
});

if(checkin.value) {
  date = new Date(checkin.value);  
}
date = new Date(date.getFullYear(), date.getMonth(), 1);

loadCalendar();
reserve.addEventListener('click', () => postReservation());
checkin.addEventListener('change', () => {
  checkin.classList.remove('error');
});
checkout.addEventListener('change', () => {
  checkout.classList.remove('error');
});