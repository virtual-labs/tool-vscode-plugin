const vscode = acquireVsCodeApi();

function push() {
  
  const userName = document.getElementById("userName").value;
  const personalAccessToken = document.getElementById("personalAccessToken").value;
  const commitMessage = document.getElementById("commitMessage").value;
  vscode.postMessage({
    command: 'push',
    userName: userName,
    personalAccessToken: personalAccessToken,
    commitMessage: commitMessage
  });
}


const submitButton = document.getElementById('push');
submitButton.addEventListener('click', push);


