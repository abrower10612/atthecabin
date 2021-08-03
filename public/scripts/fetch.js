// A simple async POST request function
const getData = async (url = '') => {
  const response = await fetch(url, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json'
      }      
  })
  return response;
}

const postData = async (url = '', data = {}, csrf='', method='POST') => {  
  const response = await fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf
      },
      body: JSON.stringify(data)
  });  
  return response;
}

const deleteData = async (url = '', csrf='') => {  
  const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf
      }       
  })  
  return response;
}