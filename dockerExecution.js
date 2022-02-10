const fs = require('fs');
const exec = require('child_process').exec;

class DockerExecution {
    constructor(path, mainFile, model, timeoutValue = 20) {
        this.path = path;
        this.mainFile = mainFile;
        this.model = model;
        this.timeoutValue = timeoutValue;
        this.outputFolder = "output/" + this.model;

        const config = this.readConfig();
        this.basePath = config['umplePath'];
        this.baseOutputPath = config['tempPath'];
        this.tempContainerName = config['tempContainerName'];
    }

    run(callback) {      
        // Make output folder where the output files will be written
        this.makeOutputFolder();
        
        const command = `sh dockerTimeout.sh ${this.timeoutValue}s -i -t --network none -v ${this.basePath}${this.path}:/input/:ro -v ${this.baseOutputPath}/${this.model}:/output/ ${this.tempContainerName} ${this.mainFile}` 
        console.log("Docker command:'",command,"'"); 
        exec(command); // Execute docker for Java execution

        this.listenToChanges(callback);
    }

    listenToChanges(callback) {
        //variable to enforce the timeout_value
        let timeValue = 0;

        // Check For File named "completed" or "errors" after every 1 second
        const intid = setInterval(() => {
            timeValue++;
        
            // Listen for the completed file
            fs.readFile(this.outputFolder + '/completed', 'utf8', (err, completeData) => {
                // if file is not available yet and the file interval is not yet up carry on
                // else if file is found simply display a message and proceed
                if(err && timeValue < this.timeoutValue) {
                    return;
                } else if (timeValue < this.timeoutValue) {
                    //check for possible errors
                    fs.readFile(this.outputFolder + '/errors', 'utf8', (err, errorData) => {
                        if(errorData) {
                            console.log("Error file: ", errorData)
                        }
                        console.log("Complete file: ", completeData);

                        callback(errorData, completeData.toString())
                    });
                } else { 
                    // if time is up. Save an error message to the data variable
                    // Since the time is up, we take the partial output and return it.
                    fs.readFile(this.outputFolder + '/logfile.txt', 'utf8', (err, partialData) => {
                        if (!partialData) partialData = "";
                        partialData += "\nExecution Timed Out. Maximum allowed time is " + this.timeoutValue + " seconds.";

                        fs.readFile(this.outputFolder + '/errors', 'utf8', (err, errorData) => {
                            callback(errorData ,partialData.toString())
                        });
                    });
                }

                // If time is finished, remove directory and clear timer
                this.deleteOutputFolder();
                clearInterval(intid);
            });
        }, 1000);
    }

    
    makeOutputFolder() {
        if(fs.existsSync(this.outputFolder)) {
            this.deleteOutputFolder();
        } else {
            fs.mkdirSync(this.outputFolder);
        }
    }

    deleteOutputFolder() {
        try {
            console.log("ATTEMPTING TO REMOVE: " + this.outputFolder);
            fs.rmSync(this.outputFolder, { recursive: true });
            console.log(`${this.outputFolder} is deleted!`);
        } catch (err) {
            console.error(`Error while deleting ${this.outputFolder}.`);
        }
    }

    readConfig() {
        const file = fs.readFileSync('./config.cfg', 'utf8');
        const config = file.split('\r\n');
        
        const obj = {};
        for(let c of config) {
            const cur = c.split('=');
            obj[cur[0]] = cur[1];
        }
        console.log("Given Config:");
        console.log(obj);
        return obj;
    }

}

module.exports = DockerExecution;