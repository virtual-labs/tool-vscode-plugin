const vscode = acquireVsCodeApi();

function pullRequest() {
  
  const title = document.getElementById("title").value;
  const personalAccessToken = document.getElementById("personalAccessToken").value;
  const description = document.getElementById("description").value;
  vscode.postMessage({
    command: 'pr',
    title: title,
    personalAccessToken: personalAccessToken,
    description: description
  });
}


const submitButton = document.getElementById('pr');
submitButton.addEventListener('click', pullRequest);


