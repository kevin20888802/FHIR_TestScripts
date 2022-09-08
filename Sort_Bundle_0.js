const fs = require("fs");

/** 設定 */
// 測試json檔案路徑
//var testFilePath = "./TestFiles/bundle_test_1.json";
var testFilePath = "./TestFiles/Bundle-bun-example-tw-1.json";
var outputFilePath = "./Output/SortedBundle.json"

function main() {
    // 取得測試資料
    const testData = JSON.parse(fs.readFileSync(testFilePath, 'utf8'));
    let sortedBundle = sortBundle(testData,getBundleSortList(getObjectReferenceList(testData)));
    //console.log(getObjectReferenceList(testData));
    //getObjectReferenceList(testData)
    //console.log(sortedBundle);
    fs.writeFileSync(outputFilePath,JSON.stringify(sortedBundle));
}

/**
 * 將Bundle的Entry依照Bundle排序表排序
 */
function sortBundle(inputData,sortList) {
    let newEntry = [];
    let oldEntry = inputData.entry;
    //console.log(sortList);
    // 將entry根據Bundle排序表從舊有的entry塞入資料
    for(let i = 0; i < sortList.length; i++) {
        for(let j = 0; j < oldEntry.length; j++) {
            if(oldEntry[j].fullUrl == sortList[i]) {
                newEntry.push(oldEntry[j]);
                break;
            }
        }
    }
    inputData.entry = newEntry;
    return inputData;
}

/**
 * 藉由Reference關係表取得Bundle排序表
 */
function getBundleSortList(ParentChildDict) {

    // 將父子關係表只留下父(沒有任何Reference的)
    let parentList = ParentChildDict;
    let sortList = [];

    // 先列出沒有Reference的 然後列出有Reference也有Child的 之後列出只有Reference的
    for(let i = 0; i < parentList.length; i++) {
        if(parentList[i].References.length <= 0)
        {
            if(!sortList.includes(parentList[i].fullUrl)) {
                sortList.push(parentList[i].fullUrl);
            }
        }
    }
    
    for(let i = 0; i < parentList.length; i++) {
        if(parentList[i].References.length > 0 && parentList[i].Child.length > 0)
        {
            for(let j = 0; j < parentList[i].Child.length; j++) {
                if(!sortList.includes(parentList[i].Child[j])) {
                    sortList.push(parentList[i].Child[j]);
                }
            }
        }
    }
    
    for(let i = 0; i < parentList.length; i++) {
        for(let j = 0; j < parentList[i].Child.length; j++) {
            if(!sortList.includes(parentList[i].Child[j])) {
                sortList.push(parentList[i].Child[j]);
            }
        }
    }

    console.log(sortList);
    return sortList;
}

/**
 * 從bundle取得Reference表
 */
function getObjectReferenceList(inputData) {

    let allObjects = inputData.entry;
    let output = [];

    // 開始建立Reference關係資料
    for(let i = 0; i < allObjects.length; i++) {
        let parentChildData = {
            "fullUrl":allObjects[i].fullUrl,
            "References":[],
            "Child":[]
        };
        output.push(parentChildData);
    }

    for(let i = 0; i < allObjects.length; i++)
    {
        getObjectReferences(allObjects[i],output[i]);
    }

    // 將Reference轉換成Child
    for(let i = 0; i < output.length; i++)
    {
        for(let j = 0; j < output[i].References.length; j++)
        {
            for(let k = 0; k < output.length; k++)
            {
                if(output[k].fullUrl == output[i].References[j])
                {
                    output[k].Child.push(output[i].fullUrl);
                }
            }
        }
    }
    console.log(output);
    return output;
}

/**
 * 遞迴尋找某FHIR物件的所有Reference
 */
function getObjectReferences(inputData, parentChildData) {
    let dataFields = Object.keys(inputData);
    let output = parentChildData;
    for(let i = 0; i < dataFields.length; i++) {
        // 如果該欄位是reference
        if(dataFields[i] == "reference") {
            // 將reference加入
            output.References.push(inputData[dataFields[i]]);
        }
        // 如果是某個物件而且有往更深就
        else if (typeof(inputData[dataFields[i]]) == "object" && Object.keys(inputData[dataFields[i]]).length > 0) {
            getObjectReferences(inputData[dataFields[i]], output);
        }
    }
    return output;
}

main();