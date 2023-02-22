// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const simpleGit = require('simple-git');
const fs = require('fs');
const {JSDOM} = require("jsdom");
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
const request = require('request');
const {clone, addBranch, addOrganization} = require("./webview.js");
// function clone(experimentName,organization,branch) {
// 	const vscode = acquireVsCodeApi();
// 	const expName = experimentName;
// 	const org = organization;
// 	const branches = branch;
// 	vscode.postMessage({
// 		command: 'clone',
// 		experimentName: expName,
// 		organization: org,
// 		branch: branches
// 	});
// }
// function addBranch(){
// 	const vscode = acquireVsCodeApi();
// 	vscode.postMessage({
// 		command: 'addBranch'
// 	});
// }	
// function addOrganization(){
// 	const vscode = acquireVsCodeApi();
// 	vscode.postMessage({
// 		command: 'addOrganization'
// 	});	
// }
//const getWebviewContent = require('./webview.js').getWebviewContent;
/**
 * @param {vscode.ExtensionContext} context
 */
function handlerFn(err) {
	if (err) {
		console.log(err);
		vscode.window.showErrorMessage("Error while cloning the repository");
	}
	else {
		vscode.window.showInformationMessage("Repository cloned successfully");
	}
}

function activate(context) {

	console.log('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');

	let options = [
		{
			label: "Clone the experiment repository",
			description: "Clones the experiment repository from the Virtual Labs github",
		},
		{
			label: "Command 2",
			description: "Build the experiment on the local machine",
		},
		{
			label: "Command 3",
			description: "Run validations and performance measurement",
		},
		{
			label: "Command 4",
			description: "Instantiate a web-server",
		}
	];

	let disposable = vscode.commands.registerCommand(
		'virtual-labs-experiment-generator.virtualLabs',
		async function () {
			const functionality = await vscode.window.showQuickPick(options)
			if (functionality == null) return;
			if (functionality.label == "Clone the experiment repository") {

				// open a vs code webview dialog box to enter the experiment name and branch
				const panel = vscode.window.createWebviewPanel(
					'virtualLabs', // Identifies the type of the webview. Used internally
					'Virtual Labs Experiment Generator', // Title of the panel displayed to the user
					vscode.ViewColumn.One, // Editor column to show the new webview panel in.
					{
						enableScripts: true
					} 
				);
				
				panel.webview.html = getWebviewContent();
				panel.webview.onDidReceiveMessage( message => {
					switch (message.command) {
						case'clone':
							const experimentName = message.experimentName;
							const branch = message.branch;
							const organization = message.organization;
							const link = 'https://github.com/' + organization + '/' + experimentName + '.git';
							const git = simpleGit();
							const options = ['--depth', '1', '--branch', branch];
							const path=vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + experimentName;							
							// check if the experiment is already cloned
							if(fs.existsSync(path)){
								vscode.window.showInformationMessage("Experiment Repository already exists");
								panel.dispose();
								break;
							}							
							git.clone(link, path, options, handlerFn);	
							panel.dispose();						
							break;
						 case 'addBranch':
							// take a text input from the user and add it to the config file using async await
							async function addBranch(){
								const branch = await vscode.window.showInputBox( { 
									placeHolder: "Enter the branch name",
									validateInput: (value) => {
										if(value == null) return;
										if(value.length == 0) return "Branch name cannot be empty";
									}
								});
								if(branch == null) return;
								// check if the branch already exists
								if(config.branches.includes(branch)){
									vscode.window.showInformationMessage("Branch already exists");
									panel.webview.html = getWebviewContent();
									return
								}
								else{
									config.branches.push(branch);
									fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
									panel.webview.html = getWebviewContent();
									vscode.window.showInformationMessage('Branch added successfully');
								}
							}
							addBranch();	
							break;	
						case 'addOrganization':
							// take a text input from the user and add it to the config file using async await
							async function addOrganization(){
								const organization = await vscode.window.showInputBox( { 
									placeHolder: "Enter the organization name",
									validateInput: (value) => {
										if(value == null) return;
										if(value.length == 0) return "Organization name cannot be empty";
									}
								});
								if(organization == null) return;
								// check on github if the organization exists
								
								
								if(config.organizations.includes(organization)){
									vscode.window.showInformationMessage("Organization already exists");
									panel.webview.html = getWebviewContent();
									return;
								}
								const url='https://github.com/' + organization;
								request.head(url,(error,response,body)=>{
									if(error){
										console.log(error);
										return;
									}
									if(response.statusCode==404){
										vscode.window.showErrorMessage("Organization does not exist");
										panel.webview.html = getWebviewContent();
										return;
									}
									else{
										config.organizations.push(organization);
										fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
										panel.webview.html = getWebviewContent();
										vscode.window.showInformationMessage('Organization added successfully');
									}
									console.log(response.statusCode);
								});
							}
							addOrganization();
							break;
					}
				}, undefined, context.subscriptions);
			}

			vscode.window.showInformationMessage('Virtual Labs Experiment Generator is now Active!');
		});

	context.subscriptions.push(disposable);
}



function getWebviewContent(){
   // return the html content and update the global variables EXP_NAME and BRANCH
   // get a list of branches from the config file

//    const branches = config.branches;
//    const organizations = config.organizations;
  // return the file webview.html
	const html = fs.readFileSync(__dirname + '/webview.html', 'utf8');
	console.log(html)
	const dom = new JSDOM(html);
	const { document } = dom.window;

	// // const js = fs.readFileSync(__dirname + '/webview.js', 'utf8');
	// // const script = document.createElement('script');
	// // script.textContent = js;
	// // document.body.appendChild(script);

	// // fetch config, do dom manipulation and add the data to html dropdowns
	const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	const organization = config.organizations;
	const branch = config.branches;

	const branches = document.getElementById('branch');

	for (let i = 0; i < branch.length; i++) {
		const option = document.createElement('option');
		option.text = branch[i];
		branches.add(option);
	}
	const organizations = document.getElementById('organization');

	for (let i = 0; i < organization.length; i++) {
		const option = document.createElement('option');
		option.text = organization[i];
		organizations.add(option);
	}

	const experimentName = document.getElementById("experimentName")
	const org = document.getElementById("organization")
	const branc = document.getElementById("branch")

	const submitButton = document.getElementById('submit');
	submitButton.addEventListener('click', clone(experimentName,org,branc));

	const addBranchButton = document.getElementById('addBranch');
	addBranchButton.addEventListener('click', addBranch);

	const addOrganizationButton = document.getElementById('addOrganization');
	addOrganizationButton.addEventListener('click', addOrganization);
	
	// update the html content after adding the script
	const updatedHtml = dom.serialize();
	return updatedHtml;

//    return html;    
}


// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
