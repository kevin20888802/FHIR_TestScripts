const mongoose = require('mongoose');
/**
 * 連線到資料庫
 */
module.exports.connectToMongoDB = function() {
    var config = {
        MONGODB_USER: "explorer",
        MONGODB_PASSWORD: "pGZzeYZMH2qQTk2vFkdMb5JuLZxwR2Ec",
        MONGODB_HOSTS: ["127.0.0.1"],
        //MONGODB_HOSTS: ["DESKTOP-PO3LP09"],
        MONGODB_PORTS: ["27017"],
        MONGODB_NAME: "dicom_data",
        MONGODB_SLAVEMODE: false
    };

    const id = config.MONGODB_USER;
    const pwd = encodeURIComponent(config.MONGODB_PASSWORD);
    const hosts = config.MONGODB_HOSTS;
    const ports = config.MONGODB_PORTS;
    const dbName = config.MONGODB_NAME;
    const slave = config.MONGODB_SLAVEMODE;
    const collection = {};
    let databaseUrl = "";
    hosts.forEach((host, index) => {
        if (index === 0) {
            databaseUrl += "mongodb://" + id + ":" + pwd + "@" + host + ":" + ports[0];
        } else {
            databaseUrl += "," + host + ":" + ports[index];
        }
    });
    //databaseUrl += "/" + dbName + "?replicaSet=rs";
    databaseUrl += "/" + dbName;
    console.log("# - 位址=" + databaseUrl);
    mongoose.connect(databaseUrl, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        auth: {
            authSource: config.MONGODB_AUTHDB,
            username: id,
            password: pwd
        }
    });
    db = mongoose.connection;
    db.on('error', function () {
        console.error.bind(console, '# MongoDB 連線錯誤 Error:');
    });
    db.once('open', function () {
        console.log("# Mongo DB 成功連線.");
    });
    return db;
}