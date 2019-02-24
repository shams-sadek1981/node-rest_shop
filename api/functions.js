/**
 * 
 * @param { array } data 
 * @param { group by item } groupItemIndex 
 * @param { sum by item } sumItemIndex 
 */
exports.groupByAndSum = (readData, groupItemIndex, sumItemIndex) => {

    //-- remove first record for header
    const column = readData.shift();

    // processed Data
    const newData = twoColumnForGroupBy(readData, groupItemIndex, sumItemIndex)

    const newResult = groupBySum(newData)

    //-- sorting by A-Z
    newResult.sort((a, b) => a[0].toUpperCase() > b[0].toUpperCase())

    //-- set Header
    const header = [column[groupItemIndex], column[sumItemIndex]];
    newResult.unshift(header)

    return newResult;
}

//-- String Column & SUM Column
const twoColumnForGroupBy = (data, groupItemIndex, sumItemIndex) => {
    const newData = data.map((item, index) => {
        return [
            item[groupItemIndex],
            item[sumItemIndex]
        ]
    })

    return newData;
}

//-- Group By And Sum
const groupBySum = (data) => {
    let newResult = [];

    for (let rs of data) {

        const findIndex = newResult.findIndex(index => index[0] == rs[0])
        if (findIndex == -1) { // -1 means undefined 
            newResult.push(rs)
        } else {
            newResult[findIndex][1] = parseFloat(newResult[findIndex][1]) + parseFloat(rs[1])
        }
    }

    return newResult;
}