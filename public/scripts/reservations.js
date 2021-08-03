const resList = document.getElementById('reservation-list');
const csrf = document.getElementById('_csrf');

function deleteReservation(item) {
  deleteData(`/reservation/${item.id}`, csrf.value)
  .then(res => {    
    if(res.status >= 200 && res.status < 300) {      
      let li = item.closest("li");
      li.parentNode.removeChild(li);
    } else {
      throw new Error('An error occurred on the page: ' + res);
    } 
  })
  .catch(err => {
    console.log(err);
  });
}


resList.addEventListener('click', (event) => {
  if (event.target.nodeName !== 'BUTTON') {
    return;
  }
  deleteReservation(event.target);
})