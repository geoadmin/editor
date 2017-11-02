import React from 'react';
import ReactDOM from 'react-dom';
import './favicon.ico'
import './styles/index.scss'
import App from './components/App';
import querystring from 'querystring';
import url from 'url';


const urlObj = url.parse(window.location.href);
let qsObj = querystring.parse(urlObj.query);


// Get the github_access_token from querystring (micro-github)
if(qsObj.access_token) {
  window.localStorage.setItem("github_access_token", qsObj.access_token);
  delete qsObj["access_token"];
  window.location.search = querystring.stringify(qsObj);

} else if(qsObj.code) {

  // Ask the github_access_token to gatekeeper
  const url = window.location.protocol + '//' + window.location.host +
      '/gatekeeper/authenticate/' + qsObj.code
  fetch(url).then((r) => r.json()).then((r) => {
    // Get the github_access_token
    window.localStorage.setItem('github_access_token', r.token);
    delete qsObj["code"];
    window.location.search = querystring.stringify(qsObj);
  });
}

ReactDOM.render(<App/>, document.querySelector("#app"));
