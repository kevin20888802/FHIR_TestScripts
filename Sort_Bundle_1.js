/**
 * FHIR - 有父子相關reference的Bundle排序
 */

const fs = require("fs");

/**** 設定 ****/

// 測試json檔案路徑
//var testFilePath = "./TestFiles/bundle_test_1.json";
var testFilePath = "./TestFiles/Bundle-bun-example-tw-1.json";

// 寫出排序過之檔案路徑
var outputFilePath = "./Output/SortedBundle.json"

/*************/

function main() {
    // 取得測試資料
    const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    console.log(`==========排序Bundle========`);
    console.log(`# 排序前資料筆數 ${testData.entry.length}`);
    console.log(`============================`);
    let sortedBundle = sortBundle(testData,getBundleSortList(testData));
    console.log(`==========寫入檔案==========`);
    fs.writeFileSync(outputFilePath,JSON.stringify(sortedBundle));
    console.log(`============================`);
    console.log(`# 排序後資料筆數 ${sortedBundle.entry.length}`);
    console.log(`==========完成==============`);
}

/**
 * 將Bundle的Entry依照順序表排序
 */
function sortBundle(inputData, sortList) {
    let newEntry = [];
    let oldEntry = inputData.entry;
    // 將entry根據Bundle排序表從舊有的entry塞入資料
    for (let i = 0; i < sortList.length; i++) {
        for (let j = 0; j < oldEntry.length; j++) {
            if (oldEntry[j].fullUrl == sortList[i]) {
                newEntry.push(oldEntry[j]);
                break;
            }
        }
    }
    inputData.entry = newEntry;
    return inputData;
}

/**
 * 依照以下規則排出順序表
 * 在物件建立之前，其Reference必須先建立。
 * (被Reference的物件一定在Reference它的物件的前面。)
 * 一筆一筆一個迴圈慢慢加入即可
 */
function getBundleSortList(inputData) {
    let entryData = inputData.entry;
    let output = [];
    let refList = [];

    // 最多可嘗試列表幾次 (避免有物件Reference到非本Bundle或是不存在的物件導致永遠不會加入列表而形成的無限迴圈)
    let maxTryTimes = 0;

    for (let i = 0; i < entryData.length; i++) {
        let objRef = getObjectReferences(entryData[i], undefined);
        refList.push(objRef);
        if(maxTryTimes < objRef.References.length) {
            maxTryTimes = objRef.References.length;
        }
    }

    // 已嘗試列表幾次
    let triedTimes = 1;
    for (let i = 0; i < refList.length; i++) {
        // 檢查該物件是否尚未加入列表 
        if (!output.includes(refList[i].fullUrl)) {
            // 檢查是否符合上面提到的規則 "在物件建立之前，其Reference必須先建立。"
            let allReferenceOK = true;
            for (let j = 0; j < refList[i].References.length; j++) {
                if (!output.includes(refList[i].References[j])) {
                    allReferenceOK = false;
                    break;
                }
            }
            // 如果符合上面提到的規則 那就可以加入列表
            if (allReferenceOK) {
                console.log(`${refList[i].fullUrl} 符合規則 可以加入`);
                output.push(refList[i].fullUrl);
            }
        }

        // 如果迴圈到底
        if (i >= refList.length - 1) {
            console.log(`# 第${triedTimes}次檢查完成`);
            // 檢查是否所有物件已經加入列表
            let allObjListed = true;
            for (let j = 0; j < refList.length; j++) {
                if (!output.includes(refList[j].fullUrl)) {
                    allObjListed = false;
                }
            }
            // 有任何物件尚未加入列表就再次檢查
            if (allObjListed == false && triedTimes <= maxTryTimes) {
                i = -1;
                triedTimes += 1;
                console.log(`有物件尚未加入因此將再次檢查`);
            }
        }
    }
    console.log(`# 檢查完成`);
    console.log(`==========物件順序==========`);
    console.log(output);
    console.log(`============================`);
    return output;

}

/**
 * 遞迴尋找某FHIR物件的所有Reference
 */
function getObjectReferences(inputData, output) {
    let dataFields = Object.keys(inputData);
    if (output == undefined) {
        output = {
            fullUrl: inputData.fullUrl,
            References: []
        };
    }
    for (let i = 0; i < dataFields.length; i++) {
        // 如果該欄位是reference
        if (dataFields[i] == "reference") {
            // 將reference加入
            output.References.push(inputData[dataFields[i]]);
        }
        // 如果是某個物件而且有往更深就
        else if (typeof (inputData[dataFields[i]]) == "object" && Object.keys(inputData[dataFields[i]]).length > 0) {
            getObjectReferences(inputData[dataFields[i]], output);
        }
        // 如果是個陣列
        else if(typeof (inputData[dataFields[i]]) == "array")
        {
            
        }
    }
    return output;
}

main();