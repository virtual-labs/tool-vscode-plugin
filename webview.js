const vscode = acquireVsCodeApi();

function clone() {
  
  const experimentName = document.getElementById("experimentName").value;
  const organization = document.getElementById("organization").value;
  const branch = document.getElementById("branch").value;
  vscode.postMessage({
    command: 'clone',
    experimentName: experimentName,
    organization: organization,
    branch: branch
  });
}

function addBranch(){
  
  vscode.postMessage({
    command: 'addBranch'
  });
}	
function addOrganization(){
 
 vscode.postMessage({
   command: 'addOrganization'
 });	
}   


const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', clone);

const addBranchButton = document.getElementById('addBranch');
addBranchButton.addEventListener('click', addBranch);

const addOrganizationButton = document.getElementById('addOrganization');
addOrganizationButton.addEventListener('click', addOrganization);

