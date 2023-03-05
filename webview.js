const vscode = acquireVsCodeApi()

function clone(experimentName, organization, branch) {
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
function addBranch() {
	vscode.postMessage({
		command: 'addBranch'
	});
}
function addOrganization() {
	vscode.postMessage({
		command: 'addOrganization'
	});
}

const document = vscode.document

const experimentName = document.getElementById("experimentName")
const org = document.getElementById("organization")
const branc = document.getElementById("branch")

const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', clone(experimentName, org, branc));

const addBranchButton = document.getElementById('addBranch');
addBranchButton.addEventListener('click', addBranch);

const addOrganizationButton = document.getElementById('addOrganization');
addOrganizationButton.addEventListener('click', addOrganization);

