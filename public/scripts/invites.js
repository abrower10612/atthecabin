const propList = document.getElementById('invitation-list');
const csrf = document.getElementById('_csrf');

function respondToInvite(item) {
  let urlPath;
  let propertyId = item.id
  if (item.id.substring(0, 2) == "d_") {
    propertyId = item.id.substring(2);
    urlPath = "decline";
  } else { 
    urlPath = "accept";
  }
  return postData(`/user/invites/${propertyId}/${urlPath}`, {}, csrf.value, "POST");
}


propList.addEventListener('click', (event) => {
  if (event.target.nodeName !== 'BUTTON') {
    return;
  }
  respondToInvite(event.target)
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