// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
var Git=require('nodegit');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');

	let options = [
	{
		label:"Clone the experiment repository",
		description:"Clones the experiment repository from the Virtual Labs github",
	},
	{
		label:"Command 2",
		description:"Build the experiment on the local machine",
	},
	{
		label:"Command 3",
		description:"Run validations and performance measurement",
	},
	{
		label:"Command 4",
		description:"Instantiate a web-server",
	}
	];
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'virtual-labs-experiment-generator.virtualLabs', 
		async function () {
			const functionality = await vscode.window.showQuickPick(options)
			if(functionality==null) return;
			if(functionality.label=="Clone the experiment repository")
			{
				// ask for the experiment name
				const experimentName = await vscode.window.showInputBox({
					placeHolder: "Enter the experiment name",
					validateInput: text => {
						if (text.length < 1) {
							return 'Experiment name cannot be empty';
						}
						return null;
					}
				});
				if(experimentName==null) return;
				let link="https://github.com/virtual-labs/"+experimentName;
				// clone the repository
				Git.Clone(link, "./"+experimentName)
				.catch(function(err) { vscode.window.showErrorMessage(err); });
				// .then(function(repository) {
				// 	//check if the repo is valid
				// 	if(repository==null)
				// 	{
				// 		vscode.window.showErrorMessage('The repository is not valid');
				// 		return;
				// 	}
				// 	// Work with the repository object here.
				// 	vscode.window.showInformationMessage('Cloned '+experimentName+' to '+repository.workdir());
				// })
					
				
				
			}
			console.log(functionality.label);
			console.log(functionality.description);

		// Display a message box to the user
		vscode.window.showInformationMessage('Virtual Labs Experiment Generator is now Active!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
