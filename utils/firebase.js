const dotenv = require('dotenv').config()
const firebase = require('firebase');
require('firebase/storage');

module.exports = class Firebase {
    constructor() {
        this._config = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
      }

      this.init()
    }

    init() {
        firebase.default.initializeApp(this._config)
    }

    static storage() {
        return firebase.default.storage()
    }

    static uploadImage(file, date, usernameHashed) {
        return new Promise((resolve, reject) => {
            let uploadTask = Firebase.storage().ref(usernameHashed + date).child(`${date}_${file.originalname}`).put(file.buffer, {
                customMetadata: {
                    auth: process.env.FIREBASE_UPLOAD_KEY,
                },
                size: file.size,
                contentType: file.mimetype,
            })
 
            uploadTask.on('state_changed', snapshot => {}, err => {
                reject(err)
            }, () => {
                uploadTask.snapshot.ref.getDownloadURL().then(url => {
                    resolve(url)
                })
            })
        })
    }
}