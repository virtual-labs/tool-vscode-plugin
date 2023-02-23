// const vscode = require('vscode');
// const fs = require('fs');
// const path = require('path');
// require acquireVsCodeApi from the webview
// const {acquireVsCodeApi} = require('vscode-webview');

// using file Reader to read the config.json file



// const html = fs.readFileSync(__dirname + '/webview.html', 'utf8');



// const organization = config.organizations;
// const branch = config.branches;
// console.log(organization);
// console.log(branch);
// // Get a reference to the select element
// const myListDropdown = document.getElementById('branch');

// for (let i = 0; i < branch.length; i++) {
//     const option = document.createElement('option');
//     option.text = branch[i];
//     myListDropdown.add(option);
// }

// document.getElementById('organization').innerHTML = organization;
// document.getElementById('branch').innerHTML = branch;

const vscode = acquireVsCodeApi()

function clone(experimentName,organization,branch) {
	// const vscode = acquireVsCodeApi();
	const expName = experimentName;
	const org = organization;
	const branches = branch;
	vscode.postMessage({
		command: 'clone',
		experimentName: expName,
		organization: org,
		branch: branches
	});
}
function addBranch(){
	// const vscode = acquireVsCodeApi();
	vscode.postMessage({
		command: 'addBranch'
	});
}	
function addOrganization(){
	// const vscode = acquireVsCodeApi();
	vscode.postMessage({
		command: 'addOrganization'
	});	
} 

const document = vscode.document

	const experimentName = document.getElementById("experimentName")
	const org = document.getElementById("organization")
	const branc = document.getElementById("branch")

	const submitButton = document.getElementById('submit');
	submitButton.addEventListener('click', clone(experimentName,org,branc));

	const addBranchButton = document.getElementById('addBranch');
	addBranchButton.addEventListener('click', addBranch);

	const addOrganizationButton = document.getElementById('addOrganization');
	addOrganizationButton.addEventListener('click', addOrganization);
// module.exports = {
//     clone,
//     addBranch,
//     addOrganization
// }


