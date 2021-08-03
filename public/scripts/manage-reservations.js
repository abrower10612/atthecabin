const resList = document.getElementById('reservation-list');
const csrf = document.getElementById('_csrf');

function manageReservation(item) {
  let status;
  let propertyId = item.id
  if (item.id.substring(0, 4) == "app_") {    
    status = "confirmed";
  } else { 
    status = "declined";
  }
  propertyId = item.id.substring(4);  
  return postData(`/admin/manage-reservation/${propertyId}`, {status: status}, csrf.value, "PATCH");
}

resList.addEventListener('click', (event) => {
  if (event.target.nodeName !== 'BUTTON') {
    return;
  }
  manageReservation(event.target)
  .then(res => {    
    if(res.status >= 200 && res.status < 300) {      
      let li = event.target.closest("li");
      li.parentNode.removeChild(li);
    } else {
      throw new Error('An error occurred on the page: ' + res);
    } 
  })
  .catch(err => {
    console.log(err);
  });
})