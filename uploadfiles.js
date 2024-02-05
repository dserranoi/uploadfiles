
import  CryptoJS from 'crypto-js';

/**
 * 
 * @param hexstring 
 * @returns file content converted to base 64
 */
function hexToBase64(hexstring) {
  return btoa(
    hexstring
      .match(/\w{2}/g)
      .map(function (a) {
        return String.fromCharCode(parseInt(a, 16));
      })
      .join("")
  );
}

/**
 * 
 * @param blob 
 * @returns file content encrypted using MD5 Algorithm 
 */
const getFileMD5 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsBinaryString(blob);
    reader.onloadend = function () {
      const hash = CryptoJS.MD5(
        CryptoJS.enc.Latin1.parse(reader.result)
      ).toString();
      resolve(hash);
    };
    reader.onerror = function (e) {
      reject(e);
    };
  });
};


/**
 * 
 * @param files -
 * Function that process the upload of selected files
 * 
 */

const upload = async (files) => {
    const filesArr = Array.from(files);

    Promise.all(filesArr.map((file) => getFileMD5(file)))
      .then((values) => {
        const hashes = Array.from(values).map(hexToBase64);
        // upload begins
        Promise.all(
          filesArr.map((file, idx) => {
            return new Promise((resolve, reject) => {
              const hash = hashes[idx];
              // resolve(file.name + hash)
              const data = {
                recordref: recordref,
                refid: refid,
                filename: file.name,
                filesize: file.size,
                md5: hash,
              };

              const querystring = `?recordref=${recordref}&refid=${refid}&filename=${file.name}&filesize=${file.size}&md5=${hash}`;

              fetch(`${apiURL}/example/attachments/new${querystring}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  "X-Requested-With": "XMLHttpRequest",
                },
                // body: JSON.stringify(data),
              })
                .then((response) => response.json())
                .then((signedRequest) => {
                  //
                  fetch(signedRequest.url, {
                    method: "PUT",
                    headers: {
                      ...signedRequest.headers,
                      "Content-Type": file.type,
                    },
                    body: file,
                  })
                    .then((response) => response)
                    .then((response) => {
                      resolve({
                        headers: signedRequest.headers,
                        url: signedRequest.url,
                        attachGUID: signedRequest.attachGUID,
                        md5: hash,
                        recordref: recordref,
                        refid: refid,
                        filename: file.name,
                        index: idx,
                        status: response.status,
                      });
                    })
                    .catch((e) => {
                      alert("... upload failed. notify user here ...");
                      reject(e);
                    });
                })
                .catch((e) => {
                  console.error(e);
                  alert(
                    "failed to contact s3 signing service. this may be a temporary service outage. please retry your request. upload aborted."
                  );
                  reject(e);
                });
            });
          })
        ).then((values) => {
          console.log("uploads complete!, validating uploads.");
          const reqs = Array.from(values);
          // const validateUploads  = reqs.map()
          Promise.all(
            reqs.map((req) => {
              return new Promise((resolve, reject) => {
                fetch(
                  `${apiURL}/example/attachments/${req.attachGUID}?recordref=${req.recordref}&refid=${req.refid}`,
                  {
                    method: "PATCH",
                  }
                )
                  .catch((e) => {
                    console.error(e);
                    alert(
                      "file upload could not be verified. the upload was not successful."
                    );
                    console.log(
                      "failed to acquire presigned url to check for object existence. aborting upload success.",
                      req
                    );
                    reject(req);
                  })
                  .then((response) => response)
                  .then((response) => {
                    console.log("validation completed");
                    resolve({
                      uploadRequest: req,
                      response: response,
                    });
                  });
              });
            })
          ).then((uploads) => {
            showAttachments(false);
            console.log('uploads',uploads);
            setCount(count + 1);
          });
        });
      })
      .then(console.log("everything was done"));
  };
