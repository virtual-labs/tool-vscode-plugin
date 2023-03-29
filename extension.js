// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const simpleGit = require('simple-git');
const fs = require('fs');
const request = require('request');
const shelljs = require('shelljs');

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
function getPanel1Content(scriptUri, styleUri) {
	return `	<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">	
			<title>Virtual Labs Experiment Generator</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>
		<body>
		<div class="command1">
			<button class="sideButton" id="command1">Clone the experiment repository</button>
		</div>
		<div class="command2">
			<button class="sideButton" id="command2">Run validations </button>
		</div>
		<div class="command3">
			<button class="sideButton" id="command3">Build the experiment on the local machine</button>
		</div>
		<div class="command4">
			<button class="sideButton" id="command4">Deploy the experiment locally</button>
		</div>
		<div class="command5">
			<button class="sideButton" id="command5">Clean the repository</button>
		</div>
		</body>
		<script src="${scriptUri}"></script>
		</html>
		`
}
function cloneWebView() {
	const panel = vscode.window.createWebviewPanel(
		'virtualLabs', // Identifies the type of the webview. Used internally
		'Virtual Labs Experiment Generator', // Title of the panel displayed to the user
		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
		{
			enableScripts: true
		}
	);


	const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	const scriptUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.js'));
	console.log(scriptUri);
	const styleUri = panel.webview.asWebviewUri(vscode.Uri.file(__dirname + '/webview.css'));

	panel.webview.html = getWebviewContent(scriptUri, styleUri);

	panel.webview.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'clone':
				const experimentName = message.experimentName;
				const branch = message.branch;
				const organization = message.organization;
				const link = 'https://github.com/' + organization + '/' + experimentName + '.git';
				const git = simpleGit();
				// const options = ['--depth', '1'];
				const path = vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + experimentName;
				// check if the experiment is already cloned
				if (fs.existsSync(path)) {
					vscode.window.showInformationMessage("Experiment Repository already exists");
					panel.dispose();
					break;
				}
				git.clone(link, path, (err) => {
					if (err) {
						vscode.window.showErrorMessage("Error cloning repository: " + err);
						panel.dispose();
					} else {
						// checkout the branch to dev 
						git.cwd(path);
						git.checkout(branch, (err) => {
							if (err) {
								vscode.window.showErrorMessage("Error checking out branch: " + err);
							} else {
								panel.dispose();
								vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(path)).then(() => {
									vscode.window.showInformationMessage("Experiment Repository cloned successfully and branch checked out");
								});
							}
						});
						
					}
				});
				
				panel.dispose();
				break;
			case 'addBranch':
				// take a text input from the user and add it to the config file using async await
				async function addBranch() {
					const branch = await vscode.window.showInputBox({
						placeHolder: "Enter the branch name",
						validateInput: (value) => {
							if (value == null) return;
							if (value.length == 0) return "Branch name cannot be empty";
						}
					});
					if (branch == null) return;
					// check if the branch already exists
					if (config.branches.includes(branch)) {
						vscode.window.showInformationMessage("Branch already exists");
						// reload the webview

						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						return
					}
					else {
						config.branches.push(branch);
						fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));
						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						vscode.window.showInformationMessage('Branch added successfully');
					}
				}
				addBranch();
				break;
			case 'addOrganization':
				// take a text input from the user and add it to the config file using async await
				async function addOrganization() {
					const organization = await vscode.window.showInputBox({
						placeHolder: "Enter the organization name",
						validateInput: (value) => {
							if (value == null) return;
							if (value.length == 0) return "Organization name cannot be empty";
						}
					});
					if (organization == null) return;


					if (config.organizations.includes(organization)) {
						vscode.window.showInformationMessage("Organization already exists");

						panel.webview.html = getWebviewContent(scriptUri, styleUri);
						return;
					}
					const url = 'https://github.com/' + organization;
					request.head(url, (error, response, body) => {
						if (error) {
							console.log(error);
							return;
						}
						if (response.statusCode == 404) {
							vscode.window.showErrorMessage("Organization does not exist");

							panel.webview.html = getWebviewContent(scriptUri, styleUri);
							return;
						}
						else {
							config.organizations.push(organization);
							fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config));

							panel.webview.html = getWebviewContent(scriptUri, styleUri);
							vscode.window.showInformationMessage('Organization added successfully');
						}
						console.log(response.statusCode);
					});
				}
				addOrganization();
				break;
		}
	});


}

function buildScript(command) {
	// check if the current directory has a package.json file
	const path = vscode.workspace.workspaceFolders[0].uri.fsPath;
	const packageJsonPath = path + '/package.json';
	// from this point on, use shelljs in the directory of the package.json file
	// locate nodejs binary on the system
	const nodePath = process.execPath;
	// set the path of the nodejs binary as the path of the shelljs
	shelljs.config.execPath = nodePath;
	shelljs.cd(path);
	// print the current directory
	console.log(shelljs.pwd());
	// dispaly a waiting vscode window
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Please wait while the command is running",
		cancellable: false
	}, (progress, token) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve();
			}, 1000);
		});
	});
	if (!fs.existsSync(packageJsonPath)) {
		// if not then create one using npm init using shelljs
		// npm init -y
		shelljs.exec('npm init -y');
	}
	shelljs.exec('npm i @virtual-labs/buildexp');
	let logs = null
	let panelTitle = ""
	switch (command) {
		case 'command2':
			vscode.window.showInformationMessage('Running validate command, you can see the logs in the window');
			logs = shelljs.exec('npx @virtual-labs/buildexp validate --expdesc --eslint');
			panelTitle = "Validation Logs"
			break;

		case 'command3':
			vscode.window.showInformationMessage('Running build command, you can see the logs in the window');
			logs = shelljs.exec('npx @virtual-labs/buildexp build --validateEslint --validateExpdesc --clean');
			panelTitle = "Build Logs"
			break;
		case 'command4':
			// check if the build directory exists
			const buildPath = path + '/build';
			if (!fs.existsSync(buildPath)) {
				vscode.window.showErrorMessage('Build directory does not exist, please run the build command first');
				return;
			}
			vscode.window.showInformationMessage('Running deploy command, you can see the logs in the window');
			logs = shelljs.exec('npx @virtual-labs/buildexp deploy');
			panelTitle = "Deploy Logs"
			break;
		case 'command5':
			vscode.window.showInformationMessage('Cleaning the build directory');
			logs = shelljs.exec('npx @virtual-labs/buildexp clean');
			panelTitle = "Clean Logs"
			return;
	}

	const panel = vscode.window.createWebviewPanel(
		'vlabs.buildexp',
		panelTitle,
		vscode.ViewColumn.One,
		{
			enableScripts: true
		}
	);
	// And set its HTML content as the logs	
	panel.webview.html = logs.stdout;
}
function activate() {
	vscode.window.showInformationMessage('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');

	console.log('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');
	let panel1 = null;
	panel1 = vscode.window.registerWebviewViewProvider(
		'vlabs.experimentView', // Identifies the type of the webview. Used internally

		{
			resolveWebviewView: (view) => {
				view.webview.options = {
					enableScripts: true,
				};
				const scriptUri = view.webview.asWebviewUri(vscode.Uri.file(__dirname + '/sidebar.js'));
				const styleUri = view.webview.asWebviewUri(vscode.Uri.file(__dirname + '/sidebar.css'));
				view.webview.html = getPanel1Content(scriptUri, styleUri);
				view.webview.onDidReceiveMessage((message) => {
					switch (message.command) {
						// close the webview panel after the user selects the command
						case 'command1':
							// check if a directory is open in vscode
							if (vscode.workspace.workspaceFolders == null) {
								vscode.window.showErrorMessage("Please open a directory in vscode");
								break;
							}
							cloneWebView();
							break;
						// in all other cases, build the script
						default:
							buildScript(message.command);
							break;
					}
				}
				);

			}
		}
	);

}


function getWebviewContent(scriptUri, styleUri) {

	const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
	const branches = config.branches;
	const organizations = config.organizations;
	const branchOptions = branches.map(branch => `<option value="${branch}">${branch}</option>`).join('');
	const organizationOptions = organizations.map(organization => `<option value="${organization}">${organization}</option>`).join('');


	return `
	<!DOCTYPE html>
		<html lang="en">

		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Virtual Labs Experiment Generator</title>
			<link rel="stylesheet" href="${styleUri}">
		</head>

		<body>
			<h1>Virtual Labs Experiment Generator</h1>
			<div class="Organization">
				<label for="organization">Organization</label>
				<select id="organization" name="organization">
					${organizationOptions}
						</select>
				<button class="smallButton"  id="addOrganization">Add Organization</button>
			</div>
			<div class="Experiment">
				<label for="experimentName">Experiment Repository Name</label>
				<div class="Name">
					<input type="text" id="experimentName" name="experimentName">
				</div>
			</div>
			<div class="Branch">
				<label for="branch">Branch</label>
				<select id="branch" name="branch">
					${branchOptions}
				</select>
				<button class="smallButton" id="addBranch">Add Branch</button>
			</div>
			<button id="submit" class="bigButton">Submit</button>
			
			<script  src="${scriptUri}"></script>
		</body>

		</html>`
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}
