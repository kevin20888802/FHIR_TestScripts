const mongoose = require('mongoose');
const fs = require("fs");
const { connectToMongoDB } = require("./MongoDB_Connect_0");

/**** 設定 ****/
// 測試json檔案路徑
//var testFilePath = "./TestFiles/bundle_test_1.json";
var testFilePath = "./TestFiles/bundle_test_1_PUT.json";
var db = undefined;

/**
 * 主程式
 */
async function main() {
    // 取得測試資料
    const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    db = connectToMongoDB();
    await addBundle(testData);
    db.close();
}

/**
 * 將一個Bundle加入到MongoDB並執行各Entry的相對應動作
 */
async function addBundle(inputData) {
    session = await db.startSession();
    await session.withTransaction(async (theSession) => {
        try {
            // 對包內每個Entry做處理
            let theEntry = inputData.entry;
            for (let i = 0; i < theEntry.length; i++) {
                // 物件檢查
                let thisObj = theEntry[i];
                if (thisObj.resource.resourceType == undefined) {
                    throw Error(`物件沒有ResourceType`);
                }

                // [POST新增] 或是 [PUT更新]
                if (thisObj.request.method == "POST") {
                    await postDataToDB(thisObj, theSession);
                }
                else if (thisObj.request.method == "PUT") {
                    await putDataToDB(thisObj, theSession);
                }
            }

            // 測試 將bundle原始資料存到db
            var FHIR_Bundle = db.model('FHIR_Bundle', new mongoose.Schema({}, { strict: false }));
            await FHIR_Bundle.create([inputData], { session: theSession });

            // 測試 丟錯誤
            //throw Error("測試錯誤 ERRORRRRRRR");

            console.log("# Bundle 加入完成");
            await session.endSession();
        }
        catch (err) {
            // 有錯誤 中止交易(也會rollback所有有帶入session的動作)
            console.log("# 交易失敗 - 發生錯誤:\n" + err);
            await session.abortTransaction();
        }
    });
}

/**
 * 暫時用的 取得一個具備萬用Schema(strict:false)的 MongoDB Model
 */
function getFHIRModel(inputName)
{
    // 建立Schema
    var objSchema = new mongoose.Schema({FHIR_ID: { type: String }}, { strict: false });
    // FHIR_ID 為唯一值
    objSchema.index({"FHIR_ID": 1}, { unique: true,});
    // 建立或取得Model
    var objModel = db.model("FHIR_" + inputName, objSchema);
    return objModel;
}

/**
 * 處理Bundle內Entry是POST的物件
 */
async function postDataToDB(inputData, theSession) {
    return new Promise(async (resolve, reject) => {
        // 建立或取得Model
        var objModel = getFHIRModel(inputData.resource.resourceType);

        // 取得id
        let theID = inputData.fullUrl;
        inputData.resource["FHIR_ID"] = theID;

        // 開始加入
        await objModel.create([inputData.resource], { session: theSession }, function (err, doc) {
            if (err) {
                console.log(`# ${inputData.fullUrl} POST失敗`);
                reject(err);
            }
            else {
                console.log(`# ${inputData.fullUrl} POST成功`);
                resolve();
            }
        });
    });
}

/**
 * 處理Bundle內Entry是PUT的物件
 */
async function putDataToDB(inputData, theSession) {
    return new Promise(async (resolve, reject) => {
        try
        {
            // 建立或取得Model
            var objModel = getFHIRModel(inputData.resource.resourceType);
    
            // 取得ID (request.url去掉ResourceType+"/"的後面=ID)
            let theID = inputData.request.url.replace(new RegExp(`^[${inputData.resource.resourceType}/]*`), "");

            // 開始更新
            await objModel.findOneAndUpdate({ FHIR_ID: theID}, inputData.resource, { session: theSession });
            resolve();
            console.log(`# ${inputData.fullUrl} PUT成功`);
        }
        catch(err)
        {
            console.log(`# ${inputData.fullUrl} PUT失敗`);
            reject(err);
        }
    });
}

main();