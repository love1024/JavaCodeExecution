# JavaCodeExecution
A way to securely run Java code in docker containers.

# Setup
1. Change config.cfg file
2. Run setup.sh

# Config.cgf
__umplePath__  
Path to the umple ump folder where temporary user folders are created.  
__tempPath__  
A directory where temporary files can be written.  
__mainContainerName__  
Name of always running container.  
__tempContainerName__  
Name of temporary java container created for Java execution.