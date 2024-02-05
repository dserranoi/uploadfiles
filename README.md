# Upload Files
This is a cool way to handle files and submit them to any backend using only JS. Which consists of 3 important functions: upload, getFileMD5 and hexToBase64.\
<br/>
## upload 
This is the main function which calls the other 2, to process files encryption and convert from heex to base 64 eventually. Also, this function would be the one that is called on the form submission. 
This function does heavy use of [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
### Process of the upload
Files passed are processed in a first Promise, using the [all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) static method (let's called 1st Promise.all) which expects an array of values, each file does the following cycle:
1. File is encrypted using [cryptojs](https://cryptojs.gitbook.io/docs/) library with MD5 algorithm. 
On the callback function of the 1st Promise.all, the values returned which are the encrypted files, are converted from hex to base 64.
###
After such convertion 2nd Promise.all is created; - each file does the following cycle: 
1. Creates a new Promise.
2. Inside the Promise, creates a request to fetch a presigned URL to connect to AWS s3, and also inserts the details of the files in a local database.
3. Calls back the presigned URL and uploads the file to s3
4. It resolves the Promise, and it continues with the next file
###
Once 2nd Promise.all  is resolved on the callback function, we are creating the 3rd Promise.all to process again the files; each file does the following cycle :
1. Makes a request to local database to update details of the file, it updates a boolean field that represents the precense of the it on s3.
2. Promise is resolved and next file is processed.


